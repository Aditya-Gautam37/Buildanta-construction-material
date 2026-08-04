import { h as require_react, n as require_jsx_runtime, y as __toESM } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/customer-logout-button-CJL-eDu8.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function CustomerLogoutButton() {
	const [working, setWorking] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: "button navy",
		type: "button",
		disabled: working,
		onClick: async () => {
			setWorking(true);
			await fetch("/api/customer-auth/logout", { method: "POST" });
			window.location.assign("/");
		},
		children: working ? "Signing out…" : "Sign out"
	});
}
//#endregion
export { CustomerLogoutButton };
