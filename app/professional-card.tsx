import { categoryByType, type PublicProfessional } from "./professional-directory";
import { formatLocation } from "./professionals/location";

function initialsOf(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

/**
 * `featured` marks a listing Buildanta chose to surface first. It is not a
 * verification badge, and the label deliberately avoids implying one — there is
 * no verification field behind it.
 */
function FeaturedBadge() {
  return <b className="professional-card-featured">Featured listing</b>;
}

export function ProfessionalCard({ professional, layout = "grid" }: {
  professional: PublicProfessional;
  layout?: "grid" | "wide";
}) {
  const category = categoryByType(professional.type);
  const profileUrl = `/professionals/${category?.slug ?? "directory"}/${professional.slug}`;
  const location = formatLocation(professional.location);
  const services = professional.services.slice(0, 3);
  const categoryName = category?.singular ?? "Professional";

  return (
    <article className={layout === "wide" ? "professional-card professional-card-wide" : "professional-card"}>
      <a
        className="professional-card-photo"
        href={profileUrl}
        tabIndex={-1}
        aria-hidden="true"
      >
        {professional.photoUrl
          ? <img src={professional.photoUrl} alt="" loading="lazy" />
          : <span>{initialsOf(professional.name)}</span>}
        {professional.featured ? <FeaturedBadge /> : null}
      </a>

      <div className="professional-card-body">
        <p className="professional-card-category">{categoryName}</p>

        <h3 className="professional-card-name">
          <a href={profileUrl}>{professional.name}</a>
        </h3>

        {/* No fallback headline: inventing one would put words in the
            professional's mouth. An empty headline simply shows nothing. */}
        {professional.headline ? <p className="professional-card-headline">{professional.headline}</p> : null}

        <dl className="professional-card-meta">
          {location ? (
            <div>
              <dt>Location</dt>
              <dd>{location}</dd>
            </div>
          ) : null}
          <div>
            <dt>Experience</dt>
            <dd>{professional.yearsExperience} {professional.yearsExperience === 1 ? "year" : "years"}</dd>
          </div>
        </dl>

        {services.length ? (
          <ul className="professional-card-services">
            {services.map((service) => <li key={service}>{service}</li>)}
          </ul>
        ) : null}

        <a className="professional-profile-link" href={profileUrl}>
          View {professional.name}&rsquo;s profile <span aria-hidden="true">→</span>
        </a>
      </div>
    </article>
  );
}
