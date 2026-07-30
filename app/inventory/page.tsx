import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";
import { products } from "../data";
import { InventoryClient } from "./inventory-client";

export const dynamic = "force-dynamic";

export default async function Inventory() {
  const user = await requireChatGPTUser("/inventory");
  return <main className="inventory-page"><aside className="inventory-nav"><a className="wordmark" href="/"><img src="/logo.png" alt="" /><strong>Buildanta</strong></a><p>INVENTORY PORTAL</p><nav><a className="active" href="/inventory">▦ Products</a><a href="/inventory/quotes">▤ Quote requests</a><a href="/list-product">＋ Add product</a><a href="/">↗ View storefront</a></nav><div><strong>{user.displayName}</strong><span>{user.email}</span><a href={chatGPTSignOutPath("/")}>Sign out</a></div></aside><section className="inventory-content"><header><div><p>CATALOGUE MANAGEMENT</p><h1>Product inventory</h1><span>Review listed products and record stock adjustments.</span></div><div className="metric"><span>Total listed stock</span><strong>{products.reduce((sum, item) => sum + item.stock, 0).toLocaleString("en-IN")}</strong></div></header><InventoryClient initialProducts={products} /></section></main>;
}
