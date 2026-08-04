import { GetObjectCommand, NoSuchKey } from "@aws-sdk/client-s3";
import { r2BucketName, r2Client } from "../../../r2-client";

export async function GET(_request: Request, context: { params: Promise<{ file: string }> }) {
  const { file } = await context.params;
  if (!/^LP-\d{6}-[A-Z0-9]{6}\.(png|jpg|webp)$/.test(file)) return new Response("Not found", { status: 404 });
  try {
    const object = await r2Client().send(new GetObjectCommand({ Bucket: r2BucketName(), Key: `supplier-products/${file}` }));
    const body = await object.Body?.transformToByteArray();
    if (!body) return new Response("Not found", { status: 404 });
    const headers = new Headers();
    if (object.ContentType) headers.set("content-type", object.ContentType);
    headers.set("cache-control", "public, max-age=31536000, immutable");
    if (object.ETag) headers.set("etag", object.ETag);
    return new Response(body, { headers });
  } catch (error) {
    if (error instanceof NoSuchKey) return new Response("Not found", { status: 404 });
    throw error;
  }
}
