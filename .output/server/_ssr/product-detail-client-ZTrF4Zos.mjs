import { h as require_react, n as require_jsx_runtime, y as __toESM } from "./ssr.mjs";
import { n as availabilityStatusLabel } from "./live-catalog-CrgqeYAM.mjs";
import { ServiceabilityChecker } from "./serviceability-checker-CKsZWYM2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/product-detail-client-ZTrF4Zos.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function ProductDetailClient({ product }) {
	const [imageIndex, setImageIndex] = (0, import_react.useState)(0);
	const [variantId, setVariantId] = (0, import_react.useState)(product.variants[0]?.id || "");
	const variant = product.variants.find((item) => item.id === variantId) || product.variants[0];
	const images = product.images.length ? product.images : product.image ? [{
		src: product.image,
		alt: product.imageAlt
	}] : [];
	const price = variant?.price || product.price;
	const unit = variant?.unit || product.unit;
	const selectedAvailability = variant?.availability || product.availability;
	const availability = availabilityStatusLabel(selectedAvailability);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "product-detail",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "product-gallery",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `product-detail-visual ${images.length ? "has-image" : ""}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: product.brand }), images[imageIndex] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: images[imageIndex].src,
					alt: images[imageIndex].alt
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: product.category.split(" ")[0] })]
			}), images.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "product-thumbnails",
				"aria-label": "Product images",
				children: images.map((image, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: index === imageIndex ? "active" : "",
					onClick: () => setImageIndex(index),
					"aria-label": `View image ${index + 1}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: image.src,
						alt: ""
					})
				}, `${image.src}-${index}`))
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "product-detail-copy",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					product.brand,
					" · ",
					product.category
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: product.name }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "detail-description",
					children: product.description
				}),
				product.variants.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "variant-selector",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Choose variant" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						value: variantId,
						onChange: (event) => setVariantId(event.target.value),
						children: product.variants.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: item.id,
							children: [
								item.label,
								" · ",
								item.sku
							]
						}, item.id))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "price-box",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: price > 0 ? "Indicative demonstration price" : "Pricing" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: price > 0 ? `₹${price.toLocaleString("en-IN")}` : "Request latest price" }),
						price > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [" / ", unit] }),
						product.bulkPrice != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("em", { children: [
							"Indicative bulk price: ₹",
							product.bulkPrice.toLocaleString("en-IN"),
							" / ",
							product.unit
						] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: `availability ${selectedAvailability === "LOW_STOCK" || selectedAvailability === "OUT_OF_STOCK" ? "limited" : ""}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
						" ",
						availability
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServiceabilityChecker, { productId: product.id }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "product-facts",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "SKU" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: variant?.sku || product.sku })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Minimum order" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
							product.minimumOrderQuantity,
							" ",
							product.unit
						] })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "GST" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: product.gstPercent == null ? "Confirmed in quotation" : `${product.gstPercent}%` })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Fulfilment" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: "Confirmed with quotation" })] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "detail-description",
					children: [product.deliveryInfo || "Delivery confirmed after PIN-code review.", " GST and transportation are confirmed in the quotation."]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					className: "button orange wide",
					href: `/bulk-quotes?product=${encodeURIComponent(product.name)}`,
					children: ["Request latest price ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "→" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Final pricing depends on quantity, delivery location and verified fulfilment availability." })
			]
		})]
	});
}
//#endregion
export { ProductDetailClient };
