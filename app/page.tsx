import { brands, categories, rooms, stages } from "./data";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="section-title"><span /><h2>{children}</h2><span /></div>;
}

export default function Home() {
  return (
    <main>
      <section className="home-hero">
        <img src="/homepage_img.png" alt="Home renovation journey from unfinished to fully designed" />
        <div className="hero-shade" />
        <div className="home-hero-copy">
          <h1>Everything you need to finish<br className="desktop-only" /> your home – in one place</h1>
          <p>Your All-in-One Source for Every Build Detail.</p>
          <div><a className="button navy" href="/by-stage">Browse by Stage</a><a className="button orange" href="/by-room">Browse by Room</a></div>
        </div>
      </section>

      <section className="home-section brands-section">
        <h2>Trusted Brands</h2>
        <p className="section-subtitle">Quality products from the brands you already trust</p>
        <div className="brand-rail" aria-label="Trusted brands"><div className="brand-track">{[...brands, ...brands].map((brand, index) => <span key={`${brand}-${index}`}>{brand}</span>)}</div></div>
      </section>

      <section className="home-section">
        <SectionTitle>Shop by Construction Stage</SectionTitle>
        <div className="stage-panel">
          {stages.map(([icon, name], index) => <a href={`/by-stage?stage=${encodeURIComponent(name)}`} className="stage-item" key={name}><span className="stage-icon">{icon}</span><strong>{name}</strong>{index < stages.length - 1 && <i>›</i>}</a>)}
        </div>
      </section>

      <section className="home-section">
        <SectionTitle>Shop by Room</SectionTitle>
        <div className="room-grid">
          {rooms.map((room) => <a href={`/by-room?room=${encodeURIComponent(room.name)}`} className="room-card" key={room.name}><img src={room.image} alt={room.name} /><strong>{room.name}</strong></a>)}
        </div>
      </section>

      <section className="home-section">
        <SectionTitle>Browse Building Categories</SectionTitle>
        <div className="category-panel">
          {categories.map((category) => <a href={`/categories/${category.slug}`} className="category-tile" key={category.slug}><span>{category.icon}</span><strong>{category.name}</strong></a>)}
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
