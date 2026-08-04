import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { prisma, UserRole } from "@workspace/db";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(-120);
}

export async function POST(request: Request) {
  const sessionClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const staff = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (!staff || (staff.role !== UserRole.ADMIN && staff.role !== UserRole.DATA_ENTRY)) {
    return Response.json({ error: "Inventory staff access is required." }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const kind = form.get("kind");
  if (!(file instanceof File) || (kind !== "product" && kind !== "brand" && kind !== "professional" && kind !== "homepage" && kind !== "category")) {
    return Response.json({ error: "A valid image and upload kind are required." }, { status: 400 });
  }

  const maxBytes = Number(process.env.MAX_UPLOAD_BYTES ?? 5 * 1024 * 1024);
  if (!allowedTypes.has(file.type)) {
    return Response.json({ error: "Only JPEG, PNG, WebP, and AVIF images are supported." }, { status: 415 });
  }
  if (!Number.isFinite(maxBytes) || file.size < 1 || file.size > maxBytes) {
    return Response.json({ error: `Images must be smaller than ${Math.round(maxBytes / 1024 / 1024)} MB.` }, { status: 413 });
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || (!secretKey && !publishableKey)) {
    return Response.json({ error: "Supabase Storage is not configured." }, { status: 503 });
  }

  const {
    data: { session },
  } = await sessionClient.auth.getSession();
  const storage = createSupabaseClient(supabaseUrl, secretKey ?? publishableKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: secretKey || !session?.access_token
      ? undefined
      : { headers: { Authorization: `Bearer ${session.access_token}` } },
  });

  const bucket = kind === "brand"
    ? process.env.SUPABASE_BRAND_LOGOS_BUCKET ?? "BrandLogos"
    : kind === "professional"
      ? process.env.SUPABASE_PROFESSIONAL_PHOTOS_BUCKET ?? process.env.SUPABASE_PRODUCT_IMAGES_BUCKET ?? "ProductImages"
      : kind === "homepage"
        ? process.env.SUPABASE_HOMEPAGE_IMAGES_BUCKET ?? process.env.SUPABASE_PRODUCT_IMAGES_BUCKET ?? "ProductImages"
      : process.env.SUPABASE_PRODUCT_IMAGES_BUCKET ?? "ProductImages";
  const folder = kind === "category" ? "categories" : user.id;
  const path = `${folder}/${crypto.randomUUID()}-${safeFileName(file.name || "image")}`;
  const { error } = await storage.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    console.error("Supabase Storage upload failed.", { bucket, message: error.message });
    return Response.json({ error: "Unable to store the image." }, { status: 502 });
  }

  const { data } = storage.storage.from(bucket).getPublicUrl(path);
  return Response.json({ url: data.publicUrl });
}
