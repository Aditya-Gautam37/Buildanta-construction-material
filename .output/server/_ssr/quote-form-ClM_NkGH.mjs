import { h as require_react, n as require_jsx_runtime, y as __toESM } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/quote-form-ClM_NkGH.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function makeItem(products, requestedProduct = "") {
	const product = products.find((item) => item.name.toLowerCase() === requestedProduct.toLowerCase()) ?? products[0];
	const variant = product?.variants[0];
	return {
		key: crypto.randomUUID(),
		productId: product?.id ?? "",
		variantId: variant?.id ?? "",
		description: product?.name ?? requestedProduct,
		quantity: product?.minimumOrderQuantity ?? 1,
		unitCode: variant?.unit ?? product?.unit ?? "unit"
	};
}
function QuoteForm({ products, product = "" }) {
	const [status, setStatus] = (0, import_react.useState)("idle");
	const [message, setMessage] = (0, import_react.useState)("");
	const [reference, setReference] = (0, import_react.useState)("");
	const [items, setItems] = (0, import_react.useState)(() => [makeItem(products, product)]);
	const [contact, setContact] = (0, import_react.useState)(null);
	const [deliveryPincode, setDeliveryPincode] = (0, import_react.useState)("");
	const submitting = (0, import_react.useRef)(false);
	const productMap = (0, import_react.useMemo)(() => new Map(products.map((item) => [item.id, item])), [products]);
	(0, import_react.useEffect)(() => {
		const saved = window.localStorage.getItem("buildanta-delivery-pincode") || "";
		if (!/^\d{6}$/.test(saved)) return;
		const timer = window.setTimeout(() => setDeliveryPincode(saved), 0);
		return () => window.clearTimeout(timer);
	}, []);
	function updateItem(key, patch) {
		setItems((current) => current.map((item) => item.key === key ? {
			...item,
			...patch
		} : item));
	}
	function chooseProduct(key, productId) {
		const selected = productMap.get(productId);
		const variant = selected?.variants[0];
		updateItem(key, {
			productId,
			variantId: variant?.id ?? "",
			description: selected?.name ?? "",
			quantity: selected?.minimumOrderQuantity ?? 1,
			unitCode: variant?.unit ?? selected?.unit ?? "unit"
		});
	}
	function chooseVariant(key, productId, variantId) {
		const productEntry = productMap.get(productId);
		const variant = productEntry?.variants.find((item) => item.id === variantId);
		updateItem(key, {
			variantId,
			unitCode: variant?.unit ?? productEntry?.unit ?? "unit"
		});
	}
	function review(event) {
		event.preventDefault();
		if (!items.length || items.some((item) => !item.productId || !item.variantId || item.quantity <= 0)) {
			setStatus("error");
			setMessage("Choose a valid product, variant and quantity for every line.");
			return;
		}
		const form = new FormData(event.currentTarget);
		setContact({
			name: String(form.get("name") ?? "").trim(),
			email: String(form.get("email") ?? "").trim(),
			phone: String(form.get("phone") ?? "").trim(),
			company: String(form.get("company") ?? "").trim(),
			deliveryPincode: String(form.get("deliveryPincode") ?? "").trim(),
			requiredBy: String(form.get("requiredBy") ?? "").trim(),
			projectType: String(form.get("projectType") ?? "").trim(),
			customerNotes: String(form.get("customerNotes") ?? "").trim()
		});
		setStatus("review");
		setMessage("");
	}
	async function submit() {
		if (!contact || submitting.current) return;
		submitting.current = true;
		setStatus("sending");
		setMessage("");
		const payload = {
			name: contact.name,
			email: contact.email,
			phone: contact.phone,
			...contact.company ? { company: contact.company } : {},
			deliveryPincode: contact.deliveryPincode,
			...contact.requiredBy ? { requiredBy: contact.requiredBy } : {},
			...contact.projectType ? { projectType: contact.projectType } : {},
			...contact.customerNotes ? { customerNotes: contact.customerNotes } : {},
			items: items.map((item) => ({
				productId: item.productId,
				variantId: item.variantId,
				description: item.description,
				quantity: item.quantity,
				unitCode: item.unitCode
			}))
		};
		try {
			const response = await fetch("/api/quotes", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(payload)
			});
			const data = await response.json();
			const responseMessage = Array.isArray(data.message) ? data.message.join(" ") : data.message;
			if (!response.ok || !data.reference) throw new Error(data.error || responseMessage || "Unable to submit this quotation.");
			setReference(data.reference);
			setStatus("sent");
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Unable to submit this quotation.");
			setStatus("review");
		} finally {
			submitting.current = false;
		}
	}
	if (status === "sent") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "form-success",
		role: "status",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "OK" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Quotation request received" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				"Your reference is ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: reference }),
				". The complete multi-item request is now available to the Buildanta sales team for allocation and pricing."
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				className: "button navy",
				href: "/categories",
				children: "Continue browsing"
			})
		]
	});
	if (status === "review" || status === "sending") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "quote-review",
		"aria-live": "polite",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "form-kicker",
				children: "REVIEW BEFORE SUBMISSION"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", { children: [
				items.length,
				" material line",
				items.length === 1 ? "" : "s"
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "quote-review-lines",
				children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.description }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					item.quantity,
					" ",
					item.unitCode
				] })] }, item.key))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Contact" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
					contact?.name,
					" / ",
					contact?.email
				] })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Delivery PIN" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: contact?.deliveryPincode })] }),
				contact?.requiredBy && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Required by" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: contact.requiredBy })] })
			] }),
			message && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "form-error",
				role: "alert",
				children: message
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "quote-review-actions",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "button account-outline",
					onClick: () => setStatus("idle"),
					disabled: status === "sending",
					children: "Edit request"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "button navy",
					onClick: submit,
					disabled: status === "sending",
					children: [status === "sending" ? "Submitting..." : "Submit quotation", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "->" })]
				})]
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "workflow-form",
		onSubmit: review,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "field-grid",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Full name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "name",
					placeholder: "Your full name",
					required: true
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Work email", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "email",
					type: "email",
					placeholder: "you@company.com",
					required: true
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "field-grid",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Phone number", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "phone",
					inputMode: "tel",
					minLength: 7,
					placeholder: "+91 98765 43210",
					required: true
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Company / project", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "company",
					placeholder: "Company or project name"
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "quote-basket-heading",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "form-kicker",
					children: "MATERIAL BASKET"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Add every product required for this quotation" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setItems((current) => [...current, makeItem(products)]),
					children: "+ Add product"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "quote-basket",
				children: items.map((item, index) => {
					const selected = productMap.get(item.productId);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("legend", { children: ["Item ", index + 1] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "field-grid",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Product", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								value: item.productId,
								onChange: (event) => chooseProduct(item.key, event.target.value),
								required: true,
								children: products.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: entry.id,
									children: [
										entry.name,
										" / ",
										entry.brand
									]
								}, entry.id))
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Variant", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								value: item.variantId,
								onChange: (event) => chooseVariant(item.key, item.productId, event.target.value),
								required: true,
								children: selected?.variants.map((variant) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: variant.id,
									children: [
										variant.label,
										" / ",
										variant.sku
									]
								}, variant.id))
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "field-grid",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Quantity", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								min: "0.001",
								step: "0.001",
								value: item.quantity,
								onChange: (event) => updateItem(item.key, { quantity: Number(event.target.value) }),
								required: true
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Unit", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: item.unitCode,
								readOnly: true
							})] })]
						}),
						items.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "quote-remove",
							type: "button",
							onClick: () => setItems((current) => current.filter((entry) => entry.key !== item.key)),
							children: "Remove item"
						})
					] }, item.key);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "field-grid",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Delivery pincode", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "deliveryPincode",
					inputMode: "numeric",
					pattern: "[0-9]{6}",
					maxLength: 6,
					value: deliveryPincode,
					onChange: (event) => setDeliveryPincode(event.target.value.replace(/\D/g, "")),
					placeholder: "208001",
					required: true
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Required by", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "requiredBy",
					type: "date"
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "field-grid",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Project type", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					name: "projectType",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Residential construction" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Commercial project" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Renovation" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Dealer / reseller" })
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Project notes", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "customerNotes",
					placeholder: "Brands, schedule or specifications"
				})] })]
			}),
			status === "error" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "form-error",
				role: "alert",
				children: message
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "button navy wide",
				children: ["Review quotation summary", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "->" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Pricing, GST, freight and delivery are confirmed in the approved quotation revision." })
		]
	});
}
//#endregion
export { QuoteForm };
