/**
 * Host half of the image-generation bundle.
 *
 * Registers the `generate_image` tool, which talks to any OpenAI-compatible
 * `POST {baseURL}/images/generations` endpoint, accepts a `b64_json` or `url`
 * image in the answer, and stores the bytes inside the session workspace.
 * The base URL, model, and API key are volatile Config fields, so the browser
 * half can edit them from the Plugins page while this tool reads the live
 * values on every call.
 */
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { Buffer } from 'node:buffer';
import { defineTool } from '@deepseek-ai/dsh-tools';
import z from '@deepseek-ai/schemastery';

export const name = 'image-gen';

/** The tool registry must exist before this plugin activates. */
export const inject = ['tools'];

/** Editable fields; all volatile so Plugins-page edits apply without a restart. */
export const Config = z.object({
	baseURL: z
		.string()
		.default('')
		.volatile()
		.description('OpenAI-compatible images base URL, such as https://api.openai.com/v1. The tool appends /images/generations unless the URL already names that path.'),
	model: z
		.string()
		.default('')
		.volatile()
		.description('Image model name, sent as the request model, such as gpt-image-1 or dall-e-3.'),
	apiKey: z
		.string()
		.default('')
		.volatile()
		.description('Bearer token for the images endpoint. Leave empty for endpoints that accept unauthenticated requests.'),
});

/** Cooperative deadline for one generation request, including the download. */
const REQUEST_TIMEOUT_MS = 180_000;

/** Upper bound on one downloaded image. */
const MAX_IMAGE_BYTES = 32 * 1024 * 1024;

/** Supported raster formats and their file extensions. */
const FORMATS = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/webp': 'webp',
	'image/gif': 'gif',
};

const CONFIGURE_HINT =
	'open the Web UI sidebar → Plugins → Image Generation → its row → Configure, then fill in the API base URL, model, and key';

/**
 * Read one Config value that may be either a volatile reference or a plain value.
 * @param {unknown} value - the field as the Loader parsed it.
 * @returns {unknown} the current value.
 */
function readConfig(value) {
	if (value !== null && typeof value === 'object' && typeof value.get === 'function') return value.get();
	return value;
}

/**
 * Turn a configured base URL into the images-generations endpoint.
 * @param {string} raw - the user-entered URL.
 * @returns {string} the absolute endpoint.
 */
export function resolveEndpoint(raw) {
	const base = String(raw ?? '').trim();
	if (base === '') return '';
	const trimmed = base.replace(/\/+$/u, '');
	if (/\/images\/generations$/u.test(trimmed)) return trimmed;
	return `${trimmed}/images/generations`;
}

/**
 * Identify a raster image by its file signature.
 * @param {Uint8Array} bytes - downloaded image bytes.
 * @returns {{ mediaType: string, extension: string } | undefined} the detected format.
 */
export function sniffImage(bytes) {
	const ascii = (offset, text) => {
		for (let index = 0; index < text.length; index += 1) {
			if (bytes[offset + index] !== text.charCodeAt(index)) return false;
		}
		return true;
	};
	if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { mediaType: 'image/png', extension: 'png' };
	if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mediaType: 'image/jpeg', extension: 'jpg' };
	if (bytes.length >= 12 && ascii(0, 'RIFF') && ascii(8, 'WEBP')) return { mediaType: 'image/webp', extension: 'webp' };
	if (bytes.length >= 6 && (ascii(0, 'GIF87a') || ascii(0, 'GIF89a'))) return { mediaType: 'image/gif', extension: 'gif' };
	return undefined;
}

/**
 * Build a safe file stem from the caller's filename argument.
 * @param {unknown} raw - the optional `filename` argument.
 * @returns {string | undefined} a sanitized stem, or undefined for an automatic name.
 */
function sanitizeStem(raw) {
	if (typeof raw !== 'string') return undefined;
	const name = basename(raw.trim());
	if (name === '' || name === '.' || name === '..') return undefined;
	const stem = name.replace(/\.[^.]*$/u, '').replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^[.-]+/u, '').slice(0, 80);
	return stem === '' ? undefined : stem;
}

/**
 * Produce an automatic timestamped file stem.
 * @returns {string} a unique stem.
 */
function automaticStem() {
	const stamp = new Date().toISOString().replace(/[-:]/gu, '').replace(/\..*$/u, '');
	return `image-${stamp}-${randomBytes(3).toString('hex')}`;
}

/** Truncate provider diagnostics so one error line stays readable. */
function snippet(text, limit = 500) {
	const collapsed = String(text ?? '').replace(/\s+/gu, ' ').trim();
	return collapsed.length > limit ? `${collapsed.slice(0, limit)}…` : collapsed;
}

/** Read the JSON body once, with an explicit parse failure. */
function parseJson(text) {
	try {
		return JSON.parse(text);
	} catch {
		throw new Error(`the image endpoint returned a non-JSON response: ${snippet(text)}`);
	}
}

/**
 * Decode the image carried by an OpenAI-compatible response.
 * @param {any} body - the parsed JSON answer.
 * @param {AbortSignal} signal - caller cancellation.
 * @returns {Promise<{ bytes: Uint8Array, revisedPrompt?: string }>} the image bytes.
 */
async function imageFromResponse(body, signal) {
	const first = Array.isArray(body?.data) ? body.data[0] : Array.isArray(body?.images) ? body.images[0] : undefined;
	const encoded = first?.b64_json ?? body?.b64_json;
	const remote = first?.url ?? body?.url;
	const revisedPrompt = typeof first?.revised_prompt === 'string' ? first.revised_prompt : undefined;
	if (typeof encoded === 'string' && encoded.length > 0) {
		const bytes = Buffer.from(encoded, 'base64');
		if (bytes.length === 0) throw new Error('the image endpoint returned empty base64 image data');
		return { bytes, ...(revisedPrompt === undefined ? {} : { revisedPrompt }) };
	}
	if (typeof remote === 'string' && remote.length > 0) {
		if (remote.startsWith('data:image/')) {
			const comma = remote.indexOf(',');
			const bytes = comma === -1 ? Buffer.alloc(0) : Buffer.from(remote.slice(comma + 1), 'base64');
			if (bytes.length === 0) throw new Error('the image endpoint returned an empty data URL');
			return { bytes, ...(revisedPrompt === undefined ? {} : { revisedPrompt }) };
		}
		if (!/^https?:\/\//u.test(remote)) throw new Error(`the image endpoint returned an unsupported image URL: ${snippet(remote, 200)}`);
		const response = await fetch(remote, { signal });
		if (!response.ok) throw new Error(`downloading the generated image failed (HTTP ${response.status})`);
		const bytes = new Uint8Array(await response.arrayBuffer());
		if (bytes.length === 0) throw new Error('the downloaded generated image is empty');
		return { bytes, ...(revisedPrompt === undefined ? {} : { revisedPrompt }) };
	}
	throw new Error(`the image endpoint returned no image data (expected data[0].b64_json or data[0].url): ${snippet(JSON.stringify(body), 300)}`);
}

/** Human-readable byte size for the tool result. */
function formatBytes(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Run one generation request and persist the resulting image.
 * @param {object} ctx - the plugin context.
 * @param {object} config - the volatile Config fields.
 * @param {any} args - validated tool arguments.
 * @param {any} exec - tool execution context.
 * @returns {Promise<object>} the canonical tool value.
 */
async function generateImage(ctx, config, args, exec) {
	const baseURL = String(readConfig(config.baseURL) ?? '').trim();
	const model = String(readConfig(config.model) ?? '').trim();
	const apiKey = String(readConfig(config.apiKey) ?? '').trim();
	if (baseURL === '') throw new Error(`image generation is not configured: ${CONFIGURE_HINT}`);
	if (model === '') throw new Error(`image generation has no model configured: ${CONFIGURE_HINT}`);
	const prompt = String(args.prompt ?? '').trim();
	if (prompt === '') throw new Error('prompt must be a non-empty string');

	const endpoint = resolveEndpoint(baseURL);
	const payload = { model, prompt, n: 1 };
	const size = typeof args.size === 'string' ? args.size.trim() : '';
	if (size !== '') {
		if (!/^\d{2,5}x\d{2,5}$/u.test(size)) throw new Error(`size must look like "1024x1024"; got "${size}"`);
		payload.size = size;
	}
	const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
	const signal = typeof AbortSignal.any === 'function' ? AbortSignal.any([exec.signal, timeout]) : timeout;
	let response;
	try {
		response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				accept: 'application/json',
				...(apiKey === '' ? {} : { authorization: `Bearer ${apiKey}` }),
			},
			body: JSON.stringify(payload),
			signal,
		});
	} catch (error) {
		if (exec.signal.aborted) throw new Error('image generation was cancelled');
		if (error?.name === 'TimeoutError' || error?.name === 'AbortError') throw new Error(`the image endpoint did not answer within ${Math.round(REQUEST_TIMEOUT_MS / 1000)} seconds`);
		throw new Error(`could not reach the image endpoint ${endpoint}: ${error instanceof Error ? error.message : String(error)}`);
	}
	const text = await response.text();
	if (!response.ok) throw new Error(`the image endpoint rejected the request (HTTP ${response.status}): ${snippet(text)}`);
	const body = parseJson(text);
	const image = await imageFromResponse(body, signal);
	if (image.bytes.length > MAX_IMAGE_BYTES) throw new Error(`the generated image is larger than ${formatBytes(MAX_IMAGE_BYTES)}`);
	const format = sniffImage(image.bytes);
	if (format === undefined) throw new Error('the image endpoint returned bytes that are not PNG, JPEG, WebP, or GIF');

	let directory = process.cwd();
	const workingDirectory = ctx.get('workingDirectory');
	if (workingDirectory !== undefined && exec.agent !== undefined) {
		try {
			const resolved = workingDirectory.get(exec.agent.session);
			if (typeof resolved === 'string' && resolved !== '') directory = resolved;
		} catch {
			// Fall back to the process directory when the session has no working directory yet.
		}
	}
	const folder = join(directory, 'generated-images');
	const stem = sanitizeStem(args.filename) ?? automaticStem();
	const fileName = `${stem}.${format.extension}`;
	const absolutePath = join(folder, fileName);
	await mkdir(folder, { recursive: true });
	await writeFile(absolutePath, image.bytes);
	return {
		path: absolutePath,
		relativePath: `generated-images/${fileName}`,
		mediaType: format.mediaType,
		bytes: image.bytes.length,
		model,
		...(image.revisedPrompt === undefined ? {} : { revisedPrompt: image.revisedPrompt }),
	};
}

/**
 * Register the model-facing `generate_image` tool.
 * @param {any} ctx - the plugin context.
 * @param {any} config - the plugin Config.
 */
export function apply(ctx, config) {
	ctx.tools.register(
		defineTool({
			name: 'generate_image',
			description:
				'Generate an image from a text prompt through the image API configured for this plugin (base URL, model, and key are set on the Plugins page). ' +
				'Use this tool whenever the user asks to draw, paint, or generate an image. The image is saved inside the session workspace under generated-images/; ' +
				'show it to the user by including the returned relative path as a markdown image: ![description](relativePath).',
			parameters: {
				prompt: {
					type: 'string',
					required: true,
					description: 'Detailed text description of the image to generate. Name subjects, style, composition, lighting, and colors; write it in the language the image model expects.',
				},
				size: {
					type: 'string',
					description: 'Optional output size such as "1024x1024" or "1792x1024". Omit to use the provider or model default.',
				},
				filename: {
					type: 'string',
					description: 'Optional file name stem for the saved image (no directories). Defaults to a timestamped image-<time>-<hex> name.',
				},
			},
			output: {
				schema: {
					type: 'object',
					additionalProperties: false,
					properties: {
						path: { type: 'string', required: true },
						relativePath: { type: 'string', required: true },
						mediaType: { type: 'string', required: true, enum: [...Object.keys(FORMATS)] },
						bytes: { type: 'integer', required: true },
						model: { type: 'string', required: true },
						revisedPrompt: { type: 'string' },
					},
				},
				render: (_args, value) => [
					{
						type: 'text',
						text:
							`Generated image saved to ${value.relativePath} (${value.mediaType}, ${formatBytes(value.bytes)}, model ${value.model}).\n\n` +
							`Show it to the user with ![generated image](${value.relativePath}) — that path is relative to the session workspace.` +
							(value.revisedPrompt === undefined ? '' : `\n\nProvider revised prompt: ${value.revisedPrompt}`),
					},
				],
				presentationMeta: (_args, value) => ({ path: value.relativePath }),
			},
			presentCall: (args) => ({
				card: 'generic',
				title: `Generate image: ${snippet(String(args.prompt ?? ''), 60)}`,
				kind: 'other',
				rawInput: String(args.prompt ?? ''),
			}),
			presentResult: (_args, result) => ({
				card: 'generic',
				title: result.isError ? 'Image generation failed' : 'Image generated',
				kind: 'other',
			}),
			async execute(args, exec) {
				return generateImage(ctx, config, args, exec);
			},
		}),
	);
}
