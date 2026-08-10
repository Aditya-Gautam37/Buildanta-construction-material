import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("construction category cards", () => {
  it("preserves category destinations, child links, counts, and responsive images", async () => {
    const source = await readFile("app/categories/page.tsx", "utf8");

    expect(source).toContain('href={`/categories/${category.slug}`}');
    expect(source).toContain('href={`/categories/${item.slug}`}');
    expect(source).toContain("products.length === 1");
    expect(source).toContain('className={products.length === 0 ? "is-empty" : undefined}');
    expect(source).toContain("<Image");
    expect(source).toContain("fill");
    expect(source).toContain("sizes=");
  });

  it("keeps the card compact at three, two, and one-column breakpoints", async () => {
    const styles = await readFile("app/electro-storefront.css", "utf8");

    expect(styles).toMatch(/\.taxonomy-page \.taxonomy-grid\s*\{[\s\S]*?repeat\(3,/);
    expect(styles).toMatch(/@media \(max-width: 1180px\)[\s\S]*?repeat\(2,/);
    expect(styles).toMatch(/@media \(max-width: 760px\)[\s\S]*?\.taxonomy-page \.taxonomy-grid\s*\{\s*grid-template-columns: 1fr/);
    expect(styles).toMatch(/\.taxonomy-page \.taxonomy-card-copy\s*\{[\s\S]*?display: flex;[\s\S]*?flex-direction: column/);
    expect(styles).toMatch(/\.taxonomy-page \.taxonomy-card-action\s*\{[\s\S]*?margin-top: auto/);
    expect(styles).toMatch(/\.taxonomy-page \.taxonomy-grid ul\s*\{[\s\S]*?repeat\(2,/);
  });
});
