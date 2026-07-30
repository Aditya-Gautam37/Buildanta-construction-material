import { QuoteForm } from "./quote-form";

export default async function BulkQuotes({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product = "" } = await searchParams;
  return <main className="workflow-page"><div className="workflow-intro"><p>FOR BUILDERS, CONTRACTORS & PROFESSIONALS</p><h1>Get Bulk Quotes</h1><span>Tell us what your project needs. We verify suppliers, availability and logistics, then return one clear, competitive quote.</span><ol><li><b>1</b><div><strong>Share your requirement</strong><p>Add products, quantities and delivery details.</p></div></li><li><b>2</b><div><strong>We verify the supply</strong><p>Our team checks stock, pricing and lead times.</p></div></li><li><b>3</b><div><strong>Receive a clear quote</strong><p>Review the offer with one accountable contact.</p></div></li></ol></div><div className="form-card"><p className="form-kicker">PROJECT REQUIREMENT</p><h2>Request project pricing</h2><p>Required fields are marked by your browser.</p><QuoteForm product={product} /></div></main>;
}
