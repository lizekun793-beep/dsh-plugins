import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
//#region src/index.ts
/** Browser-facing base path of Live2D model assets. */
const LIVE2D_PREFIX = "/pet/live2d";
/** MIME map for model assets (served by extension). */
const LIVE2D_MIME = {
	".json": "application/json",
	".moc3": "application/octet-stream",
	".png": "image/png",
	".js": "application/javascript"
};
/** Absolute package root, resolved from this module's own location (lib/). */
function packageRoot(importMetaUrl) {
	return fileURLToPath(new URL("../", importMetaUrl));
}
/** Stable cordis plugin name (matches cordis.patch.yml insert id). */
const name = "live2d-pet";
/** Services required before the plugin can mount its surfaces. */
const inject = ["webServer"];
/** Default model path relative to assets/live2d/. */
const DEFAULT_MODEL = "tororo/tororo.model3.json";
const DEFAULTS = {
	model: DEFAULT_MODEL,
	size: 220,
	right: 24,
	bottom: 100,
	offsetX: 0,
	offsetY: 0,
	gap: 10,
	enabled: false,
	fidgetSec: 7,
	phaseMotions: true
};
function dshHome() {
	return process.env.DSH_HOME || join(homedir(), ".dsh");
}
function userConfigPath() {
	return join(dshHome(), "dsh-live2d-pet", "config.json");
}
async function readUserOverrides() {
	try {
		const raw = await readFile(userConfigPath(), "utf8");
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === "object" ? parsed : {};
	} catch {
		return {};
	}
}
async function writeUserOverrides(overrides) {
	await mkdir(join(dshHome(), "dsh-live2d-pet"), { recursive: true });
	await writeFile(userConfigPath(), JSON.stringify(overrides, null, 2) + "\n", "utf8");
}
function mergeConfig(patch, user) {
	const merged = {
		model: user.model ?? patch.model ?? DEFAULTS.model,
		size: user.size ?? patch.size ?? DEFAULTS.size,
		right: user.right ?? patch.right ?? DEFAULTS.right,
		bottom: user.bottom ?? patch.bottom ?? DEFAULTS.bottom,
		offsetX: user.offsetX ?? patch.offsetX ?? DEFAULTS.offsetX,
		offsetY: user.offsetY ?? patch.offsetY ?? DEFAULTS.offsetY,
		gap: user.gap ?? patch.gap ?? DEFAULTS.gap,
		enabled: user.enabled ?? patch.enabled ?? DEFAULTS.enabled,
		fidgetSec: user.fidgetSec ?? patch.fidgetSec ?? DEFAULTS.fidgetSec,
		phaseMotions: user.phaseMotions ?? patch.phaseMotions ?? DEFAULTS.phaseMotions
	};
	const rel = merged.model.replace(/^\/pet\/live2d\//, "");
	return {
		...merged,
		model: rel,
		modelUrl: `${LIVE2D_PREFIX}/${rel}`
	};
}
function jsonBody(res, req, obj, status = 200) {
	const body = JSON.stringify(obj);
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"content-length": String(Buffer.byteLength(body)),
		"cache-control": "no-cache"
	});
	if (req.method === "HEAD") {
		res.end();
		return;
	}
	res.end(body);
}
async function readRequestJson(req) {
	const chunks = [];
	for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
	const raw = Buffer.concat(chunks).toString("utf8");
	if (!raw.trim()) return {};
	return JSON.parse(raw);
}
function apply(ctx, config = {}) {
	const patch = { ...config };
	const root = packageRoot(import.meta.url);
	ctx.effect(() => {
		const dispose = ctx.webServer.register({
			kind: "prefix",
			path: LIVE2D_PREFIX,
			handler: async (req, res) => {
				if (req.method !== "GET" && req.method !== "HEAD") {
					res.writeHead(405);
					res.end();
					return;
				}
				const url = new URL(req.url ?? "", "http://local");
				const rel = decodeURIComponent(url.pathname.slice(12));
				if (!rel || rel === "config" || rel === "user-config") {
					res.writeHead(404);
					res.end();
					return;
				}
				const filePath = join(root, "assets", "live2d", rel);
				const rootPath = join(root, "assets", "live2d");
				if (filePath !== rootPath && !filePath.startsWith(rootPath + "\\") && !filePath.startsWith(rootPath + "/")) {
					res.writeHead(403);
					res.end();
					return;
				}
				try {
					const body = await readFile(filePath);
					const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
					res.writeHead(200, {
						"content-type": LIVE2D_MIME[ext] ?? "application/octet-stream",
						"content-length": String(body.byteLength),
						"cache-control": "no-cache"
					});
					if (req.method === "HEAD") {
						res.end();
						return;
					}
					res.end(body);
				} catch {
					res.writeHead(404);
					res.end();
				}
			}
		});
		return () => {
			dispose();
		};
	}, "live2d-pet: asset routes");
	const cubismSrc = `${LIVE2D_PREFIX}/live2dcubismcore.min.js`;
	ctx.on("webserver/index-inject", (table) => {
		table.push({
			kind: "script-src",
			placement: "head",
			src: cubismSrc
		});
	});
	ctx.effect(() => {
		const dispose = ctx.webServer.tapIndex((html) => {
			if (html.includes(cubismSrc)) return html;
			const injected = `<script src="${cubismSrc}"><\/script>`;
			return html.replace(/<head[^>]*>/, (m) => m + injected);
		});
		return () => {
			dispose();
		};
	}, "live2d-pet: core injection");
	ctx.effect(() => {
		const dispose = ctx.webServer.register({
			kind: "exact",
			path: "/pet/live2d/config",
			handler: async (req, res) => {
				if (req.method !== "GET" && req.method !== "HEAD") {
					res.writeHead(405);
					res.end();
					return;
				}
				try {
					const user = await readUserOverrides();
					const merged = mergeConfig(patch, user);
					jsonBody(res, req, {
						model: merged.modelUrl,
						modelRel: merged.model,
						size: merged.size,
						right: merged.right,
						bottom: merged.bottom,
						offsetX: merged.offsetX,
						offsetY: merged.offsetY,
						gap: merged.gap,
						enabled: merged.enabled,
						fidgetSec: merged.fidgetSec,
						phaseMotions: merged.phaseMotions
					});
				} catch (error) {
					jsonBody(res, req, { error: String(error) }, 500);
				}
			}
		});
		return () => {
			dispose();
		};
	}, "live2d-pet: config route");
	ctx.effect(() => {
		const dispose = ctx.webServer.register({
			kind: "exact",
			path: "/pet/live2d/user-config",
			handler: async (req, res) => {
				try {
					if (req.method === "GET" || req.method === "HEAD") {
						const user = await readUserOverrides();
						const merged = mergeConfig(patch, user);
						jsonBody(res, req, {
							overrides: user,
							merged: {
								model: merged.model,
								modelUrl: merged.modelUrl,
								size: merged.size,
								right: merged.right,
								bottom: merged.bottom,
								offsetX: merged.offsetX,
								offsetY: merged.offsetY,
								gap: merged.gap,
								enabled: merged.enabled,
								fidgetSec: merged.fidgetSec,
								phaseMotions: merged.phaseMotions
							},
							path: userConfigPath()
						});
						return;
					}
					if (req.method === "PUT" || req.method === "POST") {
						const body = await readRequestJson(req);
						const next = { ...await readUserOverrides() };
						for (const k of [
							"model",
							"size",
							"right",
							"bottom",
							"offsetX",
							"offsetY",
							"gap",
							"enabled",
							"fidgetSec",
							"phaseMotions"
						]) if (body[k] !== void 0) next[k] = body[k];
						if (typeof next.model === "string") next.model = next.model.replace(/^\/pet\/live2d\//, "").replace(/^assets\/live2d\//, "");
						if (typeof next.size === "number") next.size = Math.max(80, Math.min(640, Math.round(next.size)));
						if (typeof next.fidgetSec === "number") next.fidgetSec = Math.max(2, Math.min(60, next.fidgetSec));
						await writeUserOverrides(next);
						const merged = mergeConfig(patch, next);
						jsonBody(res, req, {
							ok: true,
							overrides: next,
							merged: {
								model: merged.model,
								modelUrl: merged.modelUrl,
								size: merged.size,
								right: merged.right,
								bottom: merged.bottom,
								offsetX: merged.offsetX,
								offsetY: merged.offsetY,
								gap: merged.gap,
								enabled: merged.enabled,
								fidgetSec: merged.fidgetSec,
								phaseMotions: merged.phaseMotions
							}
						});
						return;
					}
					res.writeHead(405);
					res.end();
				} catch (error) {
					jsonBody(res, req, { error: String(error) }, 500);
				}
			}
		});
		return () => {
			dispose();
		};
	}, "live2d-pet: user-config route");
}
//#endregion
export { DEFAULT_MODEL, LIVE2D_PREFIX, apply, inject, name, packageRoot };
