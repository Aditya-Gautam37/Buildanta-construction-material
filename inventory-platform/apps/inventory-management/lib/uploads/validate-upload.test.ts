import assert from "node:assert/strict";
import test from "node:test";
import { UserRole } from "@workspace/db";
import { safeFileName, validateUpload } from "./validate-upload";

const goodFile = { type: "image/png", size: 1024 };
const baseInput = {
  isAuthenticated: true,
  staffRole: UserRole.CATALOG_MANAGER as UserRole | null,
  kind: "product" as unknown,
  file: goodFile as { type: string; size: number } | null,
  maxBytes: 5 * 1024 * 1024,
};

test("accepts a valid staff upload", () => {
  assert.deepEqual(validateUpload(baseInput), { ok: true });
});

test("rejects an unauthenticated request before checking anything else", () => {
  assert.deepEqual(validateUpload({ ...baseInput, isAuthenticated: false, staffRole: null }), {
    ok: false, status: 401, error: "Authentication required.",
  });
});

test("rejects a signed-in user who has no staff role at all (session exists, no profile row)", () => {
  const result = validateUpload({ ...baseInput, staffRole: null });
  assert.equal(result.ok, false);
  assert.equal((result as { status: number }).status, 403);
});

test("rejects a signed-in customer (has a role, just not an allowed one)", () => {
  const result = validateUpload({ ...baseInput, staffRole: UserRole.CUSTOMER });
  assert.equal(result.ok, false);
  assert.equal((result as { status: number }).status, 403);
});

test("allows every role the upload route is meant to serve", () => {
  for (const role of [UserRole.ADMIN, UserRole.CATALOG_MANAGER, UserRole.DATA_ENTRY]) {
    assert.equal(validateUpload({ ...baseInput, staffRole: role }).ok, true);
  }
});

test("rejects roles that were never meant to upload images", () => {
  for (const role of [UserRole.SALES, UserRole.WAREHOUSE_MANAGER, UserRole.FINANCE, UserRole.SUPPORT, UserRole.PROCUREMENT]) {
    const result = validateUpload({ ...baseInput, staffRole: role });
    assert.equal(result.ok, false);
    assert.equal((result as { status: number }).status, 403);
  }
});

test("rejects a missing or unrecognized upload kind", () => {
  assert.equal(validateUpload({ ...baseInput, kind: undefined }).ok, false);
  assert.equal(validateUpload({ ...baseInput, kind: "not-a-real-kind" }).ok, false);
});

test("rejects a missing file", () => {
  const result = validateUpload({ ...baseInput, file: null });
  assert.equal(result.ok, false);
  assert.equal((result as { status: number }).status, 400);
});

test("rejects a disallowed file type", () => {
  const result = validateUpload({ ...baseInput, file: { type: "application/pdf", size: 1024 } });
  assert.equal(result.ok, false);
  assert.equal((result as { status: number }).status, 415);
});

test("rejects a file over the size limit, and an empty file", () => {
  assert.equal((validateUpload({ ...baseInput, file: { type: "image/png", size: 10 * 1024 * 1024 } }) as { status: number }).status, 413);
  assert.equal((validateUpload({ ...baseInput, file: { type: "image/png", size: 0 } }) as { status: number }).status, 413);
});

test("safeFileName strips every path separator, so a crafted name can't escape its folder in Storage", () => {
  // Dots are an allowed character (real filenames have extensions), so a
  // literal ".." can survive as text — what actually matters is that no "/"
  // makes it through, since the sanitized result is used as a single path
  // segment after a random UUID prefix.
  for (const crafted of ["../../etc/passwd", "../../../evil.png", "/etc/passwd", "a/b/../../c"]) {
    assert.ok(!safeFileName(crafted).includes("/"), `expected no "/" in sanitized "${crafted}"`);
  }
  assert.equal(safeFileName("../../etc/passwd"), "..-..-etc-passwd");
});

test("safeFileName keeps a normal filename intact", () => {
  assert.equal(safeFileName("product-photo_01.png"), "product-photo_01.png");
});

test("safeFileName caps length so it can't blow out the storage path", () => {
  const long = "a".repeat(300) + ".png";
  assert.equal(safeFileName(long).length, 120);
});
