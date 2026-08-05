import { getCatalogSnapshot, rootNodes } from "../live-catalog";
import { ProductBrowser } from "../product-browser";

export default async function ByStage({ searchParams }: { searchParams: Promise<{ stage?: string; q?: string }> }) {
  const [params, catalog] = await Promise.all([searchParams, getCatalogSnapshot()]);
  const options = rootNodes(catalog.stages).map((stage) => stage.name);
  return <main className="listing-page stage-listing-page"><ProductBrowser mode="stage" products={catalog.products} options={options} initial={params.stage} query={params.q} /></main>;
}
