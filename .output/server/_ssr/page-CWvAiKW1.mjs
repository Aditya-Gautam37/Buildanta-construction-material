import { h as require_react, n as require_jsx_runtime, y as __toESM } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/page-CWvAiKW1.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function CustomerAuthConfirmationPage() {
	const [message, setMessage] = (0, import_react.useState)("Confirming your Buildanta account…");
	(0, import_react.useEffect)(() => {
		const values = new URLSearchParams(window.location.hash.replace(/^#/, ""));
		const accessToken = values.get("access_token");
		const refreshToken = values.get("refresh_token");
		const expiresIn = Number(values.get("expires_in") ?? 3600);
		const authError = values.get("error_description");
		if (authError) {
			window.setTimeout(() => setMessage(decodeURIComponent(authError)), 0);
			return;
		}
		if (!accessToken || !refreshToken) {
			window.setTimeout(() => setMessage("This confirmation link is invalid or has expired. Please create the account again."), 0);
			return;
		}
		fetch("/api/customer-auth/session", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				accessToken,
				refreshToken,
				expiresIn
			})
		}).then(async (response) => {
			const data = await response.json();
			if (!response.ok) throw new Error(data.error ?? "Unable to confirm the account.");
			window.history.replaceState(null, "", "/auth/confirm");
			window.location.replace("/account");
		}).catch((error) => setMessage(error instanceof Error ? error.message : "Unable to confirm the account."));
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "customer-confirm",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: "/logo.png",
				alt: ""
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: message }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "/login",
				children: "Return to customer login"
			})
		] })
	});
}
//#endregion
export { CustomerAuthConfirmationPage as default };
