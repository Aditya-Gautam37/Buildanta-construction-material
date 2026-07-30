import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import { products } from "../../data";

type Bindings = { DB: D1Database };

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in is required." }, { status: 401 });
  try {
    const { slug, delta, reason } = await request.json() as { slug?: unknown; delta?: unknown; reason?: unknown };
    if (typeof slug !== "string" || !Number.isSafeInteger(delta) || Math.abs(Number(delta)) !== 1) return Response.json({ error: "Invalid inventory adjustment." }, { status: 400 });
    const product = products.find((item) => item.slug === slug);
    if (!product) return Response.json({ error: "Product not found." }, { status: 404 });
    const bindings = env as unknown as Bindings;
    await bindings.DB.prepare("CREATE TABLE IF NOT EXISTS inventory_overrides (slug TEXT PRIMARY KEY, stock INTEGER NOT NULL, updated_at INTEGER NOT NULL, actor_email TEXT NOT NULL)").run();
    await bindings.DB.prepare("CREATE TABLE IF NOT EXISTS inventory_audit (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL, delta INTEGER NOT NULL, reason TEXT NOT NULL, actor_email TEXT NOT NULL, created_at INTEGER NOT NULL)").run();
    const current = await bindings.DB.prepare("SELECT stock FROM inventory_overrides WHERE slug = ?").bind(slug).first<{ stock: number }>();
    const stock = Math.max(0, (current?.stock ?? product.stock) + Number(delta));
    await bindings.DB.batch([
      bindings.DB.prepare("INSERT INTO inventory_overrides (slug, stock, updated_at, actor_email) VALUES (?, ?, ?, ?) ON CONFLICT(slug) DO UPDATE SET stock=excluded.stock, updated_at=excluded.updated_at, actor_email=excluded.actor_email").bind(slug, stock, Date.now(), user.email),
      bindings.DB.prepare("INSERT INTO inventory_audit (slug, delta, reason, actor_email, created_at) VALUES (?, ?, ?, ?, ?)").bind(slug, Number(delta), typeof reason === "string" ? reason.slice(0, 120) : "Manual adjustment", user.email, Date.now()),
    ]);
    return Response.json({ stock });
  } catch {
    return Response.json({ error: "Unable to save the inventory change." }, { status: 500 });
  }
}
