const DEFAULT_API_URL = process.env.NODE_ENV === "development"
  ? "http://localhost:5173"
  : "https://buildanta-monorepo-nest-api.vercel.app";

export const professionalCategories = [
  { slug: "contractors", type: "CONTRACTOR", title: "Contractors", singular: "Contractor", short: "C", description: "Execution experts for civil work, renovation and complete project delivery." },
  { slug: "interior-designers", type: "INTERIOR_DESIGNER", title: "Interior Designers", singular: "Interior Designer", short: "ID", description: "Design specialists for functional, beautiful residential and commercial spaces." },
  { slug: "builders", type: "BUILDER", title: "Builders", singular: "Builder", short: "B", description: "Experienced teams for residential, commercial and redevelopment projects." },
  { slug: "architects", type: "ARCHITECT", title: "Architects", singular: "Architect", short: "A", description: "Planning and design professionals who bring buildable ideas to life." },
  { slug: "product-owners", type: "PRODUCT_OWNER", title: "Product Owners", singular: "Product Owner", short: "PO", description: "Material and product specialists with category expertise and supply knowledge." },
] as const;

export type ProfessionalType = (typeof professionalCategories)[number]["type"];

export type PublicProfessional = {
  id: string;
  name: string;
  slug: string;
  type: ProfessionalType;
  headline: string | null;
  bio: string | null;
  photoUrl: string | null;
  location: string;
  yearsExperience: number;
  email: string | null;
  phone: string | null;
  website: string | null;
  portfolioUrl: string | null;
  services: string[];
  featured: boolean;
};

function apiUrl(path: string) {
  return `${(process.env.INVENTORY_API_URL || DEFAULT_API_URL).replace(/\/$/, "")}/${path}`;
}

function isProfessional(value: unknown): value is PublicProfessional {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.name === "string" && typeof record.slug === "string" &&
    typeof record.location === "string" && professionalCategories.some((category) => category.type === record.type);
}

export async function getProfessionals(type?: ProfessionalType): Promise<PublicProfessional[]> {
  try {
    const query = type ? `?type=${encodeURIComponent(type)}` : "";
    const response = await fetch(apiUrl(`professionals${query}`), { cache: "no-store", headers: { accept: "application/json" } });
    if (!response.ok) return [];
    const payload: unknown = await response.json();
    return Array.isArray(payload) ? payload.filter(isProfessional) : [];
  } catch {
    return [];
  }
}

export async function getProfessional(slug: string): Promise<PublicProfessional | null> {
  try {
    const response = await fetch(apiUrl(`professionals/${encodeURIComponent(slug)}`), { cache: "no-store", headers: { accept: "application/json" } });
    if (!response.ok) return null;
    const payload: unknown = await response.json();
    return isProfessional(payload) ? payload : null;
  } catch {
    return null;
  }
}

export function categoryBySlug(slug: string) {
  return professionalCategories.find((category) => category.slug === slug);
}

export function categoryByType(type: ProfessionalType) {
  return professionalCategories.find((category) => category.type === type);
}
