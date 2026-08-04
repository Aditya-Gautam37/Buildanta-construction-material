import { h as require_react, y as __toESM } from "./ssr.mjs";
import { a as slugify, i as rooms, n as categories, o as stages, r as products, t as brands } from "./data-Dc19jVpE.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/live-catalog-CrgqeYAM.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var DEFAULT_API_URL = "https://buildanta-monorepo-nest-api.vercel.app";
function apiUrl(path) {
	return `${(process.env.INVENTORY_API_URL || DEFAULT_API_URL).replace(/\/$/, "")}/${path}`;
}
async function fetchCollection(path) {
	const response = await fetch(apiUrl(path), {
		cache: "no-store",
		headers: { accept: "application/json" }
	});
	if (!response.ok) throw new Error(`Inventory API ${path} returned ${response.status}.`);
	const payload = await response.json();
	if (!Array.isArray(payload)) throw new Error(`Inventory API ${path} returned an invalid collection.`);
	return payload;
}
function expandWithAncestors(names, nodes) {
	const nodesByName = new Map(nodes.map((node) => [node.name, node]));
	const nodesById = new Map(nodes.map((node) => [node.id, node]));
	const expanded = /* @__PURE__ */ new Set();
	for (const name of names) {
		let current = nodesByName.get(name);
		expanded.add(name);
		while (current?.parentId) {
			const parent = nodesById.get(current.parentId);
			if (!parent) break;
			expanded.add(parent.name);
			current = parent;
		}
	}
	return [...expanded];
}
function priceNumber(value) {
	const parsed = typeof value === "number" ? value : Number(value ?? 0);
	return Number.isFinite(parsed) ? parsed : 0;
}
function attributeUnit(attributes) {
	if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) return null;
	const record = attributes;
	for (const key of [
		"unit",
		"size",
		"packSize",
		"pack_size"
	]) {
		const value = record[key];
		if (typeof value === "string" && value.trim()) return value.trim();
	}
	return null;
}
function aggregateAvailability(statuses) {
	if (statuses.includes("IN_STOCK")) return "IN_STOCK";
	if (statuses.includes("LOW_STOCK")) return "LOW_STOCK";
	if (statuses.includes("OUT_OF_STOCK")) return "OUT_OF_STOCK";
	return "ENQUIRY";
}
function mapProducts(products, variants, categories, stages, rooms) {
	const variantsByProduct = /* @__PURE__ */ new Map();
	for (const variant of variants) {
		const current = variantsByProduct.get(variant.productId) || [];
		current.push(variant);
		variantsByProduct.set(variant.productId, current);
	}
	return products.map((product) => {
		const detailedVariants = variantsByProduct.get(product.id) || [];
		const firstDetailedVariant = detailedVariants[0];
		const firstSummaryVariant = product.variants?.[0];
		const rawCategories = (product.categories || []).map((item) => item.name);
		const categoryNames = expandWithAncestors(rawCategories, categories);
		const stageNames = expandWithAncestors(product.stage || [], stages);
		const roomNames = expandWithAncestors(product.room || [], rooms);
		const primaryCategory = rawCategories[0] || categoryNames[0] || "Construction Materials";
		const categoryNode = categories.find((item) => item.name === primaryCategory);
		const images = [...product.images || [], ...detailedVariants.flatMap((variant) => variant.images || [])].filter((image, index, all) => all.findIndex((candidate) => candidate.src === image.src) === index).sort((a, b) => Number(Boolean(b.primary)) - Number(Boolean(a.primary)) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
		const image = images[0];
		const price = priceNumber(firstDetailedVariant?.price ?? firstSummaryVariant?.price);
		const sku = firstDetailedVariant?.sku || firstSummaryVariant?.sku || "Made to order";
		const specs = (product.keySpecifications || []).filter(Boolean);
		const availability = product.availabilityStatus ?? aggregateAvailability([...detailedVariants.map((variant) => variant.availabilityStatus), ...(product.variants || []).map((variant) => variant.availabilityStatus)]);
		const gstPercent = product.gstPercent == null ? null : priceNumber(product.gstPercent);
		return {
			id: product.id,
			slug: slugify(product.name),
			name: product.name,
			brand: product.brand,
			categories: categoryNames,
			category: primaryCategory,
			categorySlug: categoryNode?.slug || slugify(primaryCategory),
			stages: stageNames,
			rooms: roomNames,
			unit: firstDetailedVariant?.unit || firstSummaryVariant?.unit || product.unit || attributeUnit(firstDetailedVariant?.attributes) || "unit",
			price: price || priceNumber(product.sellingPrice),
			bulkPrice: product.bulkPrice == null ? null : priceNumber(product.bulkPrice),
			description: product.description?.trim() || (specs.length > 0 ? specs.join(" / ") : `${product.name} by ${product.brand}, available for project pricing and fulfilment confirmation.`),
			specs: specs.length > 0 ? specs : [`SKU: ${sku}`, "Supply confirmed with quotation"],
			image: image?.src || null,
			imageAlt: image?.alt || product.name,
			images: images.length ? images.map((item) => ({
				src: item.src,
				alt: item.alt || product.name
			})) : [],
			variants: detailedVariants.map((variant) => {
				const record = variant.attributes && typeof variant.attributes === "object" && !Array.isArray(variant.attributes) ? variant.attributes : {};
				const attributes = Object.fromEntries(Object.entries(record).flatMap(([key, value]) => typeof value === "string" || typeof value === "number" ? [[key, String(value)]] : []));
				return {
					id: variant.id,
					sku: variant.sku,
					label: Object.values(attributes).join(" / ") || variant.sku,
					price: priceNumber(variant.price) || priceNumber(product.sellingPrice),
					unit: variant.unit || product.unit || "unit",
					availability: variant.availabilityStatus || "ENQUIRY",
					attributes
				};
			}),
			sku,
			availability,
			minimumOrderQuantity: product.minimumOrderQuantity ?? 1,
			gstPercent,
			deliveryInfo: product.deliveryInfo?.trim() || null,
			updatedAt: product.updatedAt
		};
	});
}
function fallbackSnapshot() {
	const node = (id, name, slug) => ({
		id,
		name,
		slug,
		parentId: null,
		description: null,
		imageUrl: null,
		icon: null,
		sortOrder: 0,
		featured: false,
		published: true,
		seoTitle: null,
		seoDescription: null,
		childCount: 0,
		productCount: 0
	});
	const fallbackImageByCategory = {
		"Cement & Structure": "/demo/products/real/cement.jpg",
		"Steel & TMT": "/demo/products/real/steel.jpg",
		Waterproofing: "/demo/products/real/waterproofing.jpg",
		Electrical: "/demo/products/real/electrical.jpg",
		"Sanitaryware & Bathware": "/demo/products/real/bath.jpg",
		"Doors & Windows": "/demo/products/real/openings.jpg",
		"False Ceiling & Drywall": "/demo/products/real/ceiling.jpg",
		"Tiles & Flooring": "/demo/products/real/tiles.jpg",
		Paints: "/demo/products/real/paint.jpg"
	};
	return {
		source: "fallback",
		categories: categories.map((item, index) => node(`fallback-category-${index}`, item.name, item.slug)),
		stages: stages.map(([, name], index) => node(`fallback-stage-${index}`, name, slugify(name))),
		rooms: rooms.map((item, index) => node(`fallback-room-${index}`, item.name, slugify(item.name))),
		brands: brands.map((name, index) => ({
			id: `fallback-brand-${index}`,
			name,
			slug: slugify(name),
			logo: null,
			description: null,
			website: null
		})),
		products: products.map((product, index) => ({
			id: `fallback-product-${index}`,
			slug: product.slug,
			name: product.name,
			brand: product.brand,
			categories: [product.category],
			category: product.category,
			categorySlug: product.categorySlug,
			stages: [product.stage],
			rooms: [...product.room],
			unit: product.unit,
			price: product.price,
			bulkPrice: null,
			description: product.description,
			specs: product.specs,
			image: fallbackImageByCategory[product.category] || null,
			imageAlt: product.name,
			images: fallbackImageByCategory[product.category] ? [{
				src: fallbackImageByCategory[product.category],
				alt: product.name
			}] : [],
			variants: [],
			sku: "Catalogue item",
			availability: "ENQUIRY",
			minimumOrderQuantity: 1,
			gstPercent: null,
			deliveryInfo: null,
			updatedAt: (/* @__PURE__ */ new Date(0)).toISOString()
		}))
	};
}
(0, import_react.cache)(async () => {
	try {
		const [products, categories, stages, rooms, brands, variants] = await Promise.all([
			fetchCollection("products"),
			fetchCollection("categories"),
			fetchCollection("stages"),
			fetchCollection("rooms"),
			fetchCollection("brands"),
			fetchCollection("product-variants")
		]);
		const normalize = (item) => ({
			id: item.id,
			name: item.name,
			slug: item.slug,
			parentId: item.parentId ?? null,
			description: item.description ?? null,
			imageUrl: item.imageUrl ?? null,
			icon: item.icon ?? null,
			sortOrder: item.sortOrder ?? 0,
			featured: item.featured ?? false,
			published: item.published ?? true,
			seoTitle: item.seoTitle ?? null,
			seoDescription: item.seoDescription ?? null,
			childCount: item._count?.children ?? 0,
			productCount: item._count?.products ?? 0
		});
		const normalizedCategories = categories.map(normalize).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
		const normalizedStages = stages.map(normalize);
		const normalizedRooms = rooms.map(normalize);
		return {
			source: "inventory",
			categories: normalizedCategories,
			stages: normalizedStages,
			rooms: normalizedRooms,
			brands: brands.map((item) => ({
				id: item.id,
				name: item.name,
				slug: item.slug,
				logo: item.logo || null,
				description: item.description || null,
				website: item.website || null
			})),
			products: mapProducts(products, variants, normalizedCategories, normalizedStages, normalizedRooms)
		};
	} catch (error) {
		console.error("Live inventory catalogue unavailable; using the storefront fallback.", error);
		return fallbackSnapshot();
	}
});
function availabilityLabel(product) {
	return availabilityStatusLabel(product.availability);
}
function availabilityStatusLabel(status) {
	if (status === "IN_STOCK") return "In stock";
	if (status === "LOW_STOCK") return "Limited stock";
	if (status === "OUT_OF_STOCK") return "Request availability";
	return "Available for enquiry";
}
//#endregion
export { availabilityStatusLabel as n, availabilityLabel as t };
