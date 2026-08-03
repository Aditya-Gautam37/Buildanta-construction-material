import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categoryBySlug, getProfessional } from "../../../professional-directory";

type ProfilePageProps = { params: Promise<{ type: string; slug: string }> };

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { type, slug } = await params;
  const category = categoryBySlug(type);
  const professional = category ? await getProfessional(slug) : null;
  if (!category || !professional || professional.type !== category.type) return {};
  return {
    title: { absolute: `${professional.name} | ${category.singular} | Buildanta` },
    description: professional.headline || `${professional.name}, ${category.singular.toLowerCase()} serving ${professional.location}.`,
  };
}

export default async function ProfessionalProfilePage({ params }: ProfilePageProps) {
  const { type, slug } = await params;
  const category = categoryBySlug(type);
  if (!category) notFound();
  const professional = await getProfessional(slug);
  if (!professional || professional.type !== category.type) notFound();

  const initials = professional.name.split(" ").map((part) => part[0]).join("").slice(0, 2);
  const representativeWork = professional.services.slice(0, 3);
  const externalPortfolio = professional.portfolioUrl && !professional.portfolioUrl.endsWith("#selected-work")
    ? professional.portfolioUrl
    : null;

  return (
    <main className="professional-profile-page">
      <div className="professional-breadcrumbs">
        <a href="/">Home</a><span>›</span><a href="/professionals">Professionals</a><span>›</span>
        <a href={`/professionals/${category.slug}`}>{category.title}</a><span>›</span>{professional.name}
      </div>
      <section className="professional-profile-hero">
        <div className="professional-profile-photo">
          {professional.photoUrl ? <img src={professional.photoUrl} alt={professional.name} /> : <span>{initials}</span>}
        </div>
        <div className="professional-profile-intro">
          <p>{category.singular}</p>
          <h1>{professional.name}</h1>
          <h2>{professional.headline || `Trusted ${category.singular.toLowerCase()}`}</h2>
          <div><span>⌖ {professional.location}</span><span>◷ {professional.yearsExperience} years of experience</span></div>
          {professional.featured ? <b>Buildanta featured professional</b> : null}
        </div>
      </section>
      <section className="professional-profile-content">
        <article>
          <p className="profile-kicker">ABOUT THE PROFESSIONAL</p>
          <h2>Experience you can understand.</h2>
          <p className="professional-bio">{professional.bio || `${professional.name} is a ${category.singular.toLowerCase()} serving projects in ${professional.location}. Contact the professional directly for capabilities, availability and project details.`}</p>
          {professional.services.length ? <><h3>Services and specialities</h3><ul className="professional-services">{professional.services.map((service) => <li key={service}>✓ {service}</li>)}</ul></> : null}
        </article>
        <aside>
          <h2>Professional details</h2>
          <dl>
            <div><dt>Location</dt><dd>{professional.location}</dd></div>
            <div><dt>Experience</dt><dd>{professional.yearsExperience} years</dd></div>
            {professional.email ? <div><dt>Email</dt><dd><a href={`mailto:${professional.email}`}>{professional.email}</a></dd></div> : null}
            {professional.phone ? <div><dt>Phone</dt><dd><a href={`tel:${professional.phone}`}>{professional.phone}</a></dd></div> : null}
          </dl>
          <a className="button orange wide" href={externalPortfolio || "#selected-work"} target={externalPortfolio ? "_blank" : undefined} rel={externalPortfolio ? "noreferrer" : undefined}>View past work <span>{externalPortfolio ? "↗" : "↓"}</span></a>
          {professional.website ? <a className="professional-website" href={professional.website} target="_blank" rel="noreferrer">Visit professional website ↗</a> : null}
        </aside>
      </section>
      {representativeWork.length ? (
        <section className="professional-work" id="selected-work" aria-labelledby="selected-work-title">
          <p className="profile-kicker">SELECTED EXPERIENCE</p>
          <div className="professional-work-heading">
            <h2 id="selected-work-title">Representative project capabilities</h2>
            <p>Demo portfolio content. Replace it with verified project details and an external portfolio link from Inventory before public launch.</p>
          </div>
          <div className="professional-work-grid">
            {representativeWork.map((service, index) => <article key={service}><span>0{index + 1}</span><h3>{service}</h3><p>Planning, material coordination and delivery support tailored to the project brief.</p></article>)}
          </div>
        </section>
      ) : null}
    </main>
  );
}
