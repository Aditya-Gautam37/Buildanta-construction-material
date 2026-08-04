import { h as require_react, n as require_jsx_runtime, y as __toESM } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/serviceability-checker-CKsZWYM2.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var labels = {
	IN_STOCK: "Available in your area",
	LOW_STOCK: "Limited availability",
	OUT_OF_STOCK: "Request availability",
	ENQUIRY: "Available on enquiry"
};
function ServiceabilityChecker({ productId }) {
	const [pincode, setPincode] = (0, import_react.useState)("");
	const [message, setMessage] = (0, import_react.useState)("Enter your delivery PIN code for location-specific availability.");
	const [state, setState] = (0, import_react.useState)("idle");
	const runCheck = (0, import_react.useCallback)(async (value) => {
		if (!/^\d{6}$/.test(value)) {
			setState("error");
			setMessage("Enter a valid six-digit PIN code.");
			return;
		}
		setState("loading");
		setMessage("Checking serviceability...");
		const params = new URLSearchParams({ pincode: value });
		if (productId) params.set("productId", productId);
		try {
			const response = await fetch(`/api/serviceability?${params}`, { cache: "no-store" });
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "Unable to check serviceability.");
			window.localStorage.setItem("buildanta-delivery-pincode", value);
			if (!result.serviceable) {
				setState("error");
				setMessage("Not serviceable at this PIN code yet. You can still request a quotation for manual confirmation.");
				return;
			}
			const product = productId ? result.products.find((item) => item.productId === productId) : void 0;
			setState("success");
			setMessage(product ? `${labels[product.availabilityStatus]}. ${product.leadTimeLabel}.` : "This PIN code is serviceable. Product availability is confirmed with your quotation.");
		} catch (error) {
			setState("error");
			setMessage(error instanceof Error ? error.message : "Serviceability is temporarily unavailable.");
		}
	}, [productId]);
	(0, import_react.useEffect)(() => {
		const saved = window.localStorage.getItem("buildanta-delivery-pincode") || "";
		if (!/^\d{6}$/.test(saved)) return;
		const timer = window.setTimeout(() => {
			setPincode(saved);
			runCheck(saved);
		}, 0);
		return () => window.clearTimeout(timer);
	}, [runCheck]);
	function check(event) {
		event.preventDefault();
		runCheck(pincode);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: `serviceability-checker ${state}`,
		"aria-live": "polite",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Check delivery availability" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: message })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: check,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "sr-only",
					htmlFor: `pincode-${productId || "catalogue"}`,
					children: "Delivery PIN code"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					id: `pincode-${productId || "catalogue"}`,
					inputMode: "numeric",
					pattern: "[0-9]{6}",
					maxLength: 6,
					value: pincode,
					onChange: (event) => setPincode(event.target.value.replace(/\D/g, "")),
					placeholder: "6-digit PIN code"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					disabled: state === "loading",
					children: state === "loading" ? "Checking..." : "Check"
				})
			]
		})]
	});
}
//#endregion
export { ServiceabilityChecker };
