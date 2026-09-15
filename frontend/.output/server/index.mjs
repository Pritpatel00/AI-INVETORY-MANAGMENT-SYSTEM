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
	"/globe.svg": {
		"type": "image/svg+xml",
		"etag": "\"40b-LrojsBpGczu4Qj5tOOv19+lavsU\"",
		"mtime": "2026-07-30T08:05:06.580Z",
		"size": 1035,
		"path": "../public/globe.svg"
	},
	"/manifest.webmanifest": {
		"type": "application/manifest+json",
		"etag": "\"1dd-6BapB2wQcqP97nKqKNvNdhxHDp8\"",
		"mtime": "2026-08-03T05:26:41.553Z",
		"size": 477,
		"path": "../public/manifest.webmanifest"
	},
	"/file.svg": {
		"type": "image/svg+xml",
		"etag": "\"187-+zgO7/6H1QtZc4NmTAKYKWTQ0ow\"",
		"mtime": "2026-07-30T08:05:06.571Z",
		"size": 391,
		"path": "../public/file.svg"
	},
	"/favicon.svg": {
		"type": "image/svg+xml",
		"etag": "\"525-LZvxAfi+372dVxQH2uSHF+gY6tw\"",
		"mtime": "2026-08-05T09:52:30.673Z",
		"size": 1317,
		"path": "../public/favicon.svg"
	},
	"/assets/framework-CXnKph_e.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2e56d-yqm8KBIaXv+Y0pOthtGoU3MxBZg\"",
		"mtime": "2026-09-15T06:42:40.200Z",
		"size": 189805,
		"path": "../public/assets/framework-CXnKph_e.js"
	},
	"/assets/index-C7Z-oE67.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13b63-1XQhPzsFup7LyBrVaWGFrwtDCJI\"",
		"mtime": "2026-09-15T06:42:40.200Z",
		"size": 80739,
		"path": "../public/assets/index-C7Z-oE67.js"
	},
	"/assets/InventoryApp-kVbesd01.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"62d00-P8C3zH3vfdMHXjuWK6oX9IzG9Dg\"",
		"mtime": "2026-09-15T06:42:40.200Z",
		"size": 404736,
		"path": "../public/assets/InventoryApp-kVbesd01.js"
	},
	"/assets/layout-segment-context-BzuO7hXE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"11b-Qc3rN3IBOPrih/0FHg6UNLX99ek\"",
		"mtime": "2026-09-15T06:42:40.201Z",
		"size": 283,
		"path": "../public/assets/layout-segment-context-BzuO7hXE.js"
	},
	"/assets/offline-queue-oNMdf8ve.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"d1-TKdjgEDdKoYKH+5VaUwUUy0NAMU\"",
		"mtime": "2026-09-15T06:42:40.201Z",
		"size": 209,
		"path": "../public/assets/offline-queue-oNMdf8ve.js"
	},
	"/assets/rolldown-runtime-S-ySWqyJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2b6-wnqLLSlp3SaE+lbe74bKNe5Rpds\"",
		"mtime": "2026-09-15T06:42:40.201Z",
		"size": 694,
		"path": "../public/assets/rolldown-runtime-S-ySWqyJ.js"
	},
	"/window.svg": {
		"type": "image/svg+xml",
		"etag": "\"181-VMSODapsqjF/4bTEGQB/2T6Ujbk\"",
		"mtime": "2026-07-30T08:05:06.587Z",
		"size": 385,
		"path": "../public/window.svg"
	},
	"/assets/index-DQj9YNdG.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"1b879-IIU9p0kDHEDiTvNhOhIwz3ieTqM\"",
		"mtime": "2026-09-15T06:42:40.201Z",
		"size": 112761,
		"path": "../public/assets/index-DQj9YNdG.css"
	},
	"/assets/_vinext_fonts/plus-jakarta-sans-58677bc4e688/plus-jakarta-sans-305d441d.woff2": {
		"type": "font/woff2",
		"etag": "\"54b8-5Z0Ta+EnIXV3mFb5QiUsGiBQKd4\"",
		"mtime": "2026-08-05T08:38:01.224Z",
		"size": 21688,
		"path": "../public/assets/_vinext_fonts/plus-jakarta-sans-58677bc4e688/plus-jakarta-sans-305d441d.woff2"
	},
	"/assets/_vinext_fonts/plus-jakarta-sans-58677bc4e688/plus-jakarta-sans-35af93a0.woff2": {
		"type": "font/woff2",
		"etag": "\"2064-XBxD4BZ8na3DznT01MAcODAQE/Y\"",
		"mtime": "2026-08-05T08:38:01.177Z",
		"size": 8292,
		"path": "../public/assets/_vinext_fonts/plus-jakarta-sans-58677bc4e688/plus-jakarta-sans-35af93a0.woff2"
	},
	"/assets/_vinext_fonts/plus-jakarta-sans-58677bc4e688/plus-jakarta-sans-be25729b.woff2": {
		"type": "font/woff2",
		"etag": "\"6a88-BpvjB8Hs9qtl1VBT5R9XSTsCBBI\"",
		"mtime": "2026-08-05T08:38:01.284Z",
		"size": 27272,
		"path": "../public/assets/_vinext_fonts/plus-jakarta-sans-58677bc4e688/plus-jakarta-sans-be25729b.woff2"
	},
	"/assets/_vinext_fonts/plus-jakarta-sans-58677bc4e688/plus-jakarta-sans-9b76284e.woff2": {
		"type": "font/woff2",
		"etag": "\"6b4-prTo9pBi9mPrTPpk7K1hLVQqLkw\"",
		"mtime": "2026-08-05T08:38:01.091Z",
		"size": 1716,
		"path": "../public/assets/_vinext_fonts/plus-jakarta-sans-58677bc4e688/plus-jakarta-sans-9b76284e.woff2"
	},
	"/assets/_vinext_fonts/geist-mono-00e989178794/geist-mono-0638449e.woff2": {
		"type": "font/woff2",
		"etag": "\"1704-VeWkiMaSmtKoigDBda2B4+oKOrE\"",
		"mtime": "2026-08-03T05:08:49.280Z",
		"size": 5892,
		"path": "../public/assets/_vinext_fonts/geist-mono-00e989178794/geist-mono-0638449e.woff2"
	},
	"/assets/_vinext_fonts/geist-mono-00e989178794/geist-mono-44745446.woff2": {
		"type": "font/woff2",
		"etag": "\"3978-+9VvX5IBHdHBGzk5bO8y1E2L46s\"",
		"mtime": "2026-08-03T05:08:49.355Z",
		"size": 14712,
		"path": "../public/assets/_vinext_fonts/geist-mono-00e989178794/geist-mono-44745446.woff2"
	},
	"/assets/_vinext_fonts/geist-mono-00e989178794/geist-mono-013b2f2f.woff2": {
		"type": "font/woff2",
		"etag": "\"5a44-DgS7bntUBX1kxCG5WcjCJ3SuYy0\"",
		"mtime": "2026-08-03T05:08:49.397Z",
		"size": 23108,
		"path": "../public/assets/_vinext_fonts/geist-mono-00e989178794/geist-mono-013b2f2f.woff2"
	},
	"/assets/_vinext_fonts/geist-mono-00e989178794/geist-mono-971fb274.woff2": {
		"type": "font/woff2",
		"etag": "\"1e30-eIHb5y9+U2VG5eoDV0u2U4xdJMo\"",
		"mtime": "2026-08-03T05:08:49.313Z",
		"size": 7728,
		"path": "../public/assets/_vinext_fonts/geist-mono-00e989178794/geist-mono-971fb274.woff2"
	},
	"/assets/_vinext_fonts/geist-mono-00e989178794/geist-mono-44e03052.woff2": {
		"type": "font/woff2",
		"etag": "\"3248-wkWJiMJZF/kPt2OAqgGiUX0aoSw\"",
		"mtime": "2026-08-03T05:08:49.242Z",
		"size": 12872,
		"path": "../public/assets/_vinext_fonts/geist-mono-00e989178794/geist-mono-44e03052.woff2"
	},
	"/assets/_vinext_fonts/geist-mono-00e989178794/geist-mono-f6b33328.woff2": {
		"type": "font/woff2",
		"etag": "\"183c-550Dvz8wbLX3LljaTkineljZ5Fk\"",
		"mtime": "2026-08-03T05:08:49.204Z",
		"size": 6204,
		"path": "../public/assets/_vinext_fonts/geist-mono-00e989178794/geist-mono-f6b33328.woff2"
	},
	"/assets/_vinext_fonts/geist-8ac0455e797f/geist-001175b1.woff2": {
		"type": "font/woff2",
		"etag": "\"409c-ZqM/aniucc0Q6czjG9PJh68UKX4\"",
		"mtime": "2026-08-03T05:08:48.984Z",
		"size": 16540,
		"path": "../public/assets/_vinext_fonts/geist-8ac0455e797f/geist-001175b1.woff2"
	},
	"/assets/_vinext_fonts/geist-8ac0455e797f/geist-52306abf.woff2": {
		"type": "font/woff2",
		"etag": "\"1f20-jOH14Gy7Ss+9XZqUfm6HYElQRZs\"",
		"mtime": "2026-08-03T05:08:48.945Z",
		"size": 7968,
		"path": "../public/assets/_vinext_fonts/geist-8ac0455e797f/geist-52306abf.woff2"
	},
	"/assets/_vinext_fonts/geist-8ac0455e797f/geist-875ccdd4.woff2": {
		"type": "font/woff2",
		"etag": "\"3a34-xxv0LuMM1z/7peE+5adFTKEmnEI\"",
		"mtime": "2026-08-03T05:08:48.901Z",
		"size": 14900,
		"path": "../public/assets/_vinext_fonts/geist-8ac0455e797f/geist-875ccdd4.woff2"
	},
	"/assets/_vinext_fonts/geist-8ac0455e797f/geist-ff2310f5.woff2": {
		"type": "font/woff2",
		"etag": "\"1c54-4FrYa9P9bp4DmAIwkwrt2ZMLmDk\"",
		"mtime": "2026-08-03T05:08:48.785Z",
		"size": 7252,
		"path": "../public/assets/_vinext_fonts/geist-8ac0455e797f/geist-ff2310f5.woff2"
	},
	"/assets/_vinext_fonts/geist-8ac0455e797f/geist-98bbbccb.woff2": {
		"type": "font/woff2",
		"etag": "\"7268-nYRtuExQEydDFnD+I7Go6h0qU0k\"",
		"mtime": "2026-08-03T05:08:49.061Z",
		"size": 29288,
		"path": "../public/assets/_vinext_fonts/geist-8ac0455e797f/geist-98bbbccb.woff2"
	},
	"/sw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"69d-f3YejAlewA5KsCje6EFF92gnKlw\"",
		"mtime": "2026-08-26T12:52:49.063Z",
		"size": 1693,
		"path": "../public/sw.js"
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
var _lazy_1NrMiV = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_1NrMiV
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
