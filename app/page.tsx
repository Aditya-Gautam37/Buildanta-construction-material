import { getCatalogSnapshot, rootNodes } from "./live-catalog";
import { getProfessionals, professionalCategories } from "./professional-directory";
import { defaultHomepageSlide, getHomepageContent } from "./homepage-content";
import { HeroSlider } from "./hero-slider";
import { HomepageProductCard } from "./homepage-product-card";
import { BrandMark } from "./brand-mark";
import { constructionStageImageFor } from "./stage-images";
import { UiIcon } from "./ui-icon";
import { categoryImageFor } from "./category-images";

const roomImages: Record<string, string> = {
  "Living Room": "/livingroom.jpg",
  Bedroom: "/bedroom.jpg",
  Kitchen: "/kitchen.jpg",
  Bathroom: "/bathroom.jpg",
  "Study / Home Office": "/images/buildanta-v2/room-study-v2.webp",
  "Balcony & Terrace": "/images/buildanta-v2/room-balcony-v2.webp",
  "Dining Room": "/images/buildanta-v2/room-dining-v2.webp",
  "Utility Room": "/images/buildanta-v2/room-utility-v2.webp",
  "Puja Room": "/images/buildanta-v2/room-puja-v2.webp",
  "Garage": "/images/buildanta-v2/room-garage-storage-v2.webp",
};
const materialIcons = ["▣", "▥", "⌁", "◉", "◒", "▦", "⌂", "✦", "▤", "▱"];

const professionalTypeImages: Record<string, string> = {
  contractors: "/images/professionals-real/contractor.jpg",
  "interior-designers": "/images/professionals-real/interior-designer.jpg",
  builders: "/images/professionals-real/builder.jpg",
  architects: "/images/professionals-real/architect.jpg",
  "product-owners": "/images/professionals-real/product-owner.jpg",
};

const discoveryTiles = [
  { eyebrow: "MATERIALS", title: "Shop all products", detail: "Cement, steel, electrical, tiles and more", href: "/categories", image: "/demo/products/cement.png", tone: "light" },
  { eyebrow: "PROJECT", title: "Plan by build stage", detail: "Get guided quantities before choosing products", href: "/by-stage", image: "/images/buildanta-v2/foundation-planning-v2.webp", tone: "image" },
  { eyebrow: "SPACES", title: "Find products by room", detail: "We narrow it down with you, one choice at a time", href: "/by-room", image: "/livingroom.jpg", tone: "image" },
  { eyebrow: "CALCULATE", title: "Estimate your materials", detail: "Area-based construction planning tools", href: "/calculators", image: "/demo/hero/project-planning.png", tone: "dark" },
  { eyebrow: "PRICING", title: "Request a bulk quote", detail: "One enquiry for your complete material list", href: "/bulk-quotes", image: "/demo/products/tmt-steel.png", tone: "light" },
  { eyebrow: "EXPERTS", title: "Find professionals", detail: "Connect with builders, architects and contractors", href: "/professionals", image: "/images/buildanta-v2/professionals-network-v2.webp", tone: "image" },
] as const;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="section-title"><span /><h2>{children}</h2><span /></div>;
}

export default async function Home() {
  const [catalog, professionals, homepageContent] = await Promise.all([getCatalogSnapshot(), getProfessionals(), getHomepageContent()]);
  const stages = rootNodes(catalog.stages).filter((stage) => catalog.products.some((product) => product.stages.includes(stage.name)));
  const rooms = rootNodes(catalog.rooms);
  const categories = rootNodes(catalog.categories);
  const repeatedBrands = [...catalog.brands, ...catalog.brands];
  const slides = (homepageContent.slides.length ? homepageContent.slides : [defaultHomepageSlide]).map((slide) =>
    ["/homepage_img.png", "/demo/hero/project-planning.png"].includes(slide.imageUrl)
      ? { ...slide, imageUrl: defaultHomepageSlide.imageUrl, altText: defaultHomepageSlide.altText }
      : slide,
  );
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
    <main className="home-page">
      <HeroSlider slides={slides} />

      <section className="commerce-assurance" aria-label="Buildanta shopping benefits">
        <span><i><UiIcon name="shield" /></i><strong>Verified catalogue</strong><small>Managed from Buildanta Inventory</small></span>
        <span><i><UiIcon name="sparkles" /></i><strong>Quality-first sourcing</strong><small>Specifications and variants kept together</small></span>
        <span><i><UiIcon name="truck" /></i><strong>PIN-aware fulfilment</strong><small>Availability checked for your location</small></span>
        <span><i><UiIcon name="check" /></i><strong>GST-ready quotations</strong><small>Clear project pricing before purchase</small></span>
      </section>

      <section className="home-discovery" aria-labelledby="discovery-title">
        <div className="home-discovery-heading"><div><p>START YOUR BUILD JOURNEY</p><h2 id="discovery-title">What are you looking for?</h2></div><span>Choose the way you want to shop. Every path uses the same live Buildanta catalogue.</span></div>
        <div className="discovery-grid">{discoveryTiles.map((tile) => <a className={`discovery-card ${tile.tone}`} href={tile.href} key={tile.title}><div><small>{tile.eyebrow}</small><h3>{tile.title}</h3><p>{tile.detail}</p><strong>Explore <span>→</span></strong></div><img src={tile.image} alt={`${tile.title} on Buildanta`} width="560" height="320" loading="lazy" decoding="async" /></a>)}</div>
      </section>

      <section className="home-section brands-section">
        <h2>Trusted Brands</h2>
        <p className="section-subtitle">Choose a brand to shop everything we stock from them</p>
        <div className="brand-rail" aria-label="Trusted brands"><div className="brand-track">{repeatedBrands.map((brand, index) => <a className="brand-card" href={`/brands/${brand.slug}`} key={`${brand.id}-${index}`}><BrandMark name={brand.name} logo={brand.logo} /></a>)}</div></div>
      </section>

      <section className="home-section featured-products-section">
        <div className="section-heading-row"><div><p>Inventory selected</p><h2>Featured Building Materials</h2><span>Products, images and prices stay connected to the inventory catalogue.</span></div><a className="view-all" href="/categories">View all products <span>→</span></a></div>
        {featuredProducts.length ? <div className="homepage-products-grid">{featuredProducts.map(({ product, badge }) => <HomepageProductCard product={product} badge={badge} key={product.id} />)}</div> : <div className="homepage-products-empty"><h3>Featured products are being prepared.</h3><p>Add products in Inventory, then select them under Homepage.</p></div>}
      </section>

      <section className="home-section project-planner-section">
        <div className="project-planner-card">
          <div className="project-planner-copy">
            <p>COMPLETE CONSTRUCTION MATERIAL PLANNER</p>
            <h2>Start with your area. Leave with a connected material plan.</h2>
            <span>Enter your project name, location, plot and built-up area, floors, rooms and construction scope. Buildanta prepares a preliminary stage-wise schedule using managed calculation profiles and products published from Inventory.</span>
            <div className="project-planner-actions"><a className="button orange" href="/calculators/complete-construction-material">Get full construction material info</a><a href="/calculators">View all calculators -&gt;</a></div>
          </div>
          <div className="project-planner-features" aria-label="Construction planner features">
            <article><b>01</b><div><strong>Choose the scope</strong><span>Foundation only, structural shell or full-finish planning.</span></div></article>
            <article><b>02</b><div><strong>Review stage-wise quantities</strong><span>See raw requirements, wastage and rounded purchase quantities.</span></div></article>
            <article><b>03</b><div><strong>Use connected products</strong><span>Products, variants, indicative prices and PIN-code status come from Inventory.</span></div></article>
            <article><b>04</b><div><strong>Request one quotation</strong><span>Send every selected material to the existing multi-item quote workflow.</span></div></article>
          </div>
        </div>
        <p className="project-planner-disclaimer">Preliminary planning only. Final quantities require architectural, structural and MEP drawings reviewed by qualified professionals.</p>
      </section>

      <section className="home-section stage-shopping-section">
        <SectionTitle>Shop by Construction Stage</SectionTitle>
        <div className="stage-panel">
          {stages.map((stage, index) => {
            const image = constructionStageImageFor(stage.slug);
            return <a href={`/by-stage/${stage.slug}`} className={`stage-item ${image ? "has-stage-image" : ""}`} key={stage.id}>
              {image && <img className="stage-card-image" src={image} alt="" width="1672" height="941" loading="lazy" decoding="async" />}
              <span className="stage-icon">{materialIcons[index % materialIcons.length]}</span>
              <strong>{stage.name}</strong>
              {index < stages.length - 1 && <i>›</i>}
            </a>;
          })}
        </div>
      </section>

      <section className="home-section room-shopping-section">
        <SectionTitle>Shop by Room</SectionTitle>
        <div className="room-grid">
          {rooms.map((room) => <a href={`/by-room/${room.slug}`} className="room-card" key={room.id}><img src={room.imageUrl || roomImages[room.name] || "/livingroom.jpg"} alt={`${room.name} interior and construction materials`} loading="lazy" decoding="async" /><strong>{room.name}</strong></a>)}
        </div>
      </section>

      <section className="home-section category-showcase-section">
        <div className="section-heading-row"><div><p>Shop the catalogue</p><h2>Materials organized by category</h2><span>See real inventory products inside every category, not an empty directory.</span></div><a className="view-all" href="/categories">View all categories <span>→</span></a></div>
        <div className="category-showcase-grid">
          {categoryShowcase.map(({ category, products }, index) => {
            const preview = products[0];
            const categoryImage = categoryImageFor(category.name) ?? preview?.image;
            return <a href={`/categories/${category.slug}`} className={`category-showcase-card ${categoryImage ? "has-image" : ""}`} key={category.id}>
              <div className="category-showcase-visual">{categoryImage ? <img src={categoryImage} alt={`${category.name} materials`} loading="lazy" decoding="async" /> : <span>{materialIcons[index % materialIcons.length]}</span>}<b>{products.length} {products.length === 1 ? "product" : "products"}</b></div>
              <div><small>Construction category</small><h3>{category.name}</h3><p>{products.length ? products.slice(0, 2).map((product) => product.name).join(" · ") : "Products can be added from Buildanta Inventory."}</p><strong>Explore category <span>→</span></strong></div>
            </a>;
          })}
        </div>
      </section>

      <section className="home-section professional-section">
        <div className="section-heading-row"><div><p>For professionals</p><h2>Find the right people for your project</h2><span>Connect with contractors, designers, builders and more.</span></div><a className="view-all" href="/professionals">Explore all professionals <span>→</span></a></div>
        <div className="professional-grid">
          {professionalCategories.map((category) => {
            const count = professionals.filter((item) => item.type === category.type).length;
            return <a href={`/professionals/${category.slug}`} className="professional-type-card" key={category.type}>
              <span className="professional-type-photo"><img src={professionalTypeImages[category.slug]} alt="" loading="lazy" decoding="async" /><b>{category.short}</b></span>
              <strong>{category.title}</strong>
              <p>{category.description}</p>
              <small>{count} {count === 1 ? "profile" : "profiles"}</small>
            </a>;
          })}
        </div>
      </section>

      <section className="home-section why-section">
        <SectionTitle>Why Us</SectionTitle>
        <img className="why-image" src="/whyus.png" alt="Buildanta service benefits" />
      </section>
    </main>
  );
}
