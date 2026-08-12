import { UserRole } from "@workspace/db";

// Pulled out of app/api/uploads/route.ts so the security-relevant checks —
// who's allowed to upload, what they're allowed to upload — are testable
// without a Supabase connection or a running Next.js server.
export const UPLOAD_ROLES: Set<UserRole> = new Set([UserRole.ADMIN, UserRole.CATALOG_MANAGER, UserRole.DATA_ENTRY]);
export const ALLOWED_UPLOAD_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
export const UPLOAD_KINDS = new Set(["product", "brand", "professional", "homepage", "category"]);

/** Strips anything that isn't a safe filename character, and caps length — the
 * result is used directly as (part of) a Supabase Storage object path, so a
 * "../" or a leading "/" here would be a path-traversal / bucket-escape bug. */
export function safeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(-120);
}

export type UploadValidationInput = {
  /** Whether a Supabase session was found at all — distinct from having a staff role. */
  isAuthenticated: boolean;
  /** The signed-in user's database role, or null if they have no staff profile row. */
  staffRole: UserRole | null;
  kind: unknown;
  file: { type: string; size: number } | null;
  maxBytes: number;
};

export type UploadValidationResult = { ok: true } | { ok: false; status: number; error: string };

export function validateUpload({ isAuthenticated, staffRole, kind, file, maxBytes }: UploadValidationInput): UploadValidationResult {
  if (!isAuthenticated) return { ok: false, status: 401, error: "Authentication required." };
  if (!staffRole || !UPLOAD_ROLES.has(staffRole)) return { ok: false, status: 403, error: "Inventory staff access is required." };
  if (!file || typeof kind !== "string" || !UPLOAD_KINDS.has(kind)) {
    return { ok: false, status: 400, error: "A valid image and upload kind are required." };
  }
  if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
    return { ok: false, status: 415, error: "Only JPEG, PNG, WebP, and AVIF images are supported." };
  }
  if (!Number.isFinite(maxBytes) || file.size < 1 || file.size > maxBytes) {
    return { ok: false, status: 413, error: `Images must be smaller than ${Math.round(maxBytes / 1024 / 1024)} MB.` };
  }
  return { ok: true };
}
