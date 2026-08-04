globalThis.__nitro_main__ = import.meta.url;
import { a as toEventHandler, c as serve, i as defineLazyEventHandler, n as HTTPError, r as defineHandler, s as NodeResponse, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { i as withoutTrailingSlash, n as joinURL, r as withLeadingSlash, t as decodePath } from "./_libs/ufo.mjs";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
//#region node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/favicon.svg": {
		"type": "image/svg+xml",
		"etag": "\"2ce-B2FAQ80R7eko6Eq5s+c42J4bEJA\"",
		"mtime": "2026-06-10T06:10:34.966Z",
		"size": 718,
		"path": "../public/favicon.svg"
	},
	"/file.svg": {
		"type": "image/svg+xml",
		"etag": "\"187-+zgO7/6H1QtZc4NmTAKYKWTQ0ow\"",
		"mtime": "2026-06-10T06:10:34.966Z",
		"size": 391,
		"path": "../public/file.svg"
	},
	"/globe.svg": {
		"type": "image/svg+xml",
		"etag": "\"40b-LrojsBpGczu4Qj5tOOv19+lavsU\"",
		"mtime": "2026-06-10T06:10:34.966Z",
		"size": 1035,
		"path": "../public/globe.svg"
	},
	"/kitchen.jpg": {
		"type": "image/jpeg",
		"etag": "\"7cf84-UaPhLxnL1rij+zhiWfCJm0eakxU\"",
		"mtime": "2026-07-30T17:56:30.761Z",
		"size": 511876,
		"path": "../public/kitchen.jpg"
	},
	"/logo.png": {
		"type": "image/png",
		"etag": "\"5df28-aEyChkWSscNJRdRUk9t+2Nyy+ik\"",
		"mtime": "2026-07-30T17:56:18.565Z",
		"size": 384808,
		"path": "../public/logo.png"
	},
	"/assets/calculator-wizard-CJZYNUYB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"776e-6Z5+VtH8tmdL9ZloTNbvZVxMfQ0\"",
		"mtime": "2026-08-04T18:15:31.661Z",
		"size": 30574,
		"path": "../public/assets/calculator-wizard-CJZYNUYB.js"
	},
	"/assets/brand-mark-DQ6EdNss.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2b6-5iBsoeTI/baisiUU6HM6ioinjBs\"",
		"mtime": "2026-08-04T18:15:31.659Z",
		"size": 694,
		"path": "../public/assets/brand-mark-DQ6EdNss.js"
	},
	"/window.svg": {
		"type": "image/svg+xml",
		"etag": "\"181-VMSODapsqjF/4bTEGQB/2T6Ujbk\"",
		"mtime": "2026-06-10T06:10:34.966Z",
		"size": 385,
		"path": "../public/window.svg"
	},
	"/assets/customer-auth-form-Blw7ZLfK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"98a-SsZbqZ2gDWZGSZ5ZUJaGspqYai0\"",
		"mtime": "2026-08-04T18:15:31.662Z",
		"size": 2442,
		"path": "../public/assets/customer-auth-form-Blw7ZLfK.js"
	},
	"/assets/calculator-wizard-qEe7OSl6.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"7d88-WRa+nleeyUly6y+Iky7DnswYNxw\"",
		"mtime": "2026-08-04T18:15:31.673Z",
		"size": 32136,
		"path": "../public/assets/calculator-wizard-qEe7OSl6.css"
	},
	"/assets/data-BMPN2-L6.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1be1-6devdgt57lINYheA3Fa75H+yT7U\"",
		"mtime": "2026-08-04T18:15:31.663Z",
		"size": 7137,
		"path": "../public/assets/data-BMPN2-L6.js"
	},
	"/assets/customer-logout-button-OJ7rTPfH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a8-jr8JrtAN/1fuiJJ9CCLfGZ+ylxA\"",
		"mtime": "2026-08-04T18:15:31.663Z",
		"size": 424,
		"path": "../public/assets/customer-logout-button-OJ7rTPfH.js"
	},
	"/assets/framework-B8WyT5R3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2e56d-yqm8KBIaXv+Y0pOthtGoU3MxBZg\"",
		"mtime": "2026-08-04T18:15:31.664Z",
		"size": 189805,
		"path": "../public/assets/framework-B8WyT5R3.js"
	},
	"/assets/index-BoIEDiV_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"126ec-2b+0gKMb2C9U1LXUbczJ6EYi2Qs\"",
		"mtime": "2026-08-04T18:15:31.658Z",
		"size": 75500,
		"path": "../public/assets/index-BoIEDiV_.js"
	},
	"/assets/hero-slider-BYRxrVSU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7ef-BhMWo4gbEhA+/2NuCS/fMdJTsmk\"",
		"mtime": "2026-08-04T18:15:31.665Z",
		"size": 2031,
		"path": "../public/assets/hero-slider-BYRxrVSU.js"
	},
	"/assets/layout-segment-context-CInC4er4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"120-DBNiMSa/gPUL2h/rnBjLbGX2RtY\"",
		"mtime": "2026-08-04T18:15:31.666Z",
		"size": 288,
		"path": "../public/assets/layout-segment-context-CInC4er4.js"
	},
	"/bedroom.jpg": {
		"type": "image/jpeg",
		"etag": "\"802b6-XYeep4AJckm8BSDZBTyguF/1KRg\"",
		"mtime": "2026-07-30T17:56:30.243Z",
		"size": 524982,
		"path": "../public/bedroom.jpg"
	},
	"/assets/index-DbPglWRw.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"3cbaf-c/FRAK3bK2mmnnZYeGD0dAqYjvo\"",
		"mtime": "2026-08-04T18:15:31.674Z",
		"size": 248751,
		"path": "../public/assets/index-DbPglWRw.css"
	},
	"/bathroom.jpg": {
		"type": "image/jpeg",
		"etag": "\"a1206-OE6KBJJPk9HDHNdO3tMYK5R2biU\"",
		"mtime": "2026-07-30T17:56:31.459Z",
		"size": 659974,
		"path": "../public/bathroom.jpg"
	},
	"/assets/live-catalog-ONkZtk3A.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16a2-QhIA5mF7C/+CVukHMzyEHvj7Or8\"",
		"mtime": "2026-08-04T18:15:31.667Z",
		"size": 5794,
		"path": "../public/assets/live-catalog-ONkZtk3A.js"
	},
	"/livingroom.jpg": {
		"type": "image/jpeg",
		"etag": "\"86826-Op3+SbgNYNaqbvr1QVfvKoGuonI\"",
		"mtime": "2026-07-30T17:56:29.689Z",
		"size": 550950,
		"path": "../public/livingroom.jpg"
	},
	"/homepage_img.png": {
		"type": "image/png",
		"etag": "\"1cdf42-tSsG5sy7cNsFjLaskzC3Tu/eKeE\"",
		"mtime": "2026-07-30T17:56:20.599Z",
		"size": 1892162,
		"path": "../public/homepage_img.png"
	},
	"/assets/page-DUuTqOnd.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4ff-m3tt+qQeTAJ8ZgQUeAG+3T/OHnY\"",
		"mtime": "2026-08-04T18:15:31.667Z",
		"size": 1279,
		"path": "../public/assets/page-DUuTqOnd.js"
	},
	"/assets/product-browser-yMToKiPX.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"260a-37zymCkDsz5meFGy2IyOfuUmVO8\"",
		"mtime": "2026-08-04T18:15:31.668Z",
		"size": 9738,
		"path": "../public/assets/product-browser-yMToKiPX.js"
	},
	"/assets/product-detail-client-CjL9NN3o.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"cfb-6k6+6mR6Wb9jAr8kd0HLwl41eVE\"",
		"mtime": "2026-08-04T18:15:31.668Z",
		"size": 3323,
		"path": "../public/assets/product-detail-client-CjL9NN3o.js"
	},
	"/assets/quote-form-b5oD5fwh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1f0e-tqSXslZElblUwCtYVoCEYIsPePs\"",
		"mtime": "2026-08-04T18:15:31.669Z",
		"size": 7950,
		"path": "../public/assets/quote-form-b5oD5fwh.js"
	},
	"/assets/readonly-url-search-params-pgk0LUNy.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"23d3-g44kc/P8B4Cnngu/+T0ni7ezeps\"",
		"mtime": "2026-08-04T18:15:31.670Z",
		"size": 9171,
		"path": "../public/assets/readonly-url-search-params-pgk0LUNy.js"
	},
	"/assets/rolldown-runtime-S-ySWqyJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2b6-wnqLLSlp3SaE+lbe74bKNe5Rpds\"",
		"mtime": "2026-08-04T18:15:31.671Z",
		"size": 694,
		"path": "../public/assets/rolldown-runtime-S-ySWqyJ.js"
	},
	"/assets/serviceability-checker-BKfNvNaD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8b6-TaPy3DTdERcVhiQbMVsS4apr5Vk\"",
		"mtime": "2026-08-04T18:15:31.671Z",
		"size": 2230,
		"path": "../public/assets/serviceability-checker-BKfNvNaD.js"
	},
	"/assets/site-chrome-C4JZXdBN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"31ca-fPkNpBVhlVg1gbijCbq3SbiJMuk\"",
		"mtime": "2026-08-04T18:15:31.672Z",
		"size": 12746,
		"path": "../public/assets/site-chrome-C4JZXdBN.js"
	},
	"/assets/submit-button-DNBjC2t9.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"105-XTCjdJk1m0mY8oyMZI5jhe6r+NM\"",
		"mtime": "2026-08-04T18:15:31.672Z",
		"size": 261,
		"path": "../public/assets/submit-button-DNBjC2t9.js"
	},
	"/assets/supplier-form-CUDhifyl.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e65-tBLn4ecgoyO9Jclj0an2h5pgjbM\"",
		"mtime": "2026-08-04T18:15:31.673Z",
		"size": 3685,
		"path": "../public/assets/supplier-form-CUDhifyl.js"
	},
	"/og.png": {
		"type": "image/png",
		"etag": "\"208c96-L3zbcwkE4bGJnuLKfG6mWpwMm6I\"",
		"mtime": "2026-07-30T17:12:25.415Z",
		"size": 2133142,
		"path": "../public/og.png"
	},
	"/professionals/meera-iyer.png": {
		"type": "image/png",
		"etag": "\"1f599e-mkxcCa6KPnJqUrAcg9uZiJWD9HY\"",
		"mtime": "2026-08-01T17:17:38.135Z",
		"size": 2054558,
		"path": "../public/professionals/meera-iyer.png"
	},
	"/professionals/naina-kapoor.png": {
		"type": "image/png",
		"etag": "\"1fdc43-G8DgI5poODAtMyKA3agizQKHw4A\"",
		"mtime": "2026-08-01T17:12:47.648Z",
		"size": 2088003,
		"path": "../public/professionals/naina-kapoor.png"
	},
	"/professionals/rohan-deshpande.png": {
		"type": "image/png",
		"etag": "\"1d17c4-p49k9MMY8nqL77K7nALQhto9N2A\"",
		"mtime": "2026-08-01T17:19:16.062Z",
		"size": 1906628,
		"path": "../public/professionals/rohan-deshpande.png"
	},
	"/professionals/arjun-mehta.png": {
		"type": "image/png",
		"etag": "\"1dbc88-cjsRjioDrlCt72q5IFPvX92QkMs\"",
		"mtime": "2026-08-01T17:11:26.408Z",
		"size": 1948808,
		"path": "../public/professionals/arjun-mehta.png"
	},
	"/assets/_vinext_fonts/sora-720974a1e66c/sora-1c52a9f3.woff2": {
		"type": "font/woff2",
		"etag": "\"3cc4-Ln6uMCIOx0v1zzRAyuvAiIJXhck\"",
		"mtime": "2026-07-30T18:15:11.756Z",
		"size": 15556,
		"path": "../public/assets/_vinext_fonts/sora-720974a1e66c/sora-1c52a9f3.woff2"
	},
	"/assets/_vinext_fonts/sora-720974a1e66c/sora-0036cf31.woff2": {
		"type": "font/woff2",
		"etag": "\"8388-uiZH24nHv5PJkUdYSCu7Tu0UJpk\"",
		"mtime": "2026-07-30T18:15:11.924Z",
		"size": 33672,
		"path": "../public/assets/_vinext_fonts/sora-720974a1e66c/sora-0036cf31.woff2"
	},
	"/demo/products/real/bath.jpg": {
		"type": "image/jpeg",
		"etag": "\"1bf57-KyFtdrOjiaBtKjrnSpMNcF5XMEo\"",
		"mtime": "2026-08-03T07:37:43.080Z",
		"size": 114519,
		"path": "../public/demo/products/real/bath.jpg"
	},
	"/demo/products/real/cement.jpg": {
		"type": "image/jpeg",
		"etag": "\"2eaed-sNA/cnLp8I4KxqIN2UscIBUlRaw\"",
		"mtime": "2026-08-03T07:37:55.598Z",
		"size": 191213,
		"path": "../public/demo/products/real/cement.jpg"
	},
	"/demo/products/real/ceiling.jpg": {
		"type": "image/jpeg",
		"etag": "\"39f2b-HuT0fiO9qJ6r66W1iBCLCiVPmKQ\"",
		"mtime": "2026-08-03T07:37:42.397Z",
		"size": 237355,
		"path": "../public/demo/products/real/ceiling.jpg"
	},
	"/demo/products/basin-faucet.png": {
		"type": "image/png",
		"etag": "\"18cc4f-felAIH3JZvuY/T49Jt/QKdBZuqg\"",
		"mtime": "2026-08-01T11:40:04.240Z",
		"size": 1625167,
		"path": "../public/demo/products/basin-faucet.png"
	},
	"/demo/hero/finish-selection.png": {
		"type": "image/png",
		"etag": "\"1cf026-3Gd/eu3z7OgL/fPhosERT/MuQ7U\"",
		"mtime": "2026-08-01T11:35:01.486Z",
		"size": 1896486,
		"path": "../public/demo/hero/finish-selection.png"
	},
	"/demo/hero/project-planning.png": {
		"type": "image/png",
		"etag": "\"1b478d-AT7xMy5FXjcoY0KTaPUrvxJy+dg\"",
		"mtime": "2026-08-01T11:34:15.356Z",
		"size": 1787789,
		"path": "../public/demo/hero/project-planning.png"
	},
	"/demo/products/real/electrical.jpg": {
		"type": "image/jpeg",
		"etag": "\"25896-QXMAtlsDjFrxBMZME9Bz1M4RWJA\"",
		"mtime": "2026-08-03T07:37:54.661Z",
		"size": 153750,
		"path": "../public/demo/products/real/electrical.jpg"
	},
	"/professionals/vikram-suri.png": {
		"type": "image/png",
		"etag": "\"2075ca-T8UJl10bgWSJXR6dUnJpoYpvM+s\"",
		"mtime": "2026-08-01T17:14:15.510Z",
		"size": 2127306,
		"path": "../public/professionals/vikram-suri.png"
	},
	"/whyus.png": {
		"type": "image/png",
		"etag": "\"409c2c-8sFxfliCGGVCi1gbA6vvjhoOwPM\"",
		"mtime": "2026-07-30T17:56:29.073Z",
		"size": 4234284,
		"path": "../public/whyus.png"
	},
	"/demo/hero/build-journey.png": {
		"type": "image/png",
		"etag": "\"2274a5-19OfREEiYL4w8ZZe/u5OIsTIap8\"",
		"mtime": "2026-08-01T11:31:16.241Z",
		"size": 2258085,
		"path": "../public/demo/hero/build-journey.png"
	},
	"/demo/products/copper-wire.png": {
		"type": "image/png",
		"etag": "\"18896f-AyRRDXjLVnAthmeL0aUGYWVB0So\"",
		"mtime": "2026-08-01T11:39:27.526Z",
		"size": 1608047,
		"path": "../public/demo/products/copper-wire.png"
	},
	"/demo/products/upvc-window.png": {
		"type": "image/png",
		"etag": "\"1644a8-um0ppMnEhzl8yA+CHhiTaWsu4mw\"",
		"mtime": "2026-08-03T06:01:52.304Z",
		"size": 1459368,
		"path": "../public/demo/products/upvc-window.png"
	},
	"/demo/products/cement.png": {
		"type": "image/png",
		"etag": "\"222c78-T2PIFDhlb7UkWXgx5CqDygMAjvY\"",
		"mtime": "2026-08-01T11:36:00.488Z",
		"size": 2239608,
		"path": "../public/demo/products/cement.png"
	},
	"/demo/products/waterproofing-coating.png": {
		"type": "image/png",
		"etag": "\"14f2ee-SHEggwhNx5Fe4xJ9jlp3Q/lGHOI\"",
		"mtime": "2026-08-03T06:00:40.943Z",
		"size": 1372910,
		"path": "../public/demo/products/waterproofing-coating.png"
	},
	"/demo/products/interior-emulsion.png": {
		"type": "image/png",
		"etag": "\"18e5c4-u9AN98qwAaqO/RB91E0xeOpKJ6A\"",
		"mtime": "2026-08-03T05:59:11.086Z",
		"size": 1631684,
		"path": "../public/demo/products/interior-emulsion.png"
	},
	"/demo/products/tmt-steel.png": {
		"type": "image/png",
		"etag": "\"19d439-whdPdoiCHiA5M6VkOkYMBaV8uiE\"",
		"mtime": "2026-08-01T11:37:03.439Z",
		"size": 1692729,
		"path": "../public/demo/products/tmt-steel.png"
	},
	"/demo/products/porcelain-tile.png": {
		"type": "image/png",
		"etag": "\"1b2322-Qz+ZlPw2UZHR20LqJl+fDypTZKs\"",
		"mtime": "2026-08-01T11:37:26.338Z",
		"size": 1778466,
		"path": "../public/demo/products/porcelain-tile.png"
	},
	"/forprofessionalsbanner.png": {
		"type": "image/png",
		"etag": "\"529ce5-ANY8OHIKZDvFkOIx7/CppK9crmE\"",
		"mtime": "2026-07-30T17:56:25.376Z",
		"size": 5414117,
		"path": "../public/forprofessionalsbanner.png"
	},
	"/demo/products/real/paint.jpg": {
		"type": "image/jpeg",
		"etag": "\"25a9a-u7VxfPRz5EWiAXWCtuAOlKpieAA\"",
		"mtime": "2026-08-03T07:37:53.750Z",
		"size": 154266,
		"path": "../public/demo/products/real/paint.jpg"
	},
	"/demo/products/real/openings.jpg": {
		"type": "image/jpeg",
		"etag": "\"1704a-MhUhh6LKCi90R9Qa89mHR1EsEfk\"",
		"mtime": "2026-08-03T07:37:56.044Z",
		"size": 94282,
		"path": "../public/demo/products/real/openings.jpg"
	},
	"/demo/products/real/tiles.jpg": {
		"type": "image/jpeg",
		"etag": "\"25836-AToBrT99zOrGab9pnXd2dfH4q2U\"",
		"mtime": "2026-08-03T07:38:06.867Z",
		"size": 153654,
		"path": "../public/demo/products/real/tiles.jpg"
	},
	"/demo/products/gypsum-board.png": {
		"type": "image/png",
		"etag": "\"2166db-nq8Nm5flUF4x8vcYdmWsEejf+OQ\"",
		"mtime": "2026-08-03T06:03:02.044Z",
		"size": 2189019,
		"path": "../public/demo/products/gypsum-board.png"
	},
	"/demo/products/real/steel.jpg": {
		"type": "image/jpeg",
		"etag": "\"d8230-e3WR4P6ofDOd9I6pTOPpdrHgluk\"",
		"mtime": "2026-08-03T07:37:53.174Z",
		"size": 885296,
		"path": "../public/demo/products/real/steel.jpg"
	},
	"/demo/products/real/waterproofing.jpg": {
		"type": "image/jpeg",
		"etag": "\"99d81-FMXccrivkbHHGk8i1JvglMzqc2w\"",
		"mtime": "2026-08-03T07:37:56.945Z",
		"size": 630145,
		"path": "../public/demo/products/real/waterproofing.jpg"
	}
};
//#endregion
//#region #nitro/virtual/public-assets-node
function readAsset(id) {
	const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
	return promises.readFile(resolve(serverDir, public_assets_data_default[id].path));
}
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
function getAsset(id) {
	return public_assets_data_default[id];
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/static.mjs
var METHODS = new Set(["HEAD", "GET"]);
var EncodingMap = {
	gzip: ".gz",
	br: ".br",
	zstd: ".zst"
};
var static_default = defineHandler((event) => {
	if (event.req.method && !METHODS.has(event.req.method)) return;
	let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
	let asset;
	const encodings = [...(event.req.headers.get("accept-encoding") || "").split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
	for (const encoding of encodings) for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
		const _asset = getAsset(_id);
		if (_asset) {
			asset = _asset;
			id = _id;
			break;
		}
	}
	if (!asset) {
		if (isPublicAssetURL(id)) {
			event.res.headers.delete("Cache-Control");
			throw new HTTPError({ status: 404 });
		}
		return;
	}
	if (encodings.length > 1) event.res.headers.append("Vary", "Accept-Encoding");
	if (event.req.headers.get("if-none-match") === asset.etag) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	const ifModifiedSinceH = event.req.headers.get("if-modified-since");
	const mtimeDate = new Date(asset.mtime);
	if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	if (asset.type) event.res.headers.set("Content-Type", asset.type);
	if (asset.etag && !event.res.headers.has("ETag")) event.res.headers.set("ETag", asset.etag);
	if (asset.mtime && !event.res.headers.has("Last-Modified")) event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
	if (asset.encoding && !event.res.headers.has("Content-Encoding")) event.res.headers.set("Content-Encoding", asset.encoding);
	if (asset.size > 0 && !event.res.headers.has("Content-Length")) event.res.headers.set("Content-Length", asset.size.toString());
	return readAsset(id);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		if (s.length > 1) {
			if (s[1] === "assets") r.unshift({
				data: $0,
				params: { "_": s.slice(2).join("/") }
			});
		}
		return r;
	};
})();
var _lazy_1gWKa7 = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_1gWKa7
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
var globalMiddleware = [toEventHandler(static_default)].filter(Boolean);
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new NodeResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~middleware"].push(...globalMiddleware);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		const routeRules = getRouteRules(method, pathname);
		event.context.routeRules = routeRules?.routeRules;
		if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		middleware.push(...h3App["~middleware"]);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/hooks.mjs
function _captureError(error, type) {
	console.error(`[${type}]`, error);
	useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
	process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
	process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
//#endregion
//#region #nitro/virtual/tracing
var tracingSrvxPlugins = [];
//#endregion
//#region node_modules/nitro/dist/presets/node/runtime/node-server.mjs
var _parsedPort = Number.parseInt(process.env.NITRO_PORT ?? process.env.PORT ?? "");
var port = Number.isNaN(_parsedPort) ? 3e3 : _parsedPort;
var host = process.env.NITRO_HOST || process.env.HOST;
var cert = process.env.NITRO_SSL_CERT;
var key = process.env.NITRO_SSL_KEY;
var nitroApp = useNitroApp();
serve({
	port,
	hostname: host,
	tls: cert && key ? {
		cert,
		key
	} : void 0,
	fetch: nitroApp.fetch,
	plugins: [...tracingSrvxPlugins]
});
trapUnhandledErrors();
var node_server_default = {};
//#endregion
export { node_server_default as default };
