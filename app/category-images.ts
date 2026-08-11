const categoryImages: Record<string, string> = {
  "Cement & Structure": "/images/categories-v2/category-cement-structure.jpg",
  Paints: "/images/categories-v2/category-paints.jpg",
  "Plumbing & Sanitary": "/images/categories-v2/category-plumbing-sanitary.jpg",
  "Steel & TMT": "/images/categories-v2/category-steel-tmt.jpg",
  Waterproofing: "/images/categories-v2/category-waterproofing.jpg",
  Electrical: "/images/categories-v2/category-electrical.jpg",
  "Sanitaryware & Bathware": "/images/categories-v2/category-sanitaryware-bathware.jpg",
  "Doors & Windows": "/images/categories-v2/category-doors-windows.jpg",
  "False Ceiling & Drywall": "/images/categories-v2/category-false-ceiling-drywall.jpg",
  "Tiles & Flooring": "/images/categories-v2/category-tiles-flooring.jpg",
};

export function categoryImageFor(name: string) {
  return categoryImages[name] ?? null;
}
