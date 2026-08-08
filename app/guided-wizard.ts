import type { CatalogNode, StoreProduct } from "./live-catalog";

export type WizardOption = { node: CatalogNode; productCount: number };

export const MAX_VISIBLE_OPTIONS = 6;

function childrenOf(categories: CatalogNode[], parentId: string | null) {
  return categories.filter((node) => node.parentId === parentId);
}

/**
 * The category and everything published beneath it. Traversal stops at an
 * excluded node rather than filtering afterwards: hiding "Exterior Paints" must
 * hide the emulsion and putty under it too, not just the label.
 */
export function subtreeIds(
  categories: CatalogNode[],
  rootId: string,
  excludedIds: ReadonlySet<string> = new Set(),
): string[] {
  if (excludedIds.has(rootId)) return [];
  const out = [rootId];
  const seen = new Set(out);
  for (let index = 0; index < out.length; index += 1) {
    for (const child of childrenOf(categories, out[index]!)) {
      if (child.published && !seen.has(child.id) && !excludedIds.has(child.id)) {
        seen.add(child.id);
        out.push(child.id);
      }
    }
  }
  return out;
}

/**
 * Counted on ids, never names: two `Primer` nodes have lived under Paints, and
 * a name match would have credited one with the other's stock.
 */
export function productsInSubtree(
  products: StoreProduct[],
  categories: CatalogNode[],
  rootId: string,
  excludedIds: ReadonlySet<string> = new Set(),
): StoreProduct[] {
  const scope = new Set(subtreeIds(categories, rootId, excludedIds));
  return products.filter((product) => product.categoryIds.some((id) => scope.has(id)));
}

/**
 * A room's departments, in the order staff arranged them. Empty branches are
 * dropped so a shopper never taps into a dead end.
 */
export function departmentsFor(
  owner: CatalogNode | undefined,
  categories: CatalogNode[],
  products: StoreProduct[],
): WizardOption[] {
  if (!owner) return [];
  const excluded = excludedIdsFor(owner);
  const byId = new Map(categories.map((node) => [node.id, node]));
  return owner.categoryLinks
    .filter((link) => link.mode === "INCLUDE")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((link) => {
      const node = byId.get(link.categoryId);
      if (!node?.published || excluded.has(node.id)) return [];
      const productCount = productsInSubtree(products, categories, node.id, excluded).length;
      return productCount > 0 ? [{ node, productCount }] : [];
    });
}

export function excludedIdsFor(owner: CatalogNode | undefined): ReadonlySet<string> {
  if (!owner) return new Set();
  return new Set(owner.categoryLinks.filter((link) => link.mode === "EXCLUDE").map((link) => link.categoryId));
}

/**
 * The next step down. Ranked by how much a shopper can actually buy there, so
 * the shortened list keeps the choices that matter.
 */
export function childOptions(
  categories: CatalogNode[],
  products: StoreProduct[],
  parentId: string,
  excludedIds: ReadonlySet<string> = new Set(),
): WizardOption[] {
  return childrenOf(categories, parentId)
    .filter((node) => node.published && !excludedIds.has(node.id))
    .map((node) => ({ node, productCount: productsInSubtree(products, categories, node.id, excludedIds).length }))
    .filter((option) => option.productCount > 0)
    .sort((a, b) => b.productCount - a.productCount || a.node.sortOrder - b.node.sortOrder || a.node.name.localeCompare(b.node.name));
}

/**
 * Walks past levels that offer no real choice, returning the categories it
 * skipped so the breadcrumb can still show the full path taken.
 */
export function resolveStep(
  categories: CatalogNode[],
  products: StoreProduct[],
  startId: string,
  excludedIds: ReadonlySet<string> = new Set(),
): { current: CatalogNode; skipped: CatalogNode[]; options: WizardOption[] } {
  const byId = new Map(categories.map((node) => [node.id, node]));
  const skipped: CatalogNode[] = [];
  let current = byId.get(startId)!;
  let options = childOptions(categories, products, current.id, excludedIds);
  const guard = new Set<string>([current.id]);

  while (options.length === 1) {
    const only = options[0]!.node;
    // A single child that holds nothing of its own is pure ceremony: descend.
    // Stop if the level also has products directly, since that is a real choice.
    const directHere = products.filter((product) => product.categoryIds.includes(current.id)).length;
    if (directHere > 0 || guard.has(only.id)) break;
    skipped.push(current);
    guard.add(only.id);
    current = only;
    options = childOptions(categories, products, current.id, excludedIds);
  }

  return { current, skipped, options };
}

/** Root-to-node path, for the breadcrumb. */
export function ancestryOf(categories: CatalogNode[], nodeId: string): CatalogNode[] {
  const byId = new Map(categories.map((node) => [node.id, node]));
  const path: CatalogNode[] = [];
  const seen = new Set<string>();
  let cursor = byId.get(nodeId);
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    path.unshift(cursor);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }
  return path;
}

/** Brands available at the end of a journey, most stocked first. */
export function brandOptions(products: StoreProduct[]): Array<{ brand: string; productCount: number }> {
  const counts = new Map<string, number>();
  for (const product of products) counts.set(product.brand, (counts.get(product.brand) ?? 0) + 1);
  return [...counts.entries()]
    .map(([brand, productCount]) => ({ brand, productCount }))
    .sort((a, b) => b.productCount - a.productCount || a.brand.localeCompare(b.brand));
}
