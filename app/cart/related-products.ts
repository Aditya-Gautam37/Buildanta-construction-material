import type { StoreProduct } from "../live-catalog";

/** Only the fields suggestion needs. The cart page ships this to the browser,
 * so it carries a slim projection rather than whole catalogue entries. */
export type RelatedCandidate = Pick<
  StoreProduct,
  "id" | "slug" | "name" | "category" | "categoryIds" | "stages" | "rooms" | "price" | "unit" | "image" | "imageAlt" | "availability"
>;

/**
 * What to suggest alongside what is already in the cart.
 *
 * Two sources, in strict order of trust:
 *
 * 1. Curated pairings, where someone at Buildanta has said "people buying this
 *    need that". Those are real product knowledge and always win.
 * 2. Otherwise, products that share a category, stage or room with something
 *    already in the cart.
 *
 * The fallback is a guess and is scored accordingly — a shared category is a
 * much stronger signal than a shared room, because every room contains almost
 * everything. Nothing here invents a relationship it cannot point at.
 */

export type RelatedSource = "curated" | "category" | "stage" | "room";

export type RelatedSuggestion = {
  product: RelatedCandidate;
  source: RelatedSource;
  /** Why this was suggested, in words a customer could be shown. */
  reason: string;
};

const SOURCE_RANK: Record<RelatedSource, number> = { curated: 0, category: 1, stage: 2, room: 3 };

/** Out-of-stock items go last: suggesting something unbuyable wastes the slot. */
function buyable(product: RelatedCandidate) {
  return product.availability !== "OUT_OF_STOCK";
}

function overlap(a: string[], b: Set<string>) {
  return a.find((value) => b.has(value));
}

export function relatedForCart(
  cart: { productId: string; productName?: string }[],
  catalogue: RelatedCandidate[],
  options: { curated?: Record<string, string[]>; limit?: number } = {},
): RelatedSuggestion[] {
  const limit = options.limit ?? 4;
  const curated = options.curated ?? {};

  const inCart = new Set(cart.map((line) => line.productId));
  if (inCart.size === 0) return [];

  const byId = new Map(catalogue.map((product) => [product.id, product]));
  const cartProducts = cart.map((line) => byId.get(line.productId)).filter((p): p is RelatedCandidate => Boolean(p));

  const categories = new Set(cartProducts.flatMap((p) => p.categoryIds));
  const stages = new Set(cartProducts.flatMap((p) => p.stages));
  const rooms = new Set(cartProducts.flatMap((p) => p.rooms));

  const picked = new Map<string, RelatedSuggestion>();

  const consider = (product: RelatedCandidate, source: RelatedSource, reason: string) => {
    if (inCart.has(product.id)) return;
    const existing = picked.get(product.id);
    // A product can qualify several ways. Keep the most trustworthy reason.
    if (existing && SOURCE_RANK[existing.source] <= SOURCE_RANK[source]) return;
    picked.set(product.id, { product, source, reason });
  };

  for (const line of cart) {
    for (const relatedId of curated[line.productId] ?? []) {
      const product = byId.get(relatedId);
      if (product) consider(product, "curated", `Often bought with ${byId.get(line.productId)?.name ?? line.productName ?? "your selection"}`);
    }
  }

  for (const product of catalogue) {
    const category = overlap(product.categoryIds, categories);
    if (category) {
      consider(product, "category", `Also in ${product.category}`);
      continue;
    }
    const stage = overlap(product.stages, stages);
    if (stage) {
      consider(product, "stage", `Used at the ${stage} stage`);
      continue;
    }
    const room = overlap(product.rooms, rooms);
    if (room) consider(product, "room", `Suited to the ${room}`);
  }

  return [...picked.values()]
    .sort((a, b) => {
      if (SOURCE_RANK[a.source] !== SOURCE_RANK[b.source]) return SOURCE_RANK[a.source] - SOURCE_RANK[b.source];
      if (buyable(a.product) !== buyable(b.product)) return buyable(a.product) ? -1 : 1;
      return a.product.name.localeCompare(b.product.name);
    })
    .slice(0, limit);
}
