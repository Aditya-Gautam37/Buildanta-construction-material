import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfessionalCard } from "../../professional-card";
import { categoryBySlug, getProfessionals } from "../../professional-directory";
import { SERVICE_AREA, SERVICE_CITY } from "../location";

type ProfessionalTypePageProps = { params: Promise<{ type: string }> };

export async function generateMetadata({ params }: ProfessionalTypePageProps): Promise<Metadata> {
  const { type } = await params;
  const category = categoryBySlug(type);
  if (!category) return {};
  const title = `${category.title} in ${SERVICE_CITY} | Buildanta`;
  const description = `Find ${category.title.toLowerCase()} serving ${SERVICE_AREA}. ${category.description}`;
  return {
    title: { absolute: title },
    description,
    openGraph: { title, description },
  };
}

function Breadcrumbs({ title }: { title: string }) {
  return (
    <nav className="professional-breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span aria-hidden="true">›</span>
      <a href="/professionals">Professionals</a>
      <span aria-hidden="true">›</span>
      <span aria-current="page">{title}</span>
    </nav>
  );
}

export default async function ProfessionalTypePage({ params }: ProfessionalTypePageProps) {
  const { type } = await params;
  const category = categoryBySlug(type);
  if (!category) notFound();
  const professionals = await getProfessionals(category.type);
  const single = professionals.length === 1;
  const firstProfessional = professionals[0];

  return (
    <main className="professionals-page">
      <Breadcrumbs title={category.title} />

      <section className="professional-type-hero">
        <div>
          <p aria-hidden="true">{category.short}</p>
          <h1>{category.title} in {SERVICE_CITY}</h1>
          <strong>{category.description}</strong>
        </div>
        <aside>
          <span>Published profiles</span>
          <b>{professionals.length}</b>
        </aside>
      </section>

      <section className="professional-results" aria-labelledby="professional-results-title">
        <div className="professional-results-head">
          <div>
            <p>BUILDANTA DIRECTORY</p>
            <h2 id="professional-results-title">
              {category.title} serving {SERVICE_CITY}
            </h2>
          </div>
          <a href="/professionals">Browse all types</a>
        </div>

        {!professionals.length ? (
          <div className="professional-empty">
            <h3>No published {category.title.toLowerCase()} in {SERVICE_CITY} yet</h3>
            <p>
              Buildanta is currently onboarding local {category.title.toLowerCase()} for
              the {SERVICE_CITY} professional network.
            </p>
            <a className="button orange" href="/professionals">
              View all professionals <span aria-hidden="true">→</span>
            </a>
          </div>
        ) : null}

        {single && firstProfessional ? (
          <div className="professional-single">
            <ProfessionalCard professional={firstProfessional} layout="wide" />
          </div>
        ) : null}

        {professionals.length > 1 ? (
          <div className="professional-grid">
            {professionals.map((professional) => (
              <ProfessionalCard professional={professional} key={professional.id} />
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
