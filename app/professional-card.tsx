import { categoryByType, type PublicProfessional } from "./professional-directory";

export function ProfessionalCard({ professional }: { professional: PublicProfessional }) {
  const category = categoryByType(professional.type);
  const profileUrl = `/professionals/${category?.slug ?? "directory"}/${professional.slug}`;
  const initials = professional.name.split(" ").map((part) => part[0]).join("").slice(0, 2);
  return <article className="professional-card">
    <a className="professional-card-photo" href={profileUrl}>{professional.photoUrl ? <img src={professional.photoUrl} alt={professional.name} loading="lazy" /> : <span>{initials}</span>}{professional.featured ? <b>Featured</b> : null}</a>
    <div className="professional-card-body"><p>{category?.singular}</p><h2><a href={profileUrl}>{professional.name}</a></h2><span>{professional.headline || `Trusted ${category?.singular?.toLowerCase() ?? "professional"}`}</span><div className="professional-card-meta"><span>⌖ {professional.location}</span><span>{professional.yearsExperience} yrs experience</span></div>{professional.services.length ? <ul>{professional.services.slice(0, 3).map((service) => <li key={service}>{service}</li>)}</ul> : null}<a className="professional-profile-link" href={profileUrl}>View full profile <span>→</span></a></div>
  </article>;
}
