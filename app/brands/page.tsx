import type { Metadata } from "next";
import { getCatalogSnapshot } from "../live-catalog";
import { BRAND_WIZARD_STEPS, WizardJourney } from "../wizard-journey";
import { WizardOptionGrid } from "../wizard-option-grid";
import { brandShowroomImageFor } from "../brand-showroom-images";

export const metadata: Metadata = {
  title: "Shop by brand",
  description: "Every construction material brand stocked by Buildanta, with live pricing and project quotations.",
};

export default async function BrandsIndex() {
  const catalog = await getCatalogSnapshot();

  // A brand with nothing published behind it is a dead end, and the wizard's
  // rule everywhere else is that an option always leads somewhere.
  const stocked = catalog.brands
    .map((brand) => ({ brand, products: catalog.products.filter((product) => product.brand === brand.name) }))
    .filter((entry) => entry.products.length > 0)
    .sort((a, b) => b.products.length - a.products.length || a.brand.name.localeCompare(b.brand.name));

  const totalProducts = stocked.reduce((sum, entry) => sum + entry.products.length, 0);

  return <main className="listing-page wizard-landing-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a><span>›</span><span className="breadcrumb-part">Brands</span>
    </nav>

    <div className="page-intro category-page-intro wizard-intro">
      <div>
        <p>SHOP BY BRAND</p>
        <h1>Which brand are you after?</h1>
        <span>Pick a maker and we will narrow it down with you, one choice at a time.</span>
        <small>{stocked.length} brands · {totalProducts} products</small>
      </div>
    </div>

    <WizardJourney steps={BRAND_WIZARD_STEPS} currentStep={0} />

    {stocked.length > 0 ? (
      <WizardOptionGrid
        heading="Choose a brand"
        subheading="Every path uses the same live Buildanta catalogue."
        variant="brand"
        options={stocked.map(({ brand, products }) => ({
          id: brand.id,
          name: brand.name,
          href: `/brands/${brand.slug}`,
          description: brand.description || `${products.length === 1 ? "1 product" : `${products.length} products`} stocked`,
          imageUrl: brandShowroomImageFor(brand.name) ?? brand.logo,
          productCount: products.length,
        }))}
      />
    ) : (
      <section className="empty-panel">
        <span aria-hidden="true">0</span>
        <h2>No brands have published products yet</h2>
        <p>Publish a product in Buildanta Inventory and its brand appears here.</p>
        <a className="button orange" href="/categories">Browse all categories</a>
      </section>
    )}
  </main>;
}
