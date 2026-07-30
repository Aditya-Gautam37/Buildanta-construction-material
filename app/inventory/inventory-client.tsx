"use client";

import { useState } from "react";
import type { Product } from "../data";

export function InventoryClient({ initialProducts }: { initialProducts: Product[] }) {
  const [items, setItems] = useState(initialProducts);
  const [term, setTerm] = useState("");
  const [message, setMessage] = useState("");
  const visible = items.filter((item) => `${item.name} ${item.brand} ${item.category}`.toLowerCase().includes(term.toLowerCase()));

  async function adjust(slug: string, delta: number) {
    setMessage("");
    const response = await fetch("/api/inventory", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, delta, reason: delta > 0 ? "Stock received" : "Manual adjustment" }) });
    const data = await response.json() as { stock?: number; error?: string };
    if (!response.ok || typeof data.stock !== "number") return setMessage(data.error || "Unable to update inventory.");
    setItems((current) => current.map((item) => item.slug === slug ? { ...item, stock: data.stock! } : item));
    setMessage("Inventory updated and saved.");
  }

  return <><div className="inventory-toolbar"><label><span>⌕</span><input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search inventory..." /></label><a className="button orange" href="/list-product">+ Add product</a></div>{message && <p className={message.includes("saved") ? "save-message" : "form-error"} role="status">{message}</p>}<div className="inventory-table-wrap"><table><thead><tr><th>Product</th><th>SKU / Category</th><th>Price</th><th>Stock</th><th>Update</th></tr></thead><tbody>{visible.map((item) => <tr key={item.slug}><td><span className={`table-thumb ${item.tone}`}>{item.brand.slice(0, 2)}</span><div><strong>{item.name}</strong><small>{item.brand}</small></div></td><td><small>{item.slug.toUpperCase().slice(0, 14)}</small><span>{item.category}</span></td><td>₹{item.price.toLocaleString("en-IN")}<small>/{item.unit}</small></td><td><b className={item.stock < 20 ? "low-stock" : ""}>{item.stock}</b><small>{item.stock < 20 ? "Low stock" : "Available"}</small></td><td><button aria-label={`Remove one ${item.name}`} onClick={() => adjust(item.slug, -1)}>−</button><button aria-label={`Add one ${item.name}`} onClick={() => adjust(item.slug, 1)}>+</button></td></tr>)}</tbody></table></div></>;
}
