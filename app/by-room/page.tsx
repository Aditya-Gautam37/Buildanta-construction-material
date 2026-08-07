import { getCatalogSnapshot, rootNodes } from "../live-catalog";
import { ProductBrowser } from "../product-browser";

export default async function ByRoom({ searchParams }: { searchParams: Promise<{ room?: string; q?: string }> }) {
  const [params, catalog] = await Promise.all([searchParams, getCatalogSnapshot()]);
  const options = rootNodes(catalog.rooms).map((room) => room.name);
  return <main className="listing-page"><ProductBrowser mode="room" products={catalog.products} options={options} initial={params.room} query={params.q} /></main>;
}
