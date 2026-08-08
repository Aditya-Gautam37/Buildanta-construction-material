import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalogSnapshot, rootNodes } from "../../live-catalog";
import { departmentsFor } from "../../guided-wizard";
import { WizardOptionGrid } from "../../wizard-option-grid";

type StagePageProps = { params: Promise<{ stage: string }> };

async function findStage(slug: string) {
  const catalog = await getCatalogSnapshot();
  const stage = rootNodes(catalog.stages).find((node) => node.slug === slug);
  return { catalog, stage };
}

export async function generateMetadata({ params }: StagePageProps): Promise<Metadata> {
  const { stage: slug } = await params;
  const { stage } = await findStage(slug);
  if (!stage) return {};
  const description = `Materials for the ${stage.name.toLowerCase()} stage of your build, chosen department by department with live Buildanta pricing.`;
  return { title: `${stage.name} materials`, description, openGraph: { title: `${stage.name} | Buildanta`, description } };
}

export default async function StageWizardEntry({ params }: StagePageProps) {
  const { stage: slug } = await params;
  const { catalog, stage } = await findStage(slug);
  if (!stage) notFound();

  const departments = departmentsFor(stage, catalog.categories, catalog.products);
  const totalProducts = departments.reduce((sum, option) => sum + option.productCount, 0);

  return <main className="listing-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a><span>›</span><a href="/by-stage">Build stages</a><span>›</span><span className="breadcrumb-part">{stage.name}</span>
    </nav>

    <div className="page-intro category-page-intro">
      <div>
        <p>STAGE · {stage.name.toUpperCase()}</p>
        <h1>What are you buying for this stage?</h1>
        <span>Pick a department and we will narrow it down with you, one choice at a time.</span>
        <small>{totalProducts} {totalProducts === 1 ? "product" : "products"} available for this stage</small>
      </div>
      {stage.imageUrl && <img src={stage.imageUrl} alt={`${stage.name} construction stage`} />}
    </div>

    {departments.length > 0 ? (
      <WizardOptionGrid
        heading={`Shop ${stage.name.toLowerCase()} by department`}
        subheading="Choose a department before comparing real products."
        options={departments.map((option) => ({
          id: option.node.id,
          name: option.node.name,
          href: `/categories/${option.node.slug}?stage=${encodeURIComponent(stage.slug)}`,
          description: option.node.description,
          imageUrl: option.node.imageUrl,
          productCount: option.productCount,
        }))}
      />
    ) : (
      <section className="empty-panel">
        <span aria-hidden="true">0</span>
        <h2>Nothing mapped to {stage.name} yet</h2>
        <p>Departments are chosen in Buildanta Inventory. Once a department with stock is mapped to this stage, it appears here.</p>
        <a className="button orange" href="/categories">Browse all categories</a>
      </section>
    )}

    <section className="stage-planner-nudge">
      <p>Need quantities, not just products?</p>
      <a href="/calculators/complete-construction-material">Work out how much you need →</a>
    </section>
  </main>;
}
