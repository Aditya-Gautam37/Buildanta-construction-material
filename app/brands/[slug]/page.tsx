import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalogSnapshot, type CatalogNode } from "../../live-catalog";
import { ancestryOf } from "../../guided-wizard";
import { BRAND_WIZARD_STEPS, WizardJourney } from "../../wizard-journey";
import { WizardOptionGrid } from "../../wizard-option-grid";

type BrandPageProps = { params: Promise<{ slug: string }> };

async function findBrand(slug: string) {
  const catalog = await getCatalogSnapshot();
  const brand = catalog.brands.find((item) => item.slug === slug);
  return { catalog, brand };
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { brand } = await findBrand(slug);
  if (!brand) return {};
  const description = `${brand.name} construction materials available from Buildanta, with live pricing and project quotations.`;
  return { title: brand.name, description, openGraph: { title: `${brand.name} | Buildanta`, description } };
}

export default async function BrandEntry({ params }: BrandPageProps) {
  const { slug } = await params;
  const { catalog, brand } = await findBrand(slug);
  if (!brand) notFound();

  const products = catalog.products.filter((product) => product.brand === brand.name);
  if (products.length === 0) notFound();

  // A brand sells into a handful of departments. Grouping by the root category
  // keeps the first screen to a few choices rather than one row per product.
  const byId = new Map(catalog.categories.map((node) => [node.id, node]));
  const departments = new Map<string, { node: CatalogNode; productCount: number }>();
  for (const product of products) {
    for (const categoryId of product.categoryIds) {
      const root = ancestryOf(catalog.categories, categoryId)[0];
      if (!root || !byId.has(root.id)) continue;
      const existing = departments.get(root.id);
      if (existing) existing.productCount += 1;
      else departments.set(root.id, { node: root, productCount: 1 });
      break;
    }
  }
  const options = [...departments.values()].sort((a, b) => b.productCount - a.productCount || a.node.name.localeCompare(b.node.name));

  return <main className="listing-page wizard-landing-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a><span>›</span><a href="/categories">Categories</a><span>›</span><span className="breadcrumb-part">{brand.name}</span>
    </nav>

    <div className="page-intro category-page-intro wizard-intro">
      <div>
        <p>BRAND · BUILDANTA</p>
        <h1>{brand.name}</h1>
        <span>{brand.description || `${brand.name} materials stocked and quoted through Buildanta.`}</span>
        <small>{products.length} published {products.length === 1 ? "product" : "products"}</small>
      </div>
      {brand.logo && <img src={brand.logo} alt={`${brand.name} logo`} />}
    </div>

    <WizardJourney
      steps={BRAND_WIZARD_STEPS}
      currentStep={1}
      selections={[{ label: "Brand", value: brand.name, href: "/brands" }]}
    />

    <WizardOptionGrid
      heading={`What are you buying from ${brand.name}?`}
      subheading="Pick a department to narrow down to the right product."
      options={options.map((option) => ({
        id: option.node.id,
        name: option.node.name,
        href: `/categories/${option.node.slug}?brand=${encodeURIComponent(brand.name)}`,
        description: option.node.description,
        imageUrl: option.node.imageUrl,
        productCount: option.productCount,
      }))}
    />
  </main>;
}
