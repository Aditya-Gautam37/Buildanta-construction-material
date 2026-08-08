import type { MetadataRoute } from "next";
import { getCatalogSnapshot, rootNodes } from "./live-catalog";
import { departmentsFor } from "./guided-wizard";
import { getProfessionals, professionalCategories } from "./professional-directory";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://buildanta.com";

const staticRoutes = [
  "", "/categories", "/by-stage", "/by-room", "/calculators", "/professionals",
  "/bulk-quotes", "/list-product", "/more", "/login", "/signup",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [catalog, professionals] = await Promise.all([getCatalogSnapshot(), getProfessionals()]);

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = catalog.categories.map((category) => ({
    url: `${SITE_URL}/categories/${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // Wizard entry points are canonical pages in their own right. The steps
  // beyond them are the same category URLs with a lens parameter, which
  // canonicalise back to the category, so only the entries belong here.
  const roomEntries: MetadataRoute.Sitemap = rootNodes(catalog.rooms)
    .filter((room) => departmentsFor(room, catalog.categories, catalog.products).length > 0)
    .map((room) => ({ url: `${SITE_URL}/by-room/${room.slug}`, changeFrequency: "weekly", priority: 0.7 }));

  const stageEntries: MetadataRoute.Sitemap = rootNodes(catalog.stages)
    .filter((stage) => departmentsFor(stage, catalog.categories, catalog.products).length > 0)
    .map((stage) => ({ url: `${SITE_URL}/by-stage/${stage.slug}`, changeFrequency: "weekly", priority: 0.7 }));

  const stocked = new Set(catalog.products.map((product) => product.brand));
  const brandEntries: MetadataRoute.Sitemap = catalog.brands
    .filter((brand) => stocked.has(brand.name))
    .map((brand) => ({ url: `${SITE_URL}/brands/${brand.slug}`, changeFrequency: "weekly", priority: 0.5 }));

  const productEntries: MetadataRoute.Sitemap = catalog.products.map((product) => ({
    url: `${SITE_URL}/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const professionalTypeEntries: MetadataRoute.Sitemap = professionalCategories.map((category) => ({
    url: `${SITE_URL}/professionals/${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const professionalProfileEntries: MetadataRoute.Sitemap = professionals.flatMap((professional) => {
    const category = professionalCategories.find((item) => item.type === professional.type);
    return category ? [{ url: `${SITE_URL}/professionals/${category.slug}/${professional.slug}`, changeFrequency: "monthly" as const, priority: 0.4 }] : [];
  });

  return [...staticEntries, ...roomEntries, ...stageEntries, ...brandEntries, ...categoryEntries, ...productEntries, ...professionalTypeEntries, ...professionalProfileEntries];
}
