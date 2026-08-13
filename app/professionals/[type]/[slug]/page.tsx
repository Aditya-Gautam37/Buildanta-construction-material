import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categoryBySlug, getProfessional } from "../../../professional-directory";
import { formatLocation, SERVICE_CITY } from "../../location";
import { PackageCalculator } from "../../package-calculator";
import { PackageComparison } from "../../package-comparison-table";

type ProfilePageProps = { params: Promise<{ type: string; slug: string }> };

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { type, slug } = await params;
  const category = categoryBySlug(type);
  const professional = category ? await getProfessional(slug) : null;
  if (!category || !professional || professional.type !== category.type) return {};
  const location = formatLocation(professional.location) ?? SERVICE_CITY;
  return {
    title: { absolute: `${professional.name} | ${category.singular} in ${SERVICE_CITY} | Buildanta` },
    description: professional.headline
      || `${professional.name}, ${category.singular.toLowerCase()} serving ${location}.`,
  };
}

export default async function ProfessionalProfilePage({ params }: ProfilePageProps) {
  const { type, slug } = await params;
  const category = categoryBySlug(type);
  if (!category) notFound();
  const professional = await getProfessional(slug);
  if (!professional || professional.type !== category.type) notFound();

  const initials = professional.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const location = formatLocation(professional.location);
  // Only a genuine external portfolio counts. The old code fell back to an
  // in-page anchor that did not exist unless services were filled in, leaving
  // a button that went nowhere.
  const portfolioUrl = professional.portfolioUrl?.trim() && !professional.portfolioUrl.endsWith("#selected-work")
    ? professional.portfolioUrl
    : null;

  return (
    <main className="professional-profile-page">
      <nav className="professional-breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span aria-hidden="true">›</span>
        <a href="/professionals">Professionals</a>
        <span aria-hidden="true">›</span>
        <a href={`/professionals/${category.slug}`}>{category.title}</a>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{professional.name}</span>
      </nav>

      <section className="professional-profile-hero">
        <div className="professional-profile-photo">
          {professional.photoUrl
            ? <img src={professional.photoUrl} alt={`${professional.name}, ${category.singular.toLowerCase()}`} />
            : <span aria-hidden="true">{initials}</span>}
        </div>
        <div className="professional-profile-intro">
          <p>{category.singular}</p>
          <h1>{professional.name}</h1>
          {professional.headline ? <h2>{professional.headline}</h2> : null}
          <div>
            {location ? <span>{location}</span> : null}
            <span>{professional.yearsExperience} {professional.yearsExperience === 1 ? "year" : "years"} of experience</span>
          </div>
          {professional.featured ? <b>Featured listing</b> : null}
        </div>
      </section>

      <section className="professional-profile-content">
        <article>
          <p className="profile-kicker">ABOUT THIS PROFESSIONAL</p>
          <h2>About {professional.name}</h2>
          {professional.bio
            ? <p className="professional-bio">{professional.bio}</p>
            : (
              <p className="professional-bio">
                {professional.name} is a {category.singular.toLowerCase()} listed on
                Buildanta{location ? `, serving projects in ${location}` : ""}. Send an
                enquiry to ask about capabilities and availability.
              </p>
            )}

          {/* Labelled "Services offered", not "projects": these are services the
              professional lists, not completed work Buildanta can evidence. */}
          {professional.services.length ? (
            <>
              <h3>Services offered</h3>
              <ul className="professional-services">
                {professional.services.map((service) => <li key={service}>{service}</li>)}
              </ul>
            </>
          ) : null}
        </article>

        <aside>
          <h2>Professional details</h2>
          <dl>
            {location ? <div><dt>Location</dt><dd>{location}</dd></div> : null}
            <div><dt>Experience</dt><dd>{professional.yearsExperience} {professional.yearsExperience === 1 ? "year" : "years"}</dd></div>
            <div><dt>Category</dt><dd>{category.singular}</dd></div>
            <div><dt>Status</dt><dd>Listed on Buildanta</dd></div>
          </dl>

          {/* Contact details are not published. Enquiries route through
              Buildanta so a professional's personal phone and email stay off
              the open web. */}
          <a className="button orange wide" href={`/bulk-quotes?professional=${encodeURIComponent(professional.name)}`}>
            Enquire about this professional <span aria-hidden="true">→</span>
          </a>
          <p className="professional-contact-note">
            Share your requirement and the Buildanta team will connect you with{" "}
            {professional.name}.
          </p>

          {portfolioUrl ? (
            <a className="professional-website" href={portfolioUrl} target="_blank" rel="noreferrer">
              View portfolio <span aria-hidden="true">↗</span>
            </a>
          ) : null}
          {professional.website ? (
            <a className="professional-website" href={professional.website} target="_blank" rel="noreferrer">
              Visit website <span aria-hidden="true">↗</span>
            </a>
          ) : null}
        </aside>
      </section>

      <div id="packages">
        <PackageCalculator
          packages={professional.packages ?? []}
          professionalName={professional.name}
          slug={professional.slug}
        />
        <PackageComparison packages={professional.packages ?? []} />
      </div>
    </main>
  );
}
