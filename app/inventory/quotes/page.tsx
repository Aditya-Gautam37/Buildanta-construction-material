import { requireChatGPTUser } from "../../chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function InventoryQuotes() {
  const user = await requireChatGPTUser("/inventory/quotes");
  return <main className="simple-protected"><div><a href="/inventory">← Inventory</a><p>QUOTE WORKSPACE</p><h1>Quote requests</h1><span>Signed in as {user.email}</span></div><section className="empty-panel"><span>▤</span><h2>No open quotes in this preview</h2><p>New customer requirements will appear here after submission.</p><a className="button navy" href="/bulk-quotes">Submit a test quote</a></section></main>;
}
