import { h as require_react, n as require_jsx_runtime, y as __toESM } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/hero-slider-Dci043fV.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function HeroSlider({ slides }) {
	const [active, setActive] = (0, import_react.useState)(0);
	const [paused, setPaused] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (slides.length < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6e3);
		return () => window.clearInterval(timer);
	}, [paused, slides.length]);
	const move = (direction) => setActive((current) => (current + direction + slides.length) % slides.length);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "home-hero home-hero-slider",
		"aria-roledescription": "carousel",
		"aria-label": "Buildanta highlights",
		onMouseEnter: () => setPaused(true),
		onMouseLeave: () => setPaused(false),
		onFocusCapture: () => setPaused(true),
		onBlurCapture: () => setPaused(false),
		children: [slides.map((slide, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: `hero-slide ${index === active ? "active" : ""}`,
			"aria-hidden": index !== active,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: slide.imageUrl,
					alt: index === active ? slide.altText : ""
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "hero-shade" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "home-hero-copy",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "live-catalog-pill",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}), " Live catalogue powered by Buildanta Inventory"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: slide.title }),
						slide.subtitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: slide.subtitle }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [slide.ctaLabel && slide.ctaHref && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "button orange",
							href: slide.ctaHref,
							tabIndex: index === active ? 0 : -1,
							children: slide.ctaLabel
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "button navy",
							href: "/bulk-quotes",
							tabIndex: index === active ? 0 : -1,
							children: "Get project pricing"
						})] })
					]
				})
			]
		}, slide.id)), slides.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "hero-arrow previous",
				type: "button",
				onClick: () => move(-1),
				"aria-label": "Previous slide",
				children: "‹"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "hero-arrow next",
				type: "button",
				onClick: () => move(1),
				"aria-label": "Next slide",
				children: "›"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "hero-dots",
				"aria-label": "Choose a slide",
				children: slides.map((slide, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: index === active ? "active" : "",
					type: "button",
					onClick: () => setActive(index),
					"aria-label": `Show slide ${index + 1}: ${slide.title}`,
					"aria-current": index === active ? "true" : void 0
				}, slide.id))
			})
		] })]
	});
}
//#endregion
export { HeroSlider };
