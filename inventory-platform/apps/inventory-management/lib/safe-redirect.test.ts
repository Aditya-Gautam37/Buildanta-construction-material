import assert from "node:assert/strict";
import test from "node:test";
import { safeRedirectPath } from "./safe-redirect";

test("keeps safe same-origin paths", () => {
  assert.equal(safeRedirectPath("/dashboard?tab=products"), "/dashboard?tab=products");
});

test("rejects absolute and protocol-relative redirects", () => {
  assert.equal(safeRedirectPath("https://evil.example"), "/dashboard");
  assert.equal(safeRedirectPath("//evil.example"), "/dashboard");
  assert.equal(safeRedirectPath("/\\evil.example"), "/dashboard");
});
