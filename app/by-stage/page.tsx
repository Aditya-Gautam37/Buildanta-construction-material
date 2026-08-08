import { redirect } from "next/navigation";
import { getCatalogSnapshot, rootNodes } from "../live-catalog";
import { departmentsFor } from "../guided-wizard";
import { WizardOptionGrid } from "../wizard-option-grid";

export default async function ByStage({ searchParams }: { searchParams: Promise<{ stage?: string }> }) {
  const [params, catalog] = await Promise.all([searchParams, getCatalogSnapshot()]);
  const stages = rootNodes(catalog.stages);

  // Old shape: /by-stage?stage=Foundation%20%26%20Structure.
  if (params.stage) {
    const target = stages.find((stage) => stage.name === params.stage || stage.slug === params.stage);
    if (target) redirect(`/by-stage/${target.slug}`);
  }

  const options = stages
    .map((stage) => ({ stage, departments: departmentsFor(stage, catalog.categories, catalog.products) }))
    .filter((entry) => entry.departments.length > 0);

  return <main className="listing-page stage-listing-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a><span>›</span><span className="breadcrumb-part">Build stages</span>
    </nav>

    <div className="page-intro category-page-intro">
      <div>
        <p>SHOP BY BUILD STAGE</p>
        <h1>Where are you in the build?</h1>
        <span>Pick a stage and we will narrow it down with you, one choice at a time.</span>
        <small>{options.length} {options.length === 1 ? "stage" : "stages"} ready to shop</small>
      </div>
    </div>

    {options.length > 0 ? (
      <WizardOptionGrid
        heading="Choose a build stage"
        subheading="Every path uses the same live Buildanta catalogue."
        options={options.map(({ stage, departments }) => ({
          id: stage.id,
          name: stage.name,
          href: `/by-stage/${stage.slug}`,
          description: `${departments.length} ${departments.length === 1 ? "department" : "departments"} to browse`,
          imageUrl: stage.imageUrl,
          productCount: departments.reduce((sum, option) => sum + option.productCount, 0),
        }))}
      />
    ) : (
      <section className="empty-panel">
        <span aria-hidden="true">0</span>
        <h2>No stages are mapped yet</h2>
        <p>Map departments to a stage in Buildanta Inventory and it will appear here.</p>
        <a className="button orange" href="/categories">Browse all categories</a>
      </section>
    )}

    <section className="stage-planner-nudge">
      <p>Need quantities, not just products?</p>
      <a href="/calculators/complete-construction-material">Work out how much you need →</a>
    </section>
  </main>;
}
