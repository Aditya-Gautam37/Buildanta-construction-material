import { getCatalogSnapshot, rootNodes } from "./live-catalog";
import { getProfessionals, professionalCategories } from "./professional-directory";
import { defaultHomepageSlide, getHomepageContent } from "./homepage-content";
import { HeroSlider } from "./hero-slider";
import { HomepageProductCard } from "./homepage-product-card";
import { BrandMark } from "./brand-mark";

const roomImages: Record<string, string> = {
  "Living Room": "/livingroom.jpg",
  Bedroom: "/bedroom.jpg",
  Kitchen: "/kitchen.jpg",
  Bathroom: "/bathroom.jpg",
  "Study / Home Office": "/livingroom.jpg",
  "Balcony & Terrace": "/livingroom.jpg",
};
const materialIcons = ["▣", "▥", "⌁", "◉", "◒", "▦", "⌂", "✦", "▤", "▱"];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="section-title"><span /><h2>{children}</h2><span /></div>;
}

export default async function Home() {
  const [catalog, professionals, homepageContent] = await Promise.all([getCatalogSnapshot(), getProfessionals(), getHomepageContent()]);
  const stages = rootNodes(catalog.stages);
  const rooms = rootNodes(catalog.rooms);
  const categories = rootNodes(catalog.categories);
  const repeatedBrands = [...catalog.brands, ...catalog.brands];
  const slides = homepageContent.slides.length ? homepageContent.slides : [defaultHomepageSlide];
  const productsById = new Map(catalog.products.map((product) => [product.id, product]));
  const selectedProducts = homepageContent.products.flatMap((placement) => {
    const product = productsById.get(placement.productId);
    return product ? [{ product, badge: placement.badge }] : [];
  });
  const featuredProducts = selectedProducts.length ? selectedProducts : catalog.products.slice(0, 8).map((product) => ({ product, badge: null }));
  const categoryShowcase = categories
    .map((category) => {
      const products = catalog.products.filter((product) => product.categories.includes(category.name));
      return { category, products };
    })
    .sort((a, b) => b.products.length - a.products.length || a.category.name.localeCompare(b.category.name))
    .slice(0, 8);

  return (
    <main>
      <HeroSlider slides={slides} />

      <section className="commerce-assurance" aria-label="Buildanta shopping benefits">
        <span><strong>Verified catalogue</strong><small>Managed from Buildanta Inventory</small></span>
        <span><strong>Project pricing</strong><small>Request quotes for any quantity</small></span>
        <span><strong>Construction focused</strong><small>Browse by stage, room or category</small></span>
      </section>

      <section className="home-section brands-section">
        <h2>Trusted Brands</h2>
        <p className="section-subtitle">Quality products from the brands managed in your inventory</p>
        <div className="brand-rail" aria-label="Trusted brands"><div className="brand-track">{repeatedBrands.map((brand, index) => <span className="brand-card" key={`${brand.id}-${index}`}><BrandMark name={brand.name} logo={brand.logo} /></span>)}</div></div>
      </section>

      <section className="home-section featured-products-section">
        <div className="section-heading-row"><div><p>Inventory selected</p><h2>Featured Building Materials</h2><span>Products, images and prices stay connected to the inventory catalogue.</span></div><a className="view-all" href="/categories">View all products <span>→</span></a></div>
        {featuredProducts.length ? <div className="homepage-products-grid">{featuredProducts.map(({ product, badge }) => <HomepageProductCard product={product} badge={badge} key={product.id} />)}</div> : <div className="homepage-products-empty"><h3>Featured products are being prepared.</h3><p>Add products in Inventory, then select them under Homepage.</p></div>}
      </section>

      <section className="home-section">
        <SectionTitle>Shop by Construction Stage</SectionTitle>
        <div className="stage-panel">
          {stages.map((stage, index) => <a href={`/by-stage?stage=${encodeURIComponent(stage.name)}`} className="stage-item" key={stage.id}><span className="stage-icon">{materialIcons[index % materialIcons.length]}</span><strong>{stage.name}</strong>{index < stages.length - 1 && <i>›</i>}</a>)}
        </div>
      </section>

      <section className="home-section">
        <SectionTitle>Shop by Room</SectionTitle>
        <div className="room-grid">
          {rooms.map((room) => <a href={`/by-room?room=${encodeURIComponent(room.name)}`} className="room-card" key={room.id}><img src={roomImages[room.name] || "/livingroom.jpg"} alt={room.name} /><strong>{room.name}</strong></a>)}
        </div>
      </section>

      <section className="home-section category-showcase-section">
        <div className="section-heading-row"><div><p>Shop the catalogue</p><h2>Materials organized by category</h2><span>See real inventory products inside every category, not an empty directory.</span></div><a className="view-all" href="/categories">View all categories <span>→</span></a></div>
        <div className="category-showcase-grid">
          {categoryShowcase.map(({ category, products }, index) => {
            const preview = products[0];
            return <a href={`/categories/${category.slug}`} className={`category-showcase-card ${preview?.image ? "has-image" : ""}`} key={category.id}>
              <div className="category-showcase-visual">{preview?.image ? <img src={preview.image} alt="" loading="lazy" /> : <span>{materialIcons[index % materialIcons.length]}</span>}<b>{products.length} {products.length === 1 ? "product" : "products"}</b></div>
              <div><small>Construction category</small><h3>{category.name}</h3><p>{products.length ? products.slice(0, 2).map((product) => product.name).join(" · ") : "Products can be added from Buildanta Inventory."}</p><strong>Explore category <span>→</span></strong></div>
            </a>;
          })}
        </div>
      </section>

      <section className="home-section professional-section">
        <SectionTitle>For Professionals</SectionTitle>
        <div className="professional-banner"><img src="/forprofessionalsbanner.png" alt="Construction professionals collaborating on a project" /><div className="professional-banner-actions"><a className="button navy" href="/bulk-quotes">Get Bulk Quotes</a><a className="button orange" href="/list-product">List your Products</a></div><div className="professional-banner-types">{professionalCategories.map((category) => { const count = professionals.filter((item) => item.type === category.type).length; return <a href={`/professionals/${category.slug}`} key={category.type}><span>{category.short}</span><strong>{category.title}</strong><small>{count} profiles</small></a>; })}</div></div>
        <a className="view-all" href="/professionals">Explore all professionals <span>→</span></a>
      </section>

      <section className="home-section why-section">
        <SectionTitle>Why Us</SectionTitle>
        <img className="why-image" src="/whyus.png" alt="Buildanta service benefits" />
      </section>
    </main>
  );
}
