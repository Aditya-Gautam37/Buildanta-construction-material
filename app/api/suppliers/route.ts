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
    const imageUrl = new URL(`/api/supplier-images/${reference}.${extension}`, request.url).toString();
    const apiUrl = (process.env.INVENTORY_API_URL || (process.env.NODE_ENV === "development" ? "http://localhost:5173" : "https://buildanta-monorepo-nest-api.vercel.app")).replace(/\/$/, "");
    const apiResponse = await fetch(`${apiUrl}/supplier-submissions`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ reference, contactName, email, phone, company, productName, brand, category, unit, price, stock, description, imageUrl }),
      cache: "no-store",
    });
    if (!apiResponse.ok) {
      await bindings.PRODUCT_IMAGES.delete(imageKey);
      const failure = await apiResponse.json().catch(() => null) as { message?: string | string[] } | null;
      const message = Array.isArray(failure?.message) ? failure.message.join(" ") : failure?.message;
      return Response.json({ error: message || "Unable to save this listing for review." }, { status: apiResponse.status });
    }
    return Response.json({ reference }, { status: 201 });
  } catch {
    return Response.json({ error: "The listing service is temporarily unavailable. Please try again." }, { status: 500 });
  }
}
