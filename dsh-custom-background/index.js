/**
 * Host half of the custom-background bundle.
 *
 * Owns the server-side truth: a settings document plus a gallery of uploaded
 * images under the profile directory, so choices survive restarts and are
 * shared by every browser. Browser access goes through the authenticated
 * `/api` fetch fence that `ctx.connection` provides.
 */
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';

export const name = 'custom-background';
export const inject = ['connection', 'profileContext'];

const SETTINGS_PATH = '/api/custom-background.settings';
const IMAGE_PATH = '/api/custom-background.image';
const DEBUG_PATH = '/api/custom-background.debug';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGES = 40;
const MAX_URL_LENGTH = 2048;
const IMAGE_TYPES = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/webp': 'webp',
	'image/gif': 'gif'
};
const MODES = new Set(['local', 'url', 'none']);

const DEFAULTS = Object.freeze({ enabled: false, dim: 30, blur: 0, mode: 'none', url: '', selected: null, images: [] });

function notFound() {
	return new Response('not found', { status: 404, headers: { 'cache-control': 'no-store' } });
}

function badRequest(message) {
	return new Response(message, { status: 400, headers: { 'cache-control': 'no-store' } });
}

function conflict(message) {
	return new Response(message, { status: 409, headers: { 'cache-control': 'no-store' } });
}

function serverError() {
	return new Response('internal error', { status: 500, headers: { 'cache-control': 'no-store' } });
}

function json(value) {
	return Response.json(value, { headers: { 'cache-control': 'no-store' } });
}

function clampInt(value, min, max, fallback) {
	const number = Number(value);
	if (!Number.isFinite(number)) return fallback;
	return Math.min(max, Math.max(min, Math.round(number)));
}

function cleanUrl(value) {
	if (typeof value !== 'string') return '';
	const url = value.trim();
	if (url === '' || url.length > MAX_URL_LENGTH) return '';
	if (!/^https?:\/\/\S+$/i.test(url)) return '';
	return url;
}

function cleanImages(raw) {
	if (!Array.isArray(raw)) return [];
	const seen = new Set();
	const images = [];
	for (const entry of raw) {
		if (typeof entry !== 'object' || entry === null) continue;
		const id = typeof entry.id === 'string' ? entry.id.replace(/[^0-9a-zA-Z_-]/g, '').slice(0, 32) : '';
		if (id === '' || seen.has(id)) continue;
		const type = IMAGE_TYPES[entry.type] === undefined ? '' : entry.type;
		if (type === '') continue;
		seen.add(id);
		images.push({
			id,
			type,
			size: Math.max(0, Math.floor(Number(entry.size) || 0)),
			rev: typeof entry.rev === 'string' ? entry.rev.slice(0, 64) : id,
			addedAt: typeof entry.addedAt === 'string' ? entry.addedAt.slice(0, 40) : ''
		});
	}
	return images.slice(0, MAX_IMAGES);
}

/** Normalize one stored document; unknown shapes fall back to the defaults. */
function sanitize(raw) {
	if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ...DEFAULTS };
	const images = cleanImages(raw.images);
	const selected = typeof raw.selected === 'string' && images.some((image) => image.id === raw.selected) ? raw.selected : null;
	const mode = MODES.has(raw.mode) ? raw.mode : 'none';
	return {
		enabled: raw.enabled === true,
		dim: clampInt(raw.dim, 0, 80, DEFAULTS.dim),
		blur: clampInt(raw.blur, 0, 20, DEFAULTS.blur),
		mode: mode === 'url' ? (cleanUrl(raw.url) ? 'url' : 'none') : mode === 'local' && selected !== null ? 'local' : 'none',
		url: mode === 'url' ? cleanUrl(raw.url) : '',
		selected: selected,
		images
	};
}

function project(state) {
	return {
		enabled: state.enabled,
		dim: state.dim,
		blur: state.blur,
		mode: state.mode,
		url: state.url,
		selected: state.selected,
		hasImage: state.mode === 'local' && state.selected !== null,
		images: state.images
	};
}

export function apply(ctx) {
	const dir = String(ctx.profileContext?.dir ?? '');
	const settingsFile = dir === '' ? null : `${dir}/custom-background.json`;
	const legacyImageFile = dir === '' ? null : `${dir}/custom-background.image`;
	const imagesDir = dir === '' ? null : `${dir}/custom-background.images`;

	/** Single source of truth while the plugin is mounted. */
	let state = { ...DEFAULTS };
	let ready = false;
	/** Serialize disk mutations so concurrent writes cannot interleave. */
	let queue = Promise.resolve();

	function schedule(task) {
		const run = queue.then(task, task);
		queue = run.then(() => undefined, () => undefined);
		return run;
	}

	function imagePath(id) {
		return imagesDir === null ? null : `${imagesDir}/${id}.bin`;
	}

	async function ensureImagesDir() {
		if (imagesDir === null) throw new Error('custom-background: profile directory is unavailable');
		await mkdir(imagesDir, { recursive: true });
	}

	/** Fold one legacy single-image document into the gallery once. */
	async function adoptLegacy(next) {
		if (legacyImageFile === null) return next;
		const bytes = await readFile(legacyImageFile).catch(() => null);
		if (bytes === null) return next;
		const raw = JSON.parse(await readFile(settingsFile, 'utf8').catch(() => '{}'));
		const oldImage = raw && typeof raw.image === 'object' && raw.image !== null ? raw.image : null;
		if (oldImage === null) return next;
		const type = IMAGE_TYPES[oldImage.type] === undefined ? 'image/png' : oldImage.type;
		const id = createHash('sha256').update(bytes).digest('hex').slice(0, 16);
		await ensureImagesDir();
		const target = imagePath(id);
		await writeFile(target, bytes);
		const entry = { id, type, size: bytes.byteLength, rev: id, addedAt: new Date().toISOString() };
		await rm(legacyImageFile, { force: true });
		return {
			...next,
			images: [entry, ...next.images.filter((image) => image.id !== id)],
			selected: next.selected ?? id,
			mode: next.mode === 'none' ? 'local' : next.mode
		};
	}

	async function ensureLoaded() {
		if (ready) return;
		await ensureImagesDir().catch(() => undefined);
		let next = { ...DEFAULTS };
		try {
			next = sanitize(JSON.parse(await readFile(settingsFile, 'utf8')));
		} catch {
			next = { ...DEFAULTS };
		}
		// Drop gallery entries whose file disappeared while the host was down.
		if (imagesDir !== null && next.images.length > 0) {
			const present = new Set((await readdir(imagesDir).catch(() => [])).map((name) => name.replace(/\.bin$/, '')));
			const kept = next.images.filter((image) => present.has(image.id));
			if (kept.length !== next.images.length) {
				const selected = kept.some((image) => image.id === next.selected) ? next.selected : kept[0]?.id ?? null;
				next = {
					...next,
					images: kept,
					selected,
					mode: next.mode === 'local' && selected === null ? 'none' : next.mode
				};
			}
		}
		if (next.mode === 'local' && next.selected === null) next = { ...next, mode: 'none' };
		try {
			next = await adoptLegacy(next);
		} catch {
			// A malformed legacy document must not block the plugin.
		}
		state = next;
		ready = true;
		if (settingsFile !== null) {
			await mkdir(dir, { recursive: true });
			const tmp = `${settingsFile}.${randomUUID()}.tmp`;
			await writeFile(tmp, JSON.stringify(state, null, 2));
			await rename(tmp, settingsFile);
		}
	}

	function persist() {
		return schedule(async () => {
			if (settingsFile === null) throw new Error('custom-background: profile directory is unavailable');
			await mkdir(dir, { recursive: true });
			const tmp = `${settingsFile}.${randomUUID()}.tmp`;
			await writeFile(tmp, JSON.stringify(state, null, 2));
			await rename(tmp, settingsFile);
		});
	}

	ctx.effect(() => ctx.connection.fetch.register({
		path: SETTINGS_PATH,
		methods: ['GET', 'PUT'],
		requestBody: 'buffered',
		fetch: async (request) => {
			try {
				await ensureLoaded();
				if (request.method === 'GET') return json(project(state));
				const body = await request.json().catch(() => null);
				if (typeof body !== 'object' || body === null || Array.isArray(body)) return badRequest('expected a JSON object');
				const nextMode = MODES.has(body.mode) ? body.mode : state.mode;
				const nextUrl = typeof body.url === 'string' ? cleanUrl(body.url) : state.url;
				let selected = state.selected;
				if (typeof body.selected === 'string') {
					selected = state.images.some((image) => image.id === body.selected) ? body.selected : state.selected;
				}
				state = sanitize({
					enabled: typeof body.enabled === 'boolean' ? body.enabled : state.enabled,
					dim: clampInt(body.dim, 0, 80, state.dim),
					blur: clampInt(body.blur, 0, 20, state.blur),
					mode: nextMode,
					url: nextUrl,
					selected,
					images: state.images
				});
				if (nextMode === 'url' && nextUrl === '') return badRequest('url mode needs an http(s) url');
				await persist();
				return json(project(state));
			} catch {
				return serverError();
			}
		}
	}), 'custom-background: settings route');

	ctx.effect(() => ctx.connection.fetch.register({
		path: IMAGE_PATH,
		methods: ['GET', 'POST', 'DELETE'],
		requestBody: 'buffered',
		fetch: async (request) => {
			try {
				await ensureLoaded();
				const url = new URL(request.url, 'http://dsh.invalid');
				if (request.method === 'GET') {
					const id = url.searchParams.get('id') ?? state.selected;
					const entry = state.images.find((image) => image.id === id);
					if (entry === undefined) return notFound();
					const target = imagePath(entry.id);
					const bytes = target === null ? null : await readFile(target).catch(() => null);
					if (bytes === null) return notFound();
					const immutable = url.searchParams.get('v') === entry.rev;
					const headers = {
						'content-type': entry.type,
						'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'no-store',
						'etag': entry.rev
					};
					if (request.headers.get('if-none-match') === entry.rev) return new Response(null, { status: 304, headers });
					return new Response(new Uint8Array(bytes), { status: 200, headers });
				}
				if (request.method === 'POST') {
					const type = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
					if (IMAGE_TYPES[type] === undefined) return badRequest('content-type must be png, jpeg, webp, or gif');
					const bytes = new Uint8Array(await request.arrayBuffer());
					if (bytes.byteLength === 0) return badRequest('empty image body');
					if (bytes.byteLength > MAX_IMAGE_BYTES) return new Response('image too large', { status: 413, headers: { 'cache-control': 'no-store' } });
					const id = createHash('sha256').update(bytes).digest('hex').slice(0, 16);
					if (state.images.some((image) => image.id === id)) {
						if (state.selected !== id) {
							state = { ...state, mode: 'local', selected: id };
							await persist();
						}
						return json(project(state));
					}
					if (state.images.length >= MAX_IMAGES) return conflict('image gallery is full');
					const target = imagePath(id);
					if (target === null) return serverError();
					await ensureImagesDir();
					await schedule(async () => {
						const tmp = `${target}.${randomUUID()}.tmp`;
						await writeFile(tmp, bytes);
						await rename(tmp, target);
					});
					const entry = { id, type, size: bytes.byteLength, rev: id, addedAt: new Date().toISOString() };
					state = { ...state, mode: 'local', selected: id, images: [entry, ...state.images] };
					await persist();
					return json(project(state));
				}
				// DELETE: one gallery item by id, or the selected one by default.
				const id = url.searchParams.get('id') ?? state.selected;
				if (id === null || id === '' || !state.images.some((image) => image.id === id)) return notFound();
				const target = imagePath(id);
				if (target !== null) await schedule(() => rm(target, { force: true }));
				const images = state.images.filter((image) => image.id !== id);
				const selected = state.selected === id ? images[0]?.id ?? null : state.selected;
				state = {
					...state,
					images,
					selected,
					mode: state.mode === 'local' && selected === null ? 'none' : state.mode
				};
				await persist();
				return json(project(state));
			} catch {
				return serverError();
			}
		}
	}), 'custom-background: image route');

	ctx.effect(() => ctx.connection.fetch.register({
		path: DEBUG_PATH,
		methods: ['POST'],
		requestBody: 'buffered',
		fetch: async (request) => {
			try {
				const text = (await request.text()).slice(0, 16000);
				if (text === '') return badRequest('empty body');
				if (settingsFile === null) return serverError();
				const debugFile = `${settingsFile}.debug.log`;
				const previous = await readFile(debugFile, 'utf8').catch(() => '');
				await mkdir(dir, { recursive: true });
				await writeFile(debugFile, `${previous}${text}\n`.slice(-48 * 1024));
				return json({ ok: true });
			} catch {
				return serverError();
			}
		}
	}), 'custom-background: debug route');
}
