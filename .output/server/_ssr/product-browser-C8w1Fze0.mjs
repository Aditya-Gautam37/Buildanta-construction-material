import { h as require_react, n as require_jsx_runtime, y as __toESM } from "./ssr.mjs";
import { n as availabilityStatusLabel, t as availabilityLabel } from "./live-catalog-CrgqeYAM.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/product-browser-C8w1Fze0.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var stageDescriptions = {
	"Foundation & Structure": "Cement, reinforcement steel and structural materials for the load-bearing core of the project.",
	"Walls & Masonry": "Blocks, bricks, mortar and related materials for internal and external wall construction.",
	"Bathroom & Plumbing": "Sanitaryware, faucets and wet-area products selected for bathroom installation.",
	"Electrical & Wiring": "Wires, switches and lighting products for concealed services and final electrical fit-out.",
	"Plastering & Waterproofing": "Protection systems and finishing materials for terraces, bathrooms and exposed walls.",
	"Flooring & Tiling": "Floor and wall finishes for living spaces, kitchens, bathrooms and outdoor areas.",
	"False Ceiling": "Boards, channels and finishing materials for suspended ceilings and lightweight partitions.",
	"Paint & Finishing": "Primers, interior coatings and exterior finishes for final surface preparation.",
	"Doors, Windows, Railings & Glass": "Door, window and hardware systems for secure, weather-ready openings."
};
function matches(product, mode, option) {
	if (mode === "stage") return product.stages.includes(option);
	if (mode === "room") return product.rooms.includes(option);
	return product.categories.includes(option);
}
function ProductBrowser({ mode, products, options, initial = "", query = "" }) {
	const [selection, setSelection] = (0, import_react.useState)(options.includes(initial) ? initial : options[0] || "");
	const [term, setTerm] = (0, import_react.useState)(query);
	const [sort, setSort] = (0, import_react.useState)("featured");
	const [filtersOpen, setFiltersOpen] = (0, import_react.useState)(false);
	const [brand, setBrand] = (0, import_react.useState)("all");
	const [availability, setAvailability] = (0, import_react.useState)("all");
	const [fulfilmentMode, setFulfilmentMode] = (0, import_react.useState)("all");
	const [maxPrice, setMaxPrice] = (0, import_react.useState)("");
	const [pincode, setPincode] = (0, import_react.useState)("");
	const [locationState, setLocationState] = (0, import_react.useState)("idle");
	const [locationProducts, setLocationProducts] = (0, import_react.useState)(/* @__PURE__ */ new Map());
	const brands = (0, import_react.useMemo)(() => [...new Set(products.map((product) => product.brand))].sort(), [products]);
	const checkLocation = (0, import_react.useCallback)(async (value) => {
		if (!/^\d{6}$/.test(value)) {
			setLocationState("error");
			return;
		}
		setLocationState("loading");
		try {
			const response = await fetch(`/api/serviceability?pincode=${encodeURIComponent(value)}`, { cache: "no-store" });
			const result = await response.json();
			if (!response.ok) throw new Error();
			window.localStorage.setItem("buildanta-delivery-pincode", value);
			if (!result.serviceable) {
				setLocationProducts(/* @__PURE__ */ new Map());
				setLocationState("unsupported");
				return;
			}
			setLocationProducts(new Map((result.products || []).map((product) => [product.productId, product])));
			setLocationState("serviceable");
		} catch {
			setLocationState("error");
		}
	}, []);
	(0, import_react.useEffect)(() => {
		const saved = window.localStorage.getItem("buildanta-delivery-pincode") || "";
		if (!/^\d{6}$/.test(saved)) return;
		const timer = window.setTimeout(() => {
			setPincode(saved);
			checkLocation(saved);
		}, 0);
		return () => window.clearTimeout(timer);
	}, [checkLocation]);
	const counts = (0, import_react.useMemo)(() => new Map(options.map((option) => [option, products.filter((product) => matches(product, mode, option)).length])), [
		mode,
		options,
		products
	]);
	const visible = (0, import_react.useMemo)(() => {
		const needle = term.trim().toLowerCase();
		return products.filter((product) => {
			const searched = !needle || `${product.name} ${product.brand} ${product.category} ${product.description}`.toLowerCase().includes(needle);
			const local = locationProducts.get(product.id);
			const locationMatch = locationState !== "serviceable" || Boolean(local);
			const availabilityMatch = availability === "all" || (local?.availabilityStatus || product.availability) === availability;
			const modeMatch = fulfilmentMode === "all" || local?.fulfilmentMode === fulfilmentMode;
			const brandMatch = brand === "all" || product.brand === brand;
			const priceLimit = Number(maxPrice);
			const priceMatch = !maxPrice || product.price <= priceLimit;
			return matches(product, mode, selection) && searched && locationMatch && availabilityMatch && modeMatch && brandMatch && priceMatch;
		}).sort((a, b) => sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : b.updatedAt.localeCompare(a.updatedAt));
	}, [
		mode,
		products,
		selection,
		term,
		sort,
		locationProducts,
		locationState,
		availability,
		fulfilmentMode,
		brand,
		maxPrice
	]);
	const selectionIndex = Math.max(0, options.indexOf(selection));
	const description = mode === "stage" ? stageDescriptions[selection] : mode === "room" ? `Materials currently mapped to ${selection} from the live Inventory catalogue.` : `Published products filed under ${selection}.`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "browser-layout",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "filter-trigger",
				onClick: () => setFiltersOpen(!filtersOpen),
				"aria-expanded": filtersOpen,
				children: ["Browse ", mode === "stage" ? "construction stages" : mode === "room" ? "rooms" : "categories"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: `browser-sidebar ${filtersOpen ? "open" : ""}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "sidebar-title",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "PROJECT NAVIGATOR" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: mode === "stage" ? "Construction stages" : mode === "room" ? "Rooms" : "Categories" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setFiltersOpen(false),
						"aria-label": "Close filters",
						children: "Close"
					})]
				}), options.map((option, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					className: selection === option ? "selected" : "",
					onClick: () => {
						setSelection(option);
						setTerm("");
						setFiltersOpen(false);
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "option-number",
							children: String(index + 1).padStart(2, "0")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "option-copy",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: option }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [counts.get(option) || 0, " published products"] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
							"aria-hidden": "true",
							children: ">"
						})
					]
				}, option))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "results-panel",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: `location-filter-bar ${locationState}`,
						onSubmit: (event) => {
							event.preventDefault();
							checkLocation(pincode);
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Delivery PIN code" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: locationState === "serviceable" ? "Showing products serviceable in your area." : locationState === "unsupported" ? "This area is not serviceable yet. Products remain available for manual enquiry." : locationState === "error" ? "Availability could not be confirmed. You can still request a quotation." : "Set your PIN code for location-aware products and delivery estimates." })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "sr-only",
								children: "Delivery PIN code"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								inputMode: "numeric",
								pattern: "[0-9]{6}",
								maxLength: 6,
								value: pincode,
								onChange: (event) => setPincode(event.target.value.replace(/\D/g, "")),
								placeholder: "6-digit PIN"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								disabled: locationState === "loading",
								children: locationState === "loading" ? "Checking..." : "Apply"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "stage-context",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "stage-context-number",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: mode === "stage" ? "BUILD STAGE" : "CATALOGUE VIEW" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: String(selectionIndex + 1).padStart(2, "0") })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: mode === "stage" ? "Materials for this phase" : mode === "room" ? "Products for this room" : "Product category" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: selection || "Construction materials" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: description })
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Inventory connected" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Real product photography" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Project quotes available" })
							] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "results-toolbar",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": "true",
							children: "Search"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: term,
							onChange: (event) => setTerm(event.target.value),
							placeholder: "Search products and brands..."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: sort,
							onChange: (event) => setSort(event.target.value),
							"aria-label": "Sort products",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "featured",
									children: "Recently updated"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "low",
									children: "Price: Low to High"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "high",
									children: "Price: High to Low"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "advanced-filters",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Brand", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: brand,
								onChange: (event) => setBrand(event.target.value),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "all",
									children: "All brands"
								}), brands.map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value,
									children: value
								}, value))]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Availability", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: availability,
								onChange: (event) => setAvailability(event.target.value),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "all",
										children: "All availability"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "IN_STOCK",
										children: "Available"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "LOW_STOCK",
										children: "Limited"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "ENQUIRY",
										children: "On enquiry"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "OUT_OF_STOCK",
										children: "Request availability"
									})
								]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Fulfilment", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: fulfilmentMode,
								onChange: (event) => setFulfilmentMode(event.target.value),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "all",
										children: "All fulfilment"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "STOCKED",
										children: "Buildanta stock"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "PARTNER_STOCK",
										children: "Partner stock"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "ON_REQUEST",
										children: "On request"
									})
								]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Maximum indicative price", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								min: "0",
								value: maxPrice,
								onChange: (event) => setMaxPrice(event.target.value),
								placeholder: "No limit"
							})] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "results-summary",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [visible.length, " products"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Pricing is indicative. Final price, GST and transport are confirmed in your quotation." })]
					}),
					visible.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "products-grid",
						children: visible.map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductCard, {
							product,
							location: locationProducts.get(product.id)
						}, product.id))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "empty-panel",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								"aria-hidden": "true",
								children: "0"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "No matching products" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: locationState === "serviceable" ? "Try another category or request manual availability confirmation." : "Clear the filters or choose another catalogue section." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									setTerm("");
									setBrand("all");
									setAvailability("all");
									setFulfilmentMode("all");
									setMaxPrice("");
								},
								children: "Clear filters"
							})
						]
					})
				]
			})
		]
	});
}
function ProductCard({ product, location }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "product-card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
			className: `product-visual ${product.image ? "has-image" : ""}`,
			href: `/products/${product.slug}`,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "product-brand",
					children: product.brand
				}),
				product.image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: product.image,
					alt: product.imageAlt,
					loading: "lazy"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: product.category.split(" ")[0] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: location ? availabilityStatusLabel(location.availabilityStatus) : availabilityLabel(product) })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "product-body",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					product.brand,
					" / ",
					product.unit
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: `/products/${product.slug}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: product.name })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "product-description",
					children: product.description
				}),
				location && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", {
					className: "location-product-note",
					children: [
						location.fulfilmentMode === "PARTNER_STOCK" ? "Available from partner" : location.fulfilmentMode === "ON_REQUEST" ? "Available on request" : "Buildanta stock",
						". ",
						location.leadTimeLabel,
						"."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: product.price > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["Indicative ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["₹", product.price.toLocaleString("en-IN")] })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Request latest price" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					className: "small-quote",
					href: `/bulk-quotes?product=${encodeURIComponent(product.name)}`,
					children: "Get quote"
				})] })
			]
		})]
	});
}
//#endregion
export { ProductBrowser, ProductCard };
