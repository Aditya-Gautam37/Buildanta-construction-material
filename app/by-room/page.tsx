import { ProductBrowser } from "../product-browser";

export default async function ByRoom({ searchParams }: { searchParams: Promise<{ room?: string; q?: string }> }) {
  const params = await searchParams;
  return <main className="listing-page"><div className="page-intro"><p>BUILDANTA PRODUCT DISCOVERY</p><h1>Shop by Room</h1><span>Explore materials and finishes selected for every space in your home.</span></div><ProductBrowser mode="room" initial={params.room} query={params.q} /></main>;
}
