import { ProfessionalCard } from "../professional-card";
import { getProfessionals, professionalCategories } from "../professional-directory";

export default async function ProfessionalsDirectoryPage() {
  const professionals = await getProfessionals();
  return <main className="professionals-page">
    <section className="professional-hero"><p>BUILDANTA PROFESSIONAL NETWORK</p><h1>Find the right expert for every build.</h1><span>Explore verified professionals by speciality, location and experience. Every profile is managed through the Buildanta inventory workspace.</span></section>
    <section className="professional-category-section"><div className="professional-category-cards">{professionalCategories.map((category) => { const count = professionals.filter((item) => item.type === category.type).length; return <a href={`/professionals/${category.slug}`} key={category.type}><i>{category.short}</i><div><h2>{category.title}</h2><p>{category.description}</p><span>{count} {count === 1 ? "professional" : "professionals"} <b>→</b></span></div></a>; })}</div></section>
    <section className="professional-results"><div className="professional-results-head"><div><p>PROFESSIONAL DIRECTORY</p><h2>Meet Buildanta professionals</h2></div><span>{professionals.length} published profiles</span></div>{professionals.length ? <div className="professional-grid">{professionals.map((professional) => <ProfessionalCard professional={professional} key={professional.id} />)}</div> : <div className="professional-empty"><span>◎</span><h2>Profiles are being added</h2><p>Our team is preparing trusted professional profiles. Please check back shortly.</p></div>}</section>
  </main>;
}
