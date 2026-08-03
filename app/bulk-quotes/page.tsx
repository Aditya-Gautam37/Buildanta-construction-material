import { QuoteForm } from "./quote-form";
import { getCatalogSnapshot } from "../live-catalog";

export default async function BulkQuotes({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product = "" } = await searchParams;
  const catalog = await getCatalogSnapshot();
  return <main className="workflow-page"><div className="workflow-intro"><p>FOR BUILDERS, CONTRACTORS & PROFESSIONALS</p><h1>Get Bulk Quotes</h1><span>Build one material basket, confirm delivery details and send the complete requirement to the connected Buildanta sales workspace.</span><ol><li><b>1</b><div><strong>Build your basket</strong><p>Select exact products, variants and quantities.</p></div></li><li><b>2</b><div><strong>Review one request</strong><p>Confirm the material summary and delivery PIN code.</p></div></li><li><b>3</b><div><strong>Receive a controlled quote</strong><p>Sales verifies allocation, GST, freight and validity.</p></div></li></ol></div><div className="form-card"><p className="form-kicker">MULTI-ITEM QUOTATION</p><h2>Request project pricing</h2><p>Products are loaded from the live Inventory catalogue.</p><QuoteForm products={catalog.products} product={product} /></div></main>;
}
