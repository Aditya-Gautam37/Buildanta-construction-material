import { h as require_react, n as require_jsx_runtime, y as __toESM } from "./ssr.mjs";
import { n as categories } from "./data-Dc19jVpE.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/supplier-form-DhBj7q47.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function SupplierForm() {
	const [status, setStatus] = (0, import_react.useState)("idle");
	const [message, setMessage] = (0, import_react.useState)("");
	const submitting = (0, import_react.useRef)(false);
	async function submit(event) {
		event.preventDefault();
		if (submitting.current) return;
		submitting.current = true;
		setStatus("sending");
		const form = new FormData(event.currentTarget);
		const image = form.get("image");
		if (!(image instanceof File) || image.size > 5e6) {
			setMessage("Upload a PNG, JPG or WebP image smaller than 5 MB.");
			setStatus("error");
			submitting.current = false;
			return;
		}
		try {
			const response = await fetch("/api/suppliers", {
				method: "POST",
				body: form
			});
			const raw = await response.text();
			const data = (() => {
				try {
					return JSON.parse(raw);
				} catch {
					return { error: response.status === 413 ? "The image is too large. Choose a file smaller than 5 MB." : "The listing service returned an invalid response." };
				}
			})();
			if (!response.ok) throw new Error(data.error || "Unable to submit your listing.");
			setMessage(data.reference || "");
			setStatus("sent");
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Unable to submit your listing.");
			setStatus("error");
		} finally {
			submitting.current = false;
		}
	}
	if (status === "sent") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "form-success",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "✓" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Listing submitted" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				"Your reference is ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: message }),
				". Our catalogue team will review the product and contact you before publication."
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				className: "button navy",
				href: "/",
				children: "Back to home"
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "workflow-form",
		onSubmit: submit,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "field-grid",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Contact name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "contactName",
					required: true
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Business email", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "email",
					name: "email",
					required: true
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "field-grid",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Phone number", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "phone",
					required: true
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Company name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "company",
					required: true
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "field-grid",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Product name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "productName",
					required: true
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Brand", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "brand",
					required: true
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "field-grid",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Category", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					name: "category",
					children: categories.map((category) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: category.name }, category.slug))
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Unit / pack size", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "unit",
					placeholder: "e.g. 50 kg bag",
					required: true
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "field-grid",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Indicative price (₹)", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "price",
					type: "number",
					min: "0",
					step: "0.01",
					required: true
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Available stock", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "stock",
					type: "number",
					min: "0",
					required: true
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Product description", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				name: "description",
				rows: 4,
				required: true
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
				"Product image ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "file-input",
					name: "image",
					type: "file",
					accept: "image/png,image/jpeg,image/webp",
					required: true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "PNG, JPG or WebP, maximum 5 MB. Stored in durable object storage." })
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "consent",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					required: true
				}), " I confirm that the product information is accurate and I am authorised to submit it."]
			}),
			status === "error" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "form-error",
				role: "alert",
				children: message
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "button navy wide",
				disabled: status === "sending",
				children: [status === "sending" ? "Uploading…" : "Submit Product for Review", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "→" })]
			})
		]
	});
}
//#endregion
export { SupplierForm };
