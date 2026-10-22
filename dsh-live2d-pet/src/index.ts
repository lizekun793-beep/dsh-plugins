/**
 * dsh-live2d-pet host half — injects the Cubism core script into the
 * document head (before the client bundle evaluates, because
 * pixi-live2d-display checks window.Live2DCubismCore at module time) and
 * serves the model assets under /pet/live2d/*.
 *
 * Also exposes merged config at GET /pet/live2d/config and a user-override
 * store at GET+PUT /pet/live2d/user-config ($DSH_HOME/dsh-live2d-pet/config.json).
 * @module dsh-live2d-pet
 */

import { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Browser-facing base path of Live2D model assets. */
export const LIVE2D_PREFIX = '/pet/live2d'

/** MIME map for model assets (served by extension). */
const LIVE2D_MIME: Record<string, string> = {
  '.json': 'application/json',
  '.moc3': 'application/octet-stream',
  '.png': 'image/png',
  '.js': 'application/javascript',
}

/** Absolute package root, resolved from this module's own location (lib/). */
export function packageRoot(importMetaUrl: string): string {
  return fileURLToPath(new URL('../', importMetaUrl))
}

/** Stable cordis plugin name (matches cordis.patch.yml insert id). */
export const name = 'live2d-pet'

/** Services required before the plugin can mount its surfaces. */
export const inject = ['webServer']

/** Default model path relative to assets/live2d/. */
export const DEFAULT_MODEL = 'tororo/tororo.model3.json'

export type Live2dPetConfig = {
  model?: string
  size?: number
  right?: number
  bottom?: number
  offsetX?: number
  offsetY?: number
  gap?: number
  enabled?: boolean
  fidgetSec?: number
  phaseMotions?: boolean
}

const DEFAULTS: Required<Live2dPetConfig> = {
  model: DEFAULT_MODEL,
  size: 220,
  right: 24,
  bottom: 100,
  offsetX: 0,
  offsetY: 0,
  gap: 10,
  enabled: false,
  fidgetSec: 7,
  phaseMotions: true,
}

function dshHome(): string {
  return process.env.DSH_HOME || join(homedir(), '.dsh')
}

function userConfigPath(): string {
  return join(dshHome(), 'dsh-live2d-pet', 'config.json')
}

async function readUserOverrides(): Promise<Live2dPetConfig> {
  try {
    const raw = await readFile(userConfigPath(), 'utf8')
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Live2dPetConfig) : {}
  } catch {
    return {}
  }
}

async function writeUserOverrides(overrides: Live2dPetConfig): Promise<void> {
  const dir = join(dshHome(), 'dsh-live2d-pet')
  await mkdir(dir, { recursive: true })
  await writeFile(userConfigPath(), JSON.stringify(overrides, null, 2) + '\n', 'utf8')
}

function mergeConfig(patch: Live2dPetConfig, user: Live2dPetConfig): Required<Live2dPetConfig> & { modelUrl: string } {
  const merged: Required<Live2dPetConfig> = {
    model: user.model ?? patch.model ?? DEFAULTS.model,
    size: user.size ?? patch.size ?? DEFAULTS.size,
    right: user.right ?? patch.right ?? DEFAULTS.right,
    bottom: user.bottom ?? patch.bottom ?? DEFAULTS.bottom,
    offsetX: user.offsetX ?? patch.offsetX ?? DEFAULTS.offsetX,
    offsetY: user.offsetY ?? patch.offsetY ?? DEFAULTS.offsetY,
    gap: user.gap ?? patch.gap ?? DEFAULTS.gap,
    enabled: user.enabled ?? patch.enabled ?? DEFAULTS.enabled,
    fidgetSec: user.fidgetSec ?? patch.fidgetSec ?? DEFAULTS.fidgetSec,
    phaseMotions: user.phaseMotions ?? patch.phaseMotions ?? DEFAULTS.phaseMotions,
  }
  const rel = merged.model.replace(/^\/pet\/live2d\//, '')
  return { ...merged, model: rel, modelUrl: `${LIVE2D_PREFIX}/${rel}` }
}

function jsonBody(res: any, req: any, obj: unknown, status = 200): void {
  const body = JSON.stringify(obj)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(Buffer.byteLength(body)),
    'cache-control': 'no-cache',
  })
  if (req.method === 'HEAD') {
    res.end()
    return
  }
  res.end(body)
}

async function readRequestJson(req: any): Promise<any> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw.trim()) return {}
  return JSON.parse(raw)
}

export function apply(ctx: Context, config: Live2dPetConfig = {}): void {
  const patch = { ...config }
  const root = packageRoot(import.meta.url)

  // 1. Serve the Cubism core and the model assets.
  ctx.effect(() => {
    const dispose = ctx.webServer.register({
      kind: 'prefix',
      path: LIVE2D_PREFIX,
      handler: async (req, res): Promise<void> => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          res.writeHead(405)
          res.end()
          return
        }
        const url = new URL(req.url ?? '', 'http://local')
        // Config endpoints are registered as exact routes; skip if somehow hit.
        const rel = decodeURIComponent(url.pathname.slice(LIVE2D_PREFIX.length + 1))
        if (!rel || rel === 'config' || rel === 'user-config') {
          res.writeHead(404)
          res.end()
          return
        }
        const filePath = join(root, 'assets', 'live2d', rel)
        const rootPath = join(root, 'assets', 'live2d')
        if (filePath !== rootPath && !filePath.startsWith(rootPath + '\\') && !filePath.startsWith(rootPath + '/')) {
          res.writeHead(403)
          res.end()
          return
        }
        try {
          const body = await readFile(filePath)
          const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase()
          res.writeHead(200, {
            'content-type': LIVE2D_MIME[ext] ?? 'application/octet-stream',
            'content-length': String(body.byteLength),
            'cache-control': 'no-cache',
          })
          if (req.method === 'HEAD') {
            res.end()
            return
          }
          res.end(body)
        } catch {
          res.writeHead(404)
          res.end()
        }
      },
    })
    return () => {
      dispose()
    }
  }, 'live2d-pet: asset routes')

  // 2. Inject the Cubism core script into the document head — before the
  // client bundle runs — so window.Live2DCubismCore exists at module time.
  //
  // Desktop Electron boots via collectIndexInjections() (IPC) AND/OR
  // renderIndex()+tapIndex on HTTP index responses. Register BOTH:
  // structured script-src (picked up by collectIndexInjections) and a
  // tapIndex fallback for raw HTML transforms.
  const cubismSrc = `${LIVE2D_PREFIX}/live2dcubismcore.min.js`
  ctx.on('webserver/index-inject', (table: Array<Record<string, unknown>>) => {
    table.push({
      kind: 'script-src',
      placement: 'head',
      src: cubismSrc,
    })
  })
  ctx.effect(() => {
    const dispose = ctx.webServer.tapIndex((html: string) => {
      if (html.includes(cubismSrc)) return html
      const injected = `<script src="${cubismSrc}"></script>`
      return html.replace(/<head[^>]*>/, (m) => m + injected)
    })
    return () => {
      dispose()
    }
  }, 'live2d-pet: core injection')

  // 3. Merged config for the client (patch defaults + user overrides).
  ctx.effect(() => {
    const dispose = ctx.webServer.register({
      kind: 'exact',
      path: '/pet/live2d/config',
      handler: async (req, res): Promise<void> => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          res.writeHead(405)
          res.end()
          return
        }
        try {
          const user = await readUserOverrides()
          const merged = mergeConfig(patch, user)
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
            phaseMotions: merged.phaseMotions,
          })
        } catch (error) {
          jsonBody(res, req, { error: String(error) }, 500)
        }
      },
    })
    return () => {
      dispose()
    }
  }, 'live2d-pet: config route')

  // 4. User-config GET (raw overrides + merged) / PUT (write overrides).
  ctx.effect(() => {
    const dispose = ctx.webServer.register({
      kind: 'exact',
      path: '/pet/live2d/user-config',
      handler: async (req, res): Promise<void> => {
        try {
          if (req.method === 'GET' || req.method === 'HEAD') {
            const user = await readUserOverrides()
            const merged = mergeConfig(patch, user)
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
                phaseMotions: merged.phaseMotions,
              },
              path: userConfigPath(),
            })
            return
          }
          if (req.method === 'PUT' || req.method === 'POST') {
            const body = await readRequestJson(req)
            const prev = await readUserOverrides()
            const next: Live2dPetConfig = { ...prev }
            const keys: (keyof Live2dPetConfig)[] = [
              'model',
              'size',
              'right',
              'bottom',
              'offsetX',
              'offsetY',
              'gap',
              'enabled',
              'fidgetSec',
              'phaseMotions',
            ]
            for (const k of keys) {
              if (body[k] !== undefined) {
                ;(next as any)[k] = body[k]
              }
            }
            // Normalize model to relative path under assets/live2d
            if (typeof next.model === 'string') {
              next.model = next.model
                .replace(/^\/pet\/live2d\//, '')
                .replace(/^assets\/live2d\//, '')
            }
            if (typeof next.size === 'number') {
              next.size = Math.max(80, Math.min(640, Math.round(next.size)))
            }
            if (typeof next.fidgetSec === 'number') {
              next.fidgetSec = Math.max(2, Math.min(60, next.fidgetSec))
            }
            await writeUserOverrides(next)
            const merged = mergeConfig(patch, next)
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
                phaseMotions: merged.phaseMotions,
              },
            })
            return
          }
          res.writeHead(405)
          res.end()
        } catch (error) {
          jsonBody(res, req, { error: String(error) }, 500)
        }
      },
    })
    return () => {
      dispose()
    }
  }, 'live2d-pet: user-config route')
}
