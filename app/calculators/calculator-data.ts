import "server-only";

export type PublicCalculator = {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string;
  instructions: string | null;
  imageUrl: string | null;
  icon: string | null;
  disclaimer: string;
  sortOrder?: number;
  currentVersion: { version: number; effectiveFrom: string | null; publishedAt: string | null };
};

const DEFAULT_API_URL = process.env.NODE_ENV === "development"
  ? "http://localhost:5173"
  : "https://buildanta-monorepo-nest-api.vercel.app";

const apiUrl = (process.env.INVENTORY_API_URL || DEFAULT_API_URL).replace(/\/$/, "");

export async function getPublicCalculators(): Promise<PublicCalculator[]> {
  try {
    const response = await fetch(`${apiUrl}/calculators/public`, { headers: { accept: "application/json" }, cache: "no-store" });
    return response.ok ? await response.json() as PublicCalculator[] : [];
  } catch {
    return [];
  }
}

export async function getPublicCalculator(slug: string): Promise<PublicCalculator | null> {
  try {
    const response = await fetch(`${apiUrl}/calculators/public/${encodeURIComponent(slug)}`, { headers: { accept: "application/json" }, cache: "no-store" });
    return response.ok ? await response.json() as PublicCalculator : null;
  } catch {
    return null;
  }
}
