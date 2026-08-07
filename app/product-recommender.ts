import type { StoreProduct } from "./live-catalog";

export type FinderQuality = "ECONOMY" | "STANDARD" | "PREMIUM";
export type FinderAvailability = "ANY" | "AVAILABLE_NOW";

export type FinderAnswers = {
  quality: FinderQuality;
  preferredBrand: string;
  maxUnitPrice: number;
  quantity: number;
  availability: FinderAvailability;
};

export type ProductRecommendation = {
  product: StoreProduct;
  purchaseQuantity: number;
  indicativeTotal: number | null;
  reasons: string[];
};

export type ProductRecommendationResult = {
  recommendations: ProductRecommendation[];
  relaxed: boolean;
};

const qualityTarget: Record<FinderQuality, number> = { ECONOMY: 0, STANDARD: 0.5, PREMIUM: 1 };
const qualityReason: Record<FinderQuality, string> = {
  ECONOMY: "Value-focused price",
  STANDARD: "Balanced price and quality",
  PREMIUM: "Premium-range selection",
};

function availableNow(product: StoreProduct) {
  return product.availability === "IN_STOCK" || product.availability === "LOW_STOCK";
}

export function recommendProducts(products: StoreProduct[], answers: FinderAnswers, limit = 4): ProductRecommendationResult {
  if (!products.length) return { recommendations: [], relaxed: false };

  const strictMatches = products.filter((product) => {
    const brandMatches = answers.preferredBrand === "all" || product.brand === answers.preferredBrand;
    const budgetMatches = answers.maxUnitPrice <= 0 || (product.price > 0 && product.price <= answers.maxUnitPrice);
    const availabilityMatches = answers.availability === "ANY" || availableNow(product);
    return brandMatches && budgetMatches && availabilityMatches;
  });
  const relaxed = strictMatches.length === 0;
  const candidates = relaxed ? products : strictMatches;
  const priced = products.filter((product) => product.price > 0).sort((a, b) => a.price - b.price);
  const priceRank = new Map(priced.map((product, index) => [product.id, priced.length === 1 ? 0.5 : index / (priced.length - 1)]));
  const target = qualityTarget[answers.quality];

  const ranked = candidates.map((product) => {
    const rank = priceRank.get(product.id);
    let score = rank == null ? 0 : 50 * (1 - Math.abs(rank - target));
    if (answers.preferredBrand !== "all" && product.brand === answers.preferredBrand) score += 40;
    if (answers.maxUnitPrice > 0 && product.price > 0 && product.price <= answers.maxUnitPrice) score += 25;
    if (availableNow(product)) score += 15;
    score += Math.min(product.variants.length, 5);
    return { product, score };
  }).sort((a, b) => b.score - a.score || a.product.price - b.product.price || a.product.name.localeCompare(b.product.name));

  return {
    relaxed,
    recommendations: ranked.slice(0, limit).map(({ product }) => {
      const purchaseQuantity = Math.max(1, Math.ceil(answers.quantity || 1), product.minimumOrderQuantity || 1);
      const reasons = [qualityReason[answers.quality]];
      if (answers.preferredBrand !== "all" && product.brand === answers.preferredBrand) reasons.push("Preferred brand");
      if (answers.maxUnitPrice > 0 && product.price > 0 && product.price <= answers.maxUnitPrice) reasons.push("Within budget");
      if (availableNow(product)) reasons.push(product.availability === "IN_STOCK" ? "In stock" : "Limited stock");
      if (product.variants.length > 1) reasons.push(`${product.variants.length} variants`);
      return {
        product,
        purchaseQuantity,
        indicativeTotal: product.price > 0 ? product.price * purchaseQuantity : null,
        reasons,
      };
    }),
  };
}
