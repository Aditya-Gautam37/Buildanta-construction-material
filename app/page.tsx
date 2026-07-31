import { getCatalogSnapshot, rootNodes } from "./live-catalog";

const roomImages: Record<string, string> = {
  "Living Room": "/livingroom.jpg",
  Bedroom: "/bedroom.jpg",
  Kitchen: "/kitchen.jpg",
  Bathroom: "/bathroom.jpg",
  "Study / Home Office": "/livingroom.jpg",
  "Balcony & Terrace": "/livingroom.jpg",
};
const materialIcons = ["▣", "▥", "⌁", "ϟ", "◒", "▦", "⌂", "✦", "▤", "▱"];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="section-title"><span /><h2>{children}</h2><span /></div>;
}

export default async function Home() {
  const catalog = await getCatalogSnapshot();
  const stages = rootNodes(catalog.stages);
  const rooms = rootNodes(catalog.rooms);
  const categories = rootNodes(catalog.categories);
  const repeatedBrands = [...catalog.brands, ...catalog.brands];

  return (
    <main>
      <section className="home-hero">
        <img src="/homepage_img.png" alt="Home renovation journey from unfinished to fully designed" />
        <div className="hero-shade" />
        <div className="home-hero-copy">
          <p className="live-catalog-pill"><span /> Live catalogue powered by Buildanta Inventory</p>
          <h1>Everything you need to finish<br className="desktop-only" /> your home – in one place</h1>
          <p>Your All-in-One Source for Every Build Detail.</p>
          <div><a className="button navy" href="/by-stage">Browse by Stage</a><a className="button orange" href="/by-room">Browse by Room</a></div>
        </div>
      </section>

      <section className="home-section brands-section">
        <h2>Trusted Brands</h2>
        <p className="section-subtitle">Quality products from the brands managed in your inventory</p>
        <div className="brand-rail" aria-label="Trusted brands"><div className="brand-track">{repeatedBrands.map((brand, index) => <span key={`${brand.id}-${index}`}>{brand.logo ? <img src={brand.logo} alt={brand.name} loading="lazy" /> : brand.name}</span>)}</div></div>
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

      <section className="home-section">
        <SectionTitle>Browse Building Categories</SectionTitle>
        <div className="category-panel">
          {categories.map((category, index) => <a href={`/categories/${category.slug}`} className="category-tile" key={category.id}><span>{materialIcons[index % materialIcons.length]}</span><strong>{category.name}</strong></a>)}
        </div>
        <a className="view-all" href="/categories">View All Categories <span>→</span></a>
      </section>

      <section className="home-section professional-section">
        <SectionTitle>For Professionals</SectionTitle>
        <div className="banner-wrap"><img src="/forprofessionalsbanner.png" alt="Construction professionals collaborating on a project" /><div><a className="button navy" href="/bulk-quotes">Get Bulk Quotes</a><a className="button orange" href="/list-product">List your Products</a></div></div>
      </section>

      <section className="home-section why-section">
        <SectionTitle>Why Us</SectionTitle>
        <img className="why-image" src="/whyus.png" alt="Buildanta service benefits" />
      </section>
    </main>
  );
}
