import { _ as VINEXT_PARAMS_HEADER, c as createRscRequestUrl, d as toBrowserNavigationHref, f as toSameOriginAppPath, g as VINEXT_MOUNTED_SLOTS_HEADER, h as require_react, l as notifyAppRouterTransitionStart, m as AppElementsWire, n as require_jsx_runtime, o as ReadonlyURLSearchParams, p as assertSafeNavigationUrl, s as createRscRequestHeaders, u as isHashOnlyBrowserUrlChange, v as stripBasePath, y as __toESM } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/site-chrome-BPyzLR7b.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var _SERVER_INSERTED_HTML_CTX_KEY = Symbol.for("vinext.serverInsertedHTMLContext");
function getServerInsertedHTMLContext() {
	if (typeof import_react.createContext !== "function") return null;
	const globalState = globalThis;
	if (!globalState[_SERVER_INSERTED_HTML_CTX_KEY]) globalState[_SERVER_INSERTED_HTML_CTX_KEY] = import_react.createContext(null);
	return globalState[_SERVER_INSERTED_HTML_CTX_KEY] ?? null;
}
getServerInsertedHTMLContext();
var isServer = typeof window === "undefined";
function getCurrentInterceptionContext() {
	if (isServer) return null;
	return stripBasePath(window.location.pathname, "");
}
/** Get or create the shared in-memory RSC prefetch cache on window. */
function getPrefetchCache() {
	if (isServer) return /* @__PURE__ */ new Map();
	if (!window.__VINEXT_RSC_PREFETCH_CACHE__) window.__VINEXT_RSC_PREFETCH_CACHE__ = /* @__PURE__ */ new Map();
	return window.__VINEXT_RSC_PREFETCH_CACHE__;
}
/**
* Get or create the shared set of already-prefetched RSC URLs on window.
* Keyed by interception-aware cache key so distinct source routes do not alias.
*/
function getPrefetchedUrls() {
	if (isServer) return /* @__PURE__ */ new Set();
	if (!window.__VINEXT_RSC_PREFETCHED_URLS__) window.__VINEXT_RSC_PREFETCHED_URLS__ = /* @__PURE__ */ new Set();
	return window.__VINEXT_RSC_PREFETCHED_URLS__;
}
/**
* Evict prefetch cache entries if at capacity.
* First sweeps expired entries, then falls back to FIFO eviction.
*/
function evictPrefetchCacheIfNeeded() {
	const cache = getPrefetchCache();
	if (cache.size < 50) return;
	const now = Date.now();
	const prefetched = getPrefetchedUrls();
	for (const [key, entry] of cache) if (now - entry.timestamp >= 3e4) {
		cache.delete(key);
		prefetched.delete(key);
	}
	while (cache.size >= 50) {
		const oldest = cache.keys().next().value;
		if (oldest !== void 0) {
			cache.delete(oldest);
			prefetched.delete(oldest);
		} else break;
	}
}
/**
* Snapshot an RSC response to an ArrayBuffer for caching and replay.
* Consumes the response body and stores it with content-type and URL metadata.
*/
async function snapshotRscResponse(response) {
	return {
		buffer: await response.arrayBuffer(),
		contentType: response.headers.get("content-type") ?? "text/x-component",
		mountedSlotsHeader: response.headers.get(VINEXT_MOUNTED_SLOTS_HEADER),
		paramsHeader: response.headers.get(VINEXT_PARAMS_HEADER),
		url: response.url
	};
}
/**
* Prefetch an RSC response and snapshot it for later consumption.
* Stores the in-flight promise so immediate clicks can await it instead
* of firing a duplicate fetch.
* Enforces a maximum cache size to prevent unbounded memory growth on
* link-heavy pages.
*/
function prefetchRscResponse(rscUrl, fetchPromise, interceptionContext = null, mountedSlotsHeader = null) {
	const cacheKey = AppElementsWire.encodeCacheKey(rscUrl, interceptionContext);
	const cache = getPrefetchCache();
	const prefetched = getPrefetchedUrls();
	const entry = {
		outcome: "pending",
		timestamp: Date.now()
	};
	entry.pending = fetchPromise.then(async (response) => {
		if (response.ok) entry.snapshot = {
			...await snapshotRscResponse(response),
			mountedSlotsHeader
		};
		else {
			prefetched.delete(cacheKey);
			cache.delete(cacheKey);
		}
	}).catch(() => {
		prefetched.delete(cacheKey);
		cache.delete(cacheKey);
	}).finally(() => {
		entry.pending = void 0;
		if (entry.snapshot) entry.outcome = "cache-seeded";
	});
	cache.set(cacheKey, entry);
	evictPrefetchCacheIfNeeded();
}
var _CLIENT_NAV_STATE_KEY = Symbol.for("vinext.clientNavigationState");
var _MOUNTED_SLOTS_HEADER_KEY = Symbol.for("vinext.mountedSlotsHeader");
function getMountedSlotsHeader() {
	if (isServer) return null;
	return window[_MOUNTED_SLOTS_HEADER_KEY] ?? null;
}
function getClientNavigationState() {
	if (isServer) return null;
	const globalState = window;
	globalState[_CLIENT_NAV_STATE_KEY] ??= {
		listeners: /* @__PURE__ */ new Set(),
		cachedSearch: window.location.search,
		cachedReadonlySearchParams: new ReadonlyURLSearchParams(window.location.search),
		cachedPathname: stripBasePath(window.location.pathname, ""),
		clientParams: {},
		clientParamsJson: "{}",
		pendingClientParams: null,
		pendingClientParamsJson: null,
		pendingPathname: null,
		pendingPathnameNavId: null,
		originalPushState: window.history.pushState.bind(window.history),
		originalReplaceState: window.history.replaceState.bind(window.history),
		patchInstalled: false,
		hasPendingNavigationUpdate: false,
		suppressUrlNotifyCount: 0,
		navigationSnapshotActiveCount: 0
	};
	return globalState[_CLIENT_NAV_STATE_KEY];
}
function notifyNavigationListeners() {
	const state = getClientNavigationState();
	if (!state) return;
	for (const fn of state.listeners) fn();
}
function syncCommittedUrlStateFromLocation() {
	const state = getClientNavigationState();
	if (!state) return false;
	let changed = false;
	const pathname = stripBasePath(window.location.pathname, "");
	if (pathname !== state.cachedPathname) {
		state.cachedPathname = pathname;
		changed = true;
	}
	const search = window.location.search;
	if (search !== state.cachedSearch) {
		state.cachedSearch = search;
		state.cachedReadonlySearchParams = new ReadonlyURLSearchParams(search);
		changed = true;
	}
	return changed;
}
/**
* Check if a href is an external URL (any URL scheme per RFC 3986, or protocol-relative).
*/
function isExternalUrl(href) {
	return /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//");
}
/**
* Check if a href is only a hash change relative to the current URL.
*/
function isHashOnlyChange(href) {
	if (typeof window === "undefined") return false;
	if (href.startsWith("#")) return true;
	return isHashOnlyBrowserUrlChange(href, window.location.href, "");
}
/**
* Scroll to a hash target element, or to the top if no hash.
*/
function scrollToHash(hash) {
	if (!hash || hash === "#") {
		window.scrollTo(0, 0);
		return;
	}
	const id = hash.slice(1);
	const element = document.getElementById(id);
	if (element) element.scrollIntoView({ behavior: "auto" });
}
function withSuppressedUrlNotifications(fn) {
	const state = getClientNavigationState();
	if (!state) return fn();
	state.suppressUrlNotifyCount += 1;
	try {
		return fn();
	} finally {
		state.suppressUrlNotifyCount -= 1;
	}
}
/**
* Commit pending client navigation state to committed snapshots.
*
* navId is optional: callers that don't own pendingPathname (for example,
* superseded pre-paint cleanup) may pass undefined to flush URL/params state
* without clearing pendingPathname owned by the active navigation. Such callers
* must opt in explicitly if they also own an activated render snapshot.
*/
function commitClientNavigationState(navId, options) {
	if (isServer) return;
	const state = getClientNavigationState();
	if (!state) return;
	if ((navId !== void 0 || options?.releaseSnapshot === true) && state.navigationSnapshotActiveCount > 0) state.navigationSnapshotActiveCount -= 1;
	const urlChanged = syncCommittedUrlStateFromLocation();
	if (state.pendingClientParams !== null && state.pendingClientParamsJson !== null) {
		state.clientParams = state.pendingClientParams;
		state.clientParamsJson = state.pendingClientParamsJson;
		state.pendingClientParams = null;
		state.pendingClientParamsJson = null;
	}
	if (state.pendingPathnameNavId === null || navId !== void 0 && state.pendingPathnameNavId === navId) {
		state.pendingPathname = null;
		state.pendingPathnameNavId = null;
	}
	const shouldNotify = urlChanged || state.hasPendingNavigationUpdate;
	state.hasPendingNavigationUpdate = false;
	if (shouldNotify) notifyNavigationListeners();
}
function pushHistoryStateWithoutNotify(data, unused, url) {
	withSuppressedUrlNotifications(() => {
		getClientNavigationState()?.originalPushState.call(window.history, data, unused, url);
	});
}
function replaceHistoryStateWithoutNotify(data, unused, url) {
	withSuppressedUrlNotifications(() => {
		getClientNavigationState()?.originalReplaceState.call(window.history, data, unused, url);
	});
}
/**
* Save the current scroll position into the current history state.
* Called before every navigation to enable scroll restoration on back/forward.
*
* Uses replaceHistoryStateWithoutNotify to avoid triggering the patched
* history.replaceState interception (which would cause spurious re-renders).
*/
function saveScrollPosition() {
	replaceHistoryStateWithoutNotify({
		...window.history.state ?? {},
		__vinext_scrollX: window.scrollX,
		__vinext_scrollY: window.scrollY
	}, "");
}
/**
* Restore scroll position from a history state object (used on popstate).
*
* When an RSC navigation is in flight (back/forward triggers both this
* handler and the browser entry's popstate handler which calls
* __VINEXT_RSC_NAVIGATE__), we must wait for the new content to render
* before scrolling. Otherwise the user sees old content flash at the
* restored scroll position.
*
* This handler fires before the browser entry's popstate handler (because
* navigation.ts is loaded before hydration completes), so we defer via a
* microtask to give the browser entry handler a chance to set
* __VINEXT_RSC_PENDING__. Promise.resolve() schedules a microtask
* that runs after all synchronous event listeners have completed.
*/
function restoreScrollPosition(state) {
	if (state && typeof state === "object" && "__vinext_scrollY" in state) {
		const { __vinext_scrollX: x, __vinext_scrollY: y } = state;
		Promise.resolve().then(() => {
			const pending = window.__VINEXT_RSC_PENDING__ ?? null;
			if (pending) pending.then(() => {
				requestAnimationFrame(() => {
					window.scrollTo(x, y);
				});
			});
			else requestAnimationFrame(() => {
				window.scrollTo(x, y);
			});
		});
	}
}
/**
* Navigate to a URL, handling external URLs, hash-only changes, and RSC navigation.
*/
async function navigateClientSide(href, mode, scroll, programmaticTransition = false) {
	let normalizedHref = href;
	if (isExternalUrl(href)) {
		const localPath = toSameOriginAppPath(href, "");
		if (localPath == null) {
			if (mode === "replace") window.location.replace(href);
			else window.location.assign(href);
			return;
		}
		normalizedHref = localPath;
	}
	const fullHref = toBrowserNavigationHref(normalizedHref, window.location.href, "");
	notifyAppRouterTransitionStart(fullHref, mode);
	if (mode === "push") saveScrollPosition();
	if (isHashOnlyChange(fullHref)) {
		const hash = fullHref.includes("#") ? fullHref.slice(fullHref.indexOf("#")) : "";
		if (mode === "replace") replaceHistoryStateWithoutNotify(null, "", fullHref);
		else pushHistoryStateWithoutNotify(null, "", fullHref);
		commitClientNavigationState();
		if (scroll) scrollToHash(hash);
		return;
	}
	const hashIdx = fullHref.indexOf("#");
	const hash = hashIdx !== -1 ? fullHref.slice(hashIdx) : "";
	if (typeof window.__VINEXT_RSC_NAVIGATE__ === "function") await window.__VINEXT_RSC_NAVIGATE__(fullHref, 0, "navigate", mode, void 0, programmaticTransition);
	else {
		if (mode === "replace") replaceHistoryStateWithoutNotify(null, "", fullHref);
		else pushHistoryStateWithoutNotify(null, "", fullHref);
		commitClientNavigationState();
	}
	if (scroll) if (hash) scrollToHash(hash);
	else window.scrollTo(0, 0);
}
/**
* App Router public router instance. Mirrors Next.js's
* `publicAppRouterInstance` from
* `packages/next/src/client/components/app-router-instance.ts`.
*
* Exported so the App Router browser entry can install it on
* `window.next.router` for Next.js parity (see `client/window-next.ts`).
* Internal callers in this file continue to use `_appRouter` for brevity.
*/
var _appRouter = {
	bfcacheId: "0",
	push(href, options) {
		assertSafeNavigationUrl(href);
		if (isServer) return;
		import_react.startTransition(() => {
			navigateClientSide(href, "push", options?.scroll !== false, true);
		});
	},
	replace(href, options) {
		assertSafeNavigationUrl(href);
		if (isServer) return;
		import_react.startTransition(() => {
			navigateClientSide(href, "replace", options?.scroll !== false, true);
		});
	},
	back() {
		if (isServer) return;
		window.history.back();
	},
	forward() {
		if (isServer) return;
		window.history.forward();
	},
	refresh() {
		if (isServer) return;
		const clearCaches = window.__VINEXT_CLEAR_NAV_CACHES__;
		if (typeof clearCaches === "function") clearCaches();
		const rscNavigate = window.__VINEXT_RSC_NAVIGATE__;
		if (typeof rscNavigate === "function") {
			const navigate = () => {
				rscNavigate(window.location.href, 0, "refresh", void 0, void 0, true);
			};
			import_react.startTransition(navigate);
		}
	},
	prefetch(href) {
		assertSafeNavigationUrl(href);
		if (isServer) return;
		(async () => {
			let prefetchHref = href;
			if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//")) {
				const localPath = toSameOriginAppPath(href, "");
				if (localPath == null) return;
				prefetchHref = localPath;
			}
			const fullHref = toBrowserNavigationHref(prefetchHref, window.location.href, "");
			const interceptionContext = getCurrentInterceptionContext();
			const mountedSlotsHeader = getMountedSlotsHeader();
			const headers = createRscRequestHeaders({ interceptionContext });
			if (mountedSlotsHeader) headers.set(VINEXT_MOUNTED_SLOTS_HEADER, mountedSlotsHeader);
			const rscUrl = await createRscRequestUrl(fullHref, headers);
			const cacheKey = AppElementsWire.encodeCacheKey(rscUrl, interceptionContext);
			const prefetched = getPrefetchedUrls();
			if (prefetched.has(cacheKey)) return;
			prefetched.add(cacheKey);
			prefetchRscResponse(rscUrl, fetch(rscUrl, {
				headers,
				credentials: "include",
				priority: "low"
			}), interceptionContext, mountedSlotsHeader);
		})().catch((error) => {
			console.error("[vinext] RSC prefetch setup error:", error);
		});
	}
};
/**
* App Router's useRouter — returns push/replace/back/forward/refresh.
* Different from Pages Router's useRouter (next/router).
*
* Returns a stable singleton: the same object reference on every call,
* matching Next.js behavior so components using referential equality
* (e.g. useMemo / useEffect deps, React.memo) don't re-render unnecessarily.
*/
function useRouter() {
	return _appRouter;
}
if (!isServer) {
	const state = getClientNavigationState();
	if (state && !state.patchInstalled) {
		state.patchInstalled = true;
		window.addEventListener("popstate", (event) => {
			if (typeof window.__VINEXT_RSC_NAVIGATE__ !== "function") {
				commitClientNavigationState();
				restoreScrollPosition(event.state);
			}
		});
		window.history.pushState = function patchedPushState(data, unused, url) {
			state.originalPushState.call(window.history, data, unused, url);
			if (state.suppressUrlNotifyCount === 0) commitClientNavigationState();
		};
		window.history.replaceState = function patchedReplaceState(data, unused, url) {
			state.originalReplaceState.call(window.history, data, unused, url);
			if (state.suppressUrlNotifyCount === 0) commitClientNavigationState();
		};
	}
}
var import_jsx_runtime = require_jsx_runtime();
function Header({ categories, rooms, stages, inventoryHref, customerName }) {
	const [menuOpen, setMenuOpen] = (0, import_react.useState)(false);
	const [search, setSearch] = (0, import_react.useState)("");
	const router = useRouter();
	function submitSearch(event) {
		event.preventDefault();
		if (search.trim()) router.push(`/categories?q=${encodeURIComponent(search.trim())}`);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "site-header",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				className: "wordmark",
				href: "/",
				"aria-label": "Buildanta home",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: "/logo.png",
					alt: ""
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Buildanta" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "desktop-nav",
				"aria-label": "Primary",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "nav-group",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: "/by-stage",
							children: ["By Stage ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "v" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "nav-dropdown",
							children: stages.slice(0, 8).map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: `/by-stage?stage=${encodeURIComponent(name)}`,
								children: name
							}, name))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "nav-group",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: "/by-room",
							children: ["By Room ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "v" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "nav-dropdown",
							children: rooms.map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: `/by-room?room=${encodeURIComponent(name)}`,
								children: name
							}, name))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "nav-group",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: "/categories",
							children: ["Categories ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "v" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "nav-dropdown",
							children: categories.slice(0, 8).map((category) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: `/categories/${category.slug}`,
								children: category.name
							}, category.slug))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "nav-group nav-highlight",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/calculators",
							children: "Calculators"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "nav-group",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: "/more",
							children: ["More ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "v" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "nav-dropdown compact",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "/professionals",
									children: "Find Professionals"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "/bulk-quotes",
									children: "Get Bulk Quotes"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "/list-product",
									children: "List your Products"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: inventoryHref,
									children: "Inventory Management [new]"
								})
							]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "header-search",
				onSubmit: submitSearch,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "sr-only",
						htmlFor: "global-search",
						children: "Search products"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						id: "global-search",
						value: search,
						onChange: (event) => setSearch(event.target.value),
						placeholder: "Search products, brands, categories..."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						"aria-label": "Search",
						type: "submit",
						children: "Go"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "account-links",
				children: customerName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					className: "signup-button",
					href: "/account",
					children: "My Account"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "/login",
					children: "Customer Login"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					className: "signup-button",
					href: "/signup",
					children: "Sign Up"
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "menu-button",
				"aria-label": "Open menu",
				"aria-expanded": menuOpen,
				onClick: () => setMenuOpen(!menuOpen),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {})
				]
			}),
			menuOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mobile-drawer",
				onClick: (event) => {
					if (event.target.closest("a")) setMenuOpen(false);
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "mobile-search",
						onSubmit: submitSearch,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: search,
							onChange: (event) => setSearch(event.target.value),
							placeholder: "Search products..."
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { children: "Search" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/by-stage",
						children: "By Stage"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/by-room",
						children: "By Room"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/categories",
						children: "Categories"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/calculators",
						children: "Calculators"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/professionals",
						children: "Find Professionals"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/bulk-quotes",
						children: "Get Bulk Quotes"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/list-product",
						children: "List your Products"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: inventoryHref,
						children: "Inventory Management [new]"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: customerName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						className: "signup-button",
						href: "/account",
						children: "My Account"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/login",
						children: "Customer Login"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						className: "signup-button",
						href: "/signup",
						children: "Sign Up"
					})] }) })
				]
			})
		]
	});
}
function Footer({ categories, rooms, stages, inventoryHref }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
		className: "site-footer",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "footer-cta",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "PLANNING A BUILD OR RENOVATION?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Turn your material list into one clear quotation." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					className: "button orange",
					href: "/calculators",
					children: ["Calculate materials ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "->" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					className: "footer-cta-link",
					href: "/categories",
					children: "Browse the catalogue"
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "footer-main",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "footer-brand",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								className: "wordmark",
								href: "/",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: "/logo.png",
									alt: ""
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Buildanta" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Construction materials, professional discovery and quotation support in one connected platform." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "footer-live",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}), " Catalogue synchronized with Inventory"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Serving project enquiries with delivery confirmation by PIN code." })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FooterColumn, {
						title: "Shop materials",
						links: categories.slice(0, 6).map((item) => ({
							label: item.name,
							href: `/categories/${item.slug}`
						}))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FooterColumn, {
						title: "Plan your project",
						links: [
							{
								label: "Complete material planner",
								href: "/calculators/complete-construction-material"
							},
							...stages.slice(0, 2).map((name) => ({
								label: name,
								href: `/by-stage?stage=${encodeURIComponent(name)}`
							})),
							...rooms.slice(0, 2).map((name) => ({
								label: name,
								href: `/by-room?room=${encodeURIComponent(name)}`
							}))
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FooterColumn, {
						title: "Buildanta services",
						links: [
							{
								label: "Material Calculators",
								href: "/calculators"
							},
							{
								label: "Get Bulk Quotes",
								href: "/bulk-quotes"
							},
							{
								label: "Find Professionals",
								href: "/professionals"
							},
							{
								label: "Customer Account",
								href: "/account"
							}
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "footer-column footer-staff",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "footer-title",
								children: "For your team"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Manage published products, images, stock, calculators and enquiries in the separate operations workspace." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: inventoryHref,
								children: "Open Inventory Management [new]"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "footer-bottom",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "(c) 2026 Buildanta Private Limited. All rights reserved." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Product pricing and delivery are confirmed in the final quotation." })]
			})
		]
	});
}
function FooterColumn({ title, links }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "footer-column",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "footer-title",
			children: title
		}), links.map((link) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
			href: link.href,
			children: link.label
		}, link.label))]
	});
}
//#endregion
export { Footer, Header };
