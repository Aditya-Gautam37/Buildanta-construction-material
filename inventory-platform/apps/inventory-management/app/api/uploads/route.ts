import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { prisma } from "@workspace/db";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { safeFileName, validateUpload } from "@/lib/uploads/validate-upload";

export async function POST(request: Request) {
  const sessionClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  const staff = user
    ? await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    : null;

  const form = await request.formData();
  const file = form.get("file");
  const kind = form.get("kind");

  const validation = validateUpload({
    isAuthenticated: Boolean(user),
    staffRole: staff?.role ?? null,
    kind,
    file: file instanceof File ? file : null,
    maxBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 5 * 1024 * 1024),
  });
  if (!validation.ok) return Response.json({ error: validation.error }, { status: validation.status });
  // Narrowed by validateUpload above: isAuthenticated required user, file instanceof File required to pass.
  const uploadFile = file as File;
  const uploaderId = user!.id;

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
  const folder = kind === "category" ? "categories" : uploaderId;
  const path = `${folder}/${crypto.randomUUID()}-${safeFileName(uploadFile.name || "image")}`;
  const { error } = await storage.storage.from(bucket).upload(path, uploadFile, {
    contentType: uploadFile.type,
    upsert: false,
  });
  if (error) {
    console.error("Supabase Storage upload failed.", { bucket, message: error.message });
    return Response.json({ error: "Unable to store the image." }, { status: 502 });
  }

  const { data } = storage.storage.from(bucket).getPublicUrl(path);
  return Response.json({ url: data.publicUrl });
}
