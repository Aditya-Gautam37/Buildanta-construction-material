import assert from "node:assert/strict";
import test from "node:test";
import { resolveRouteAccess } from "./route-access";

function decide(overrides: Partial<Parameters<typeof resolveRouteAccess>[0]> = {}) {
  return resolveRouteAccess({
    pathname: "/dashboard",
    search: "",
    isAuthenticated: true,
    needsProfileCompletion: false,
    existingRedirectParam: null,
    ...overrides,
  });
}

test("sends an unauthenticated visitor to any non-public admin page to login", () => {
  for (const pathname of ["/stock", "/fulfilment", "/quotations", "/reports", "/catalog-control", "/category-management", "/commerce", "/homepage-content", "/professionals", "/requests", "/calculators", "/inventory-locations", "/"]) {
    assert.equal(decide({ pathname, isAuthenticated: false }), `/login?redirect=${encodeURIComponent(pathname)}`);
  }
});

test("a newly-added admin page is protected by default without being listed anywhere", () => {
  // The whole point of default-deny: a route nobody has heard of yet still
  // requires auth, because it isn't in PUBLIC_ROUTES — not because someone
  // remembered to add it to a protected-routes list.
  assert.equal(decide({ pathname: "/some-page-added-tomorrow", isAuthenticated: false }), "/login?redirect=%2Fsome-page-added-tomorrow");
});

test("lets an unauthenticated visitor reach public routes", () => {
  for (const pathname of ["/login", "/signup", "/forgot-password", "/reset-password", "/fast", "/access-denied"]) {
    assert.equal(decide({ pathname, isAuthenticated: false }), null);
  }
});

test("lets a signed-in, complete-profile user reach a protected admin page", () => {
  assert.equal(decide({ pathname: "/stock", isAuthenticated: true, needsProfileCompletion: false }), null);
});

test("sends a signed-in user with an incomplete profile to complete it, preserving where they were headed", () => {
  assert.equal(
    decide({ pathname: "/stock", search: "?tab=low", isAuthenticated: true, needsProfileCompletion: true }),
    `/profile/complete?redirect=${encodeURIComponent("/stock?tab=low")}`,
  );
});

test("does not redirect-loop a user who is already on the profile-completion page", () => {
  assert.equal(decide({ pathname: "/profile/complete", isAuthenticated: true, needsProfileCompletion: true }), null);
});

test("bounces a signed-in user away from login/signup to their dashboard", () => {
  assert.equal(decide({ pathname: "/login", isAuthenticated: true, needsProfileCompletion: false }), "/dashboard");
  assert.equal(decide({ pathname: "/signup", isAuthenticated: true, needsProfileCompletion: false }), "/dashboard");
});

test("sends a signed-in but incomplete-profile user away from login to complete their profile, keeping their original destination", () => {
  assert.equal(
    decide({ pathname: "/login", isAuthenticated: true, needsProfileCompletion: true, existingRedirectParam: "/quotations" }),
    `/profile/complete?redirect=${encodeURIComponent("/quotations")}`,
  );
});
