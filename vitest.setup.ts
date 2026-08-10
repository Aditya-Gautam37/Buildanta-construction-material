import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement scrollIntoView/scrollTo; components that call them
// (e.g. after a successful form submission) would otherwise throw in tests.
if (typeof Element !== "undefined") {
  Element.prototype.scrollIntoView ??= () => {};
  Element.prototype.scrollTo ??= () => {};
}
