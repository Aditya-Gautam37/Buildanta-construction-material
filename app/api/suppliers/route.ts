import { env } from "cloudflare:workers";

type Bindings = { DB: D1Database; PRODUCT_IMAGES: R2Bucket };

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const bindings = env as unknown as Bindings;
    const form = await request.formData();
    const email = clean(form.get("email")).toLowerCase();
    const contactName = clean(form.get("contactName"));
    const phone = clean(form.get("phone"));
    const company = clean(form.get("company"));
    const productName = clean(form.get("productName"));
    const brand = clean(form.get("brand"));
    const category = clean(form.get("category"));
    const unit = clean(form.get("unit"));
    const description = clean(form.get("description"));
    const price = Number(clean(form.get("price")));
    const stock = Number(clean(form.get("stock")));
    const image = form.get("image");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !contactName || !phone || !company || !productName || !brand || !category || !unit || !description) return Response.json({ error: "Complete all required supplier and product details." }, { status: 400 });
    if (!Number.isFinite(price) || price < 0 || !Number.isSafeInteger(stock) || stock < 0) return Response.json({ error: "Enter a valid price and stock quantity." }, { status: 400 });
    if (!(image instanceof File) || !["image/png", "image/jpeg", "image/webp"].includes(image.type) || image.size > 5_000_000) return Response.json({ error: "Upload a PNG, JPG or WebP image smaller than 5 MB." }, { status: 400 });

    const reference = `LP-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const extension = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
    const imageKey = `supplier-products/${reference}.${extension}`;
    await bindings.PRODUCT_IMAGES.put(imageKey, image.stream(), { httpMetadata: { contentType: image.type }, customMetadata: { reference, company } });
    await bindings.DB.prepare(`CREATE TABLE IF NOT EXISTS supplier_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT, reference TEXT NOT NULL UNIQUE, contact_name TEXT NOT NULL,
      email TEXT NOT NULL, phone TEXT NOT NULL, company TEXT NOT NULL, product_name TEXT NOT NULL,
      brand TEXT NOT NULL, category TEXT NOT NULL, unit TEXT NOT NULL, price REAL NOT NULL,
      stock INTEGER NOT NULL, description TEXT NOT NULL, image_key TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', created_at INTEGER NOT NULL
    )`).run();
    await bindings.DB.prepare("INSERT INTO supplier_submissions (reference, contact_name, email, phone, company, product_name, brand, category, unit, price, stock, description, image_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(reference, contactName, email, phone, company, productName, brand, category, unit, price, stock, description, imageKey, Date.now()).run();
    return Response.json({ reference }, { status: 201 });
  } catch {
    return Response.json({ error: "The listing service is temporarily unavailable. Please try again." }, { status: 500 });
  }
}
