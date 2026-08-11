import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalogSnapshot, rootNodes, type CatalogNode } from "../../live-catalog";
import { ancestryOf, brandOptions, excludedIdsFor, productsInSubtree, resolveStep } from "../../guided-wizard";
import { WizardOptionGrid } from "../../wizard-option-grid";
import { ProductBrowser } from "../../product-browser";
import { brandShowroomImageFor } from "../../brand-showroom-images";
import {
  BRAND_WIZARD_STEPS,
  CATEGORY_WIZARD_STEPS,
  ROOM_WIZARD_STEPS,
  STAGE_WIZARD_STEPS,
  WizardJourney,
  type WizardJourneySelection,
} from "../../wizard-journey";

// Category slugs are hierarchical: CategoriesService derives them as
// `parent.slug + "/" + name`, so most published categories are multi-segment.
// A catch-all keeps both shapes reachable at the same public URL.
type CategoryPageProps = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ q?: string; room?: string; stage?: string; brand?: string }>;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const [{ slug }, catalog] = await Promise.all([params, getCatalogSnapshot()]);
  const category = catalog.categories.find((item) => item.slug === slug.join("/"));
  if (!category) return {};
  const description = `Browse live ${category.name.toLowerCase()} products, specifications and project quote options on Buildanta.`;
  return { title: category.name, description, openGraph: { title: `${category.name} | Buildanta`, description } };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const [{ slug }, { q = "", room: roomSlug = "", stage: stageSlug = "", brand: brandFilter = "" }, catalog] = await Promise.all([
    params,
    searchParams,
    getCatalogSnapshot(),
  ]);
  const category = catalog.categories.find((item) => item.slug === slug.join("/"));
  if (!category) notFound();

  // A lens narrows which departments are offered and which subcategories are
  // hidden. It deliberately does not filter products by their room or stage
  // tag: with a thin catalogue that would empty most screens for no benefit.
  // Room and stage behave identically here, so one variable carries either.
  const lensParam = roomSlug ? "room" : stageSlug ? "stage" : "";
  const lens = roomSlug
    ? rootNodes(catalog.rooms).find((node) => node.slug === roomSlug)
    : stageSlug
      ? rootNodes(catalog.stages).find((node) => node.slug === stageSlug)
      : undefined;
  const excluded = excludedIdsFor(lens);
  // Every answer the customer has given travels with them. Dropping the brand
  // when they go a level deeper would silently undo a choice they just made.
  const carry = (extra: Record<string, string | null> = {}) => {
    const query = new URLSearchParams();
    if (lens && lensParam) query.set(lensParam, lens.slug);
    if (brandFilter) query.set("brand", brandFilter);
    for (const [key, value] of Object.entries(extra)) {
      if (value === null) query.delete(key);
      else if (value) query.set(key, value);
    }
    const encoded = query.toString();
    return encoded ? `?${encoded}` : "";
  };

  const step = resolveStep(catalog.categories, catalog.products, category.id, excluded);
  const crumbs: CatalogNode[] = ancestryOf(catalog.categories, step.current.id);
  const scoped = productsInSubtree(catalog.products, catalog.categories, step.current.id, excluded);
  const brands = brandOptions(scoped);
  const logoFor = new Map(catalog.brands.map((brand) => [brand.name, brand.logo]));
  const atLeaf = step.options.length === 0;
  const selectedBrand = brands.some((option) => option.brand === brandFilter) ? brandFilter : "";
  const needsBrandChoice = atLeaf && brands.length > 0 && !selectedBrand;
  const canShowProducts = atLeaf && (brands.length === 0 || Boolean(selectedBrand));
  const visibleProducts = selectedBrand
    ? scoped.filter((product) => product.brand === selectedBrand)
    : scoped;
  const journeySteps = lensParam === "stage"
    ? STAGE_WIZARD_STEPS
    : lensParam === "room"
      ? ROOM_WIZARD_STEPS
      : brandFilter
        ? BRAND_WIZARD_STEPS
        : CATEGORY_WIZARD_STEPS;
  const categoryStepIndex = journeySteps === STAGE_WIZARD_STEPS || journeySteps === ROOM_WIZARD_STEPS ? 2 : 1;
  const brandStepIndex = journeySteps.length - 2;
  const productStepIndex = journeySteps.length - 1;
  const journeyStep = step.options.length > 0 ? categoryStepIndex : needsBrandChoice ? brandStepIndex : productStepIndex;
  const journeySelections: WizardJourneySelection[] = [];
  if (lens) {
    journeySelections.push({
      label: lensParam === "stage" ? "Stage" : "Room",
      value: lens.name,
      href: lensParam === "stage" ? "/by-stage" : "/by-room",
    });
  }
  journeySelections.push({ label: "Category", value: step.current.name });
  if (selectedBrand) {
    journeySelections.push({
      label: "Brand",
      value: selectedBrand,
      href: `/categories/${step.current.slug}${carry({ brand: null })}`,
    });
  }

  return <main className="listing-page wizard-landing-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a><span>›</span><a href="/categories">Categories</a>
      {crumbs.map((item, index) => <span key={item.id} className="breadcrumb-part">
        › {index === crumbs.length - 1 ? item.name : <a href={`/categories/${item.slug}${carry()}`}>{item.name}</a>}
      </span>)}
    </nav>

    {(lens || selectedBrand) && (
      <div className="wizard-chips" aria-label="Active filters">
        <span>Narrowed by</span>
        {lens && <a className="wizard-chip" href={`/categories/${step.current.slug}${carry({ [lensParam]: null })}`}>
          {lens.name} <b aria-hidden="true">×</b><span className="sr-only">Remove the {lens.name} filter</span>
        </a>}
        {selectedBrand && <a className="wizard-chip" href={`/categories/${step.current.slug}${carry({ brand: null })}`}>
          {selectedBrand} <b aria-hidden="true">×</b><span className="sr-only">Choose a different brand</span>
        </a>}
      </div>
    )}

    <div className="page-intro category-page-intro wizard-intro">
      <div>
        <p>{lens ? `${lens.name.toUpperCase()} · BUILDANTA` : "BUILDANTA CATEGORY"}</p>
        <h1>{step.current.name}</h1>
        <span>{step.current.description || "Compare live products from approved suppliers and request project pricing."}</span>
        <small>{scoped.length} published {scoped.length === 1 ? "product" : "products"} in this section</small>
      </div>
      {step.current.imageUrl && <img src={step.current.imageUrl} alt={`${step.current.name} materials`} />}
    </div>

    <WizardJourney steps={journeySteps} currentStep={journeyStep} selections={journeySelections} />

    {step.options.length > 0 && (
      <WizardOptionGrid
        heading={`Shop ${step.current.name.toLowerCase()} by type`}
        subheading="Choose a type before comparing real products."
        options={step.options.map((option) => ({
          id: option.node.id,
          name: option.node.name,
          href: `/categories/${option.node.slug}${carry()}`,
          description: option.node.description,
          imageUrl: option.node.imageUrl,
          productCount: option.productCount,
        }))}
      />
    )}

    {/* Brand is a required final wizard step. Product cards and their filters
        stay hidden until the shopper has deliberately chosen a valid brand. */}
    {atLeaf && needsBrandChoice && (
      <WizardOptionGrid
        heading={`Choose your ${step.current.name.toLowerCase()} brand`}
        subheading="Select one brand to see its available products, specifications and project pricing."
        variant="brand"
        options={brands.map((option) => ({
            id: option.brand,
            name: option.brand,
            href: `/categories/${step.current.slug}${carry({ brand: option.brand })}`,
            description: `View ${option.brand} products available in this category.`,
            imageUrl: brandShowroomImageFor(option.brand) ?? logoFor.get(option.brand) ?? null,
            productCount: option.productCount,
          }))}
      />
    )}

    {/* Products only at the end of the journey: an intermediate level that also
        dumps a full grid is the overwhelm this replaces. */}
    {canShowProducts && (
      visibleProducts.length > 0
        ? <ProductBrowser
            mode="category"
            products={visibleProducts}
            options={[step.current.name]}
            initial={step.current.name}
            query={q}
            categoryGroups={{ [step.current.name]: [step.current.name] }}
          />
        : <section className="empty-panel">
            <span aria-hidden="true">0</span>
            <h2>No products here yet</h2>
            <p>We can still source this. Tell us what you need and we will come back with pricing.</p>
            <a className="button orange" href={`/bulk-quotes?product=${encodeURIComponent(step.current.name)}`}>Request pricing</a>
          </section>
    )}
  </main>;
}
