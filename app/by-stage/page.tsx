import { getCatalogSnapshot, rootNodes } from "../live-catalog";
import { ProductBrowser } from "../product-browser";

export default async function ByStage({ searchParams }: { searchParams: Promise<{ stage?: string; q?: string }> }) {
  const [params, catalog] = await Promise.all([searchParams, getCatalogSnapshot()]);
  const options = rootNodes(catalog.stages).map((stage) => stage.name);
  return <main className="listing-page"><div className="page-intro"><p>BUILDANTA PRODUCT DISCOVERY</p><h1>Shop by Construction Stage</h1><span>Find the right materials for every step of your build, from foundation to final finish.</span></div><ProductBrowser mode="stage" products={catalog.products} options={options} initial={params.stage} query={params.q} /></main>;
}
