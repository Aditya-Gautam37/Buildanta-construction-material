import { n as require_jsx_runtime, t as require_react_dom, y as __toESM } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/submit-button-CTW5MkOX.js
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom(), 1);
var import_jsx_runtime = require_jsx_runtime();
function SubmitButton({ children, pendingText, className }) {
	const { pending } = (0, import_react_dom.useFormStatus)();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className,
		type: "submit",
		disabled: pending,
		children: pending ? pendingText : children
	});
}
//#endregion
export { SubmitButton };
