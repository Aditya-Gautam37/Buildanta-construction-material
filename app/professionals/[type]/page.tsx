import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfessionalCard } from "../../professional-card";
import { categoryBySlug, getProfessionals } from "../../professional-directory";

type ProfessionalTypePageProps = { params: Promise<{ type: string }> };

export async function generateMetadata({ params }: ProfessionalTypePageProps): Promise<Metadata> {
  const { type } = await params;
  const category = categoryBySlug(type);
  if (!category) return {};
  const description = `Find verified ${category.title.toLowerCase()} on Buildanta. ${category.description}`;
  return { title: category.title, description, openGraph: { title: `${category.title} | Buildanta`, description } };
}

export default async function ProfessionalTypePage({ params }: ProfessionalTypePageProps) {
  const { type } = await params;
  const category = categoryBySlug(type);
  if (!category) notFound();
  const professionals = await getProfessionals(category.type);
  return <main className="professionals-page"><section className="professional-type-hero"><div><a href="/professionals">Professional network</a><span> / {category.title}</span><p>{category.short}</p><h1>{category.title}</h1><strong>{category.description}</strong></div><aside><span>Available profiles</span><b>{professionals.length}</b></aside></section><section className="professional-results"><div className="professional-results-head"><div><p>BUILDANTA DIRECTORY</p><h2>{category.title} near you</h2></div><a href="/professionals">Browse all types</a></div>{professionals.length ? <div className="professional-grid">{professionals.map((professional) => <ProfessionalCard professional={professional} key={professional.id} />)}</div> : <div className="professional-empty"><span>◎</span><h2>No published {category.title.toLowerCase()} yet</h2><p>The inventory team can add and publish profiles from the Professionals management area.</p></div>}</section></main>;
}
