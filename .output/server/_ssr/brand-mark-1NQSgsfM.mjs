import { h as require_react, n as require_jsx_runtime, y as __toESM } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/brand-mark-1NQSgsfM.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function initials(name) {
	return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
}
function BrandMark({ name, logo }) {
	const [imageFailed, setImageFailed] = (0, import_react.useState)(false);
	const imageRef = (0, import_react.useRef)(null);
	const showImage = Boolean(logo) && !imageFailed;
	(0, import_react.useEffect)(() => {
		const image = imageRef.current;
		if (image?.complete && image.naturalWidth === 0) setImageFailed(true);
	}, [logo]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `brand-mark ${showImage ? "has-logo" : "fallback"}`,
		"aria-hidden": "true",
		children: showImage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			ref: imageRef,
			src: logo,
			alt: "",
			loading: "lazy",
			onError: () => setImageFailed(true)
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: initials(name) })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: name })] });
}
//#endregion
export { BrandMark };
