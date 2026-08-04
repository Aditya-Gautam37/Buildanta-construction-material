import { h as require_react, n as require_jsx_runtime, y as __toESM } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/customer-auth-form-CK90bhRD.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function CustomerAuthForm({ mode }) {
	const [error, setError] = (0, import_react.useState)("");
	const [success, setSuccess] = (0, import_react.useState)("");
	const [submitting, setSubmitting] = (0, import_react.useState)(false);
	async function submit(event) {
		event.preventDefault();
		const formElement = event.currentTarget;
		setError("");
		setSuccess("");
		const form = new FormData(formElement);
		const password = String(form.get("password") ?? "");
		if (mode === "signup" && password !== String(form.get("confirmPassword") ?? "")) {
			setError("Passwords do not match.");
			return;
		}
		setSubmitting(true);
		const payload = Object.fromEntries(form.entries());
		delete payload.confirmPassword;
		try {
			const response = await fetch(`/api/customer-auth/${mode}`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(payload)
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error ?? "Authentication failed.");
			if (data.requiresConfirmation) {
				setSuccess("Account created. Open the confirmation link sent to your email, then sign in.");
				formElement.reset();
				return;
			}
			const requested = new URLSearchParams(window.location.search).get("redirect");
			const destination = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/account";
			window.location.assign(destination);
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Authentication failed.");
		} finally {
			setSubmitting(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "customer-auth-form",
		onSubmit: submit,
		children: [
			mode === "signup" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "field-grid",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["First name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "firstName",
					autoComplete: "given-name",
					required: true
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Last name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "lastName",
					autoComplete: "family-name",
					required: true
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Email address", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				name: "email",
				type: "email",
				autoComplete: "email",
				required: true
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Password", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				name: "password",
				type: "password",
				autoComplete: mode === "login" ? "current-password" : "new-password",
				minLength: 8,
				required: true
			})] }),
			mode === "signup" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Confirm password", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				name: "confirmPassword",
				type: "password",
				autoComplete: "new-password",
				minLength: 8,
				required: true
			})] }),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "form-error",
				role: "alert",
				children: error
			}),
			success && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "customer-auth-success",
				role: "status",
				children: success
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "button navy wide",
				type: "submit",
				disabled: submitting,
				children: [submitting ? "Please wait…" : mode === "login" ? "Sign in to Buildanta" : "Create customer account", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "→" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Your password is handled securely by Supabase and is never stored by Buildanta." })
		]
	});
}
//#endregion
export { CustomerAuthForm };
