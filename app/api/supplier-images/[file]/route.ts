import { env } from "cloudflare:workers";

type Bindings = { PRODUCT_IMAGES: R2Bucket };

export async function GET(_request: Request, context: { params: Promise<{ file: string }> }) {
  const { file } = await context.params;
  if (!/^LP-\d{6}-[A-Z0-9]{6}\.(png|jpg|webp)$/.test(file)) return new Response("Not found", { status: 404 });
  const object = await (env as unknown as Bindings).PRODUCT_IMAGES.get(`supplier-products/${file}`);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("etag", object.httpEtag);
  return new Response(object.body, { headers });
}
