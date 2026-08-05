import { getCatalogSnapshot, rootNodes } from "../live-catalog";
import { ProductBrowser } from "../product-browser";

export default async function ByStage({ searchParams }: { searchParams: Promise<{ stage?: string; q?: string }> }) {
  const [params, catalog] = await Promise.all([searchParams, getCatalogSnapshot()]);
  const options = rootNodes(catalog.stages).map((stage) => stage.name);
  return <main className="listing-page stage-listing-page"><div className="page-intro stage-page-intro"><div><p>PLAN THE BUILD, PHASE BY PHASE</p><h1>Shop by Construction Stage</h1><span>Choose a phase, answer the guided project questions and receive a preliminary material and product schedule.</span><div className="stage-intro-points"><b>Live inventory mapping</b><b>Indicative project pricing</b><b>Quote-ready products</b></div></div><aside><img src="/demo/products/real/steel.jpg" alt="Construction worker inspecting reinforcement steel" /><span><small>PLANNING COVERAGE</small><strong>{options.length} planning stages</strong></span></aside></div><ProductBrowser mode="stage" products={catalog.products} options={options} initial={params.stage} query={params.q} /></main>;
}
