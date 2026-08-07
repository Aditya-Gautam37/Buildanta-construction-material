import { getCatalogSnapshot, rootNodes } from "../live-catalog";
import { ProductBrowser } from "../product-browser";

export default async function ByRoom({ searchParams }: { searchParams: Promise<{ room?: string; q?: string }> }) {
  const [params, catalog] = await Promise.all([searchParams, getCatalogSnapshot()]);
  const options = rootNodes(catalog.rooms).map((room) => room.name);
  return <main className="listing-page"><div className="page-intro discovery-intro"><div><p>SHOP SMARTER</p><h1>Tell us the room. We&apos;ll find the materials.</h1><span>Three quick choices. Clear product matches.</span></div><ol aria-label="How the room finder works"><li><b>1</b>Pick a room</li><li><b>2</b>Choose quantity</li><li><b>3</b>See matches</li></ol></div><ProductBrowser mode="room" products={catalog.products} options={options} initial={params.room} query={params.q} /></main>;
}
