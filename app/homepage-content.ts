import { cache } from "react";

const DEFAULT_API_URL = process.env.NODE_ENV === "development"
  ? "http://localhost:5173"
  : "https://buildanta-api.vercel.app";

export type HomepageSlide = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  altText: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  sortOrder: number;
};

export type HomepageProductPlacement = {
  id: string;
  productId: string;
  badge: string | null;
  sortOrder: number;
};

export type HomepageContent = { slides: HomepageSlide[]; products: HomepageProductPlacement[] };

export const defaultHomepageSlide: HomepageSlide = {
  id: "default-homepage-slide",
  title: "Everything you need to finish your home – in one place",
  subtitle: "Your all-in-one source for every build detail.",
  imageUrl: "/images/buildanta-v2/homepage-construction-team-v2.webp",
  altText: "Indian architect and site engineer reviewing building plans beside construction materials",
  ctaLabel: "Browse materials",
  ctaHref: "/categories",
  sortOrder: 0,
};

function isSlide(value: unknown): value is HomepageSlide {
  if (!value || typeof value !== "object") return false;
  const slide = value as Record<string, unknown>;
  return typeof slide.id === "string" && typeof slide.title === "string" && typeof slide.imageUrl === "string" && typeof slide.altText === "string";
}

function isPlacement(value: unknown): value is HomepageProductPlacement {
  if (!value || typeof value !== "object") return false;
  const placement = value as Record<string, unknown>;
  return typeof placement.id === "string" && typeof placement.productId === "string";
}

export const getHomepageContent = cache(async (): Promise<HomepageContent> => {
  try {
    const baseUrl = (process.env.INVENTORY_API_URL || DEFAULT_API_URL).replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/homepage-content`, { cache: "no-store", headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`Homepage content API returned ${response.status}.`);
    const payload = await response.json() as Partial<HomepageContent>;
    return {
      slides: Array.isArray(payload.slides) ? payload.slides.filter(isSlide) : [],
      products: Array.isArray(payload.products) ? payload.products.filter(isPlacement) : [],
    };
  } catch {
    return { slides: [], products: [] };
  }
});
