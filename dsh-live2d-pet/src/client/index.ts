/**
 * dsh-live2d-pet client half — Live2D floating companion with settings panel.
 * Enable/configure via Settings →「Live2D 宠物」(user-config on host).
 * @module dsh-live2d-pet/client
 */

import { createElement, useCallback, useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from 'react'
import { createRoot } from 'react-dom/client'
import { Live2DModel } from 'pixi-live2d-display/cubism4'
import * as PIXI from 'pixi.js'

/** localStorage key that mirrors host enabled (backward compat). */
const STORAGE_KEY = 'dsh-live2d-pet'
/** localStorage key that persists a manual drag offset (wiped each boot). */
const DRAG_KEY = 'dsh-live2d-pet-drag'

const CONFIG_URL = '/pet/live2d/config'
const USER_CONFIG_URL = '/pet/live2d/user-config'

const PHASE_EXPRESSION: Record<string, string> = {
  idle: 'idle',
  waiting: 'idle',
  thinking: 'thinking',
  tool: 'tool',
  done: 'done',
  failed: 'failed',
  drag: 'drag',
  deep: 'thinking',
  sleep: 'sleep',
  celebrate: 'done',
}
const HOVER_EXPRESSION = 'surprise'

const DONE_MS = 3000
const IDLE_FIDGET_PLAY_MS = 2800
const DEEP_THINK_MS = 5000
const SLEEP_MS = 60000
const CELEBRATE_TOOL_COUNT = 3
const ONESHOT_RETURN_MS = 4000

const IDLE_MOTION = 'Idle'
const TAP_MOTION_GROUP = 'Tap'

/** Phase → preferred motion group (Tororo stock + custom). */
const PHASE_MOTION: Record<string, string | null> = {
  thinking: 'Think',
  deep: 'Think',
  waiting: 'Flick',
  tool: 'FlickDown',
  done: 'Happy',
  celebrate: 'Happy',
  failed: 'FlickDown',
  sleep: 'Sleepy',
  idle: null,
  drag: null,
}

/** Idle fidget candidates (stock + custom). */
const FIDGET_GROUPS = ['Tap', 'Flick', 'FlickUp', 'Curious', 'Stretch'] as const

/** Model presets for the settings select. */
const MODEL_OPTIONS: Array<{ id: string; label: string; path: string }> = [
  { id: 'tororo', label: '白猫 Tororo', path: 'tororo/tororo.model3.json' },
  { id: 'hijiki', label: '黑猫 Hijiki', path: 'hijiki/hijiki.model3.json' },
  { id: 'haru', label: 'Haru', path: 'haru/haru_greeter_t03.model3.json' },
]

export type PetRuntimeConfig = {
  model: string
  modelRel: string
  size: number
  right: number
  bottom: number
  offsetX: number
  offsetY: number
  gap: number
  enabled: boolean
  fidgetSec: number
  phaseMotions: boolean
}

const DEFAULT_RUNTIME: PetRuntimeConfig = {
  model: '/pet/live2d/tororo/tororo.model3.json',
  modelRel: 'tororo/tororo.model3.json',
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

function loadDragOffset(): { x: number; y: number } {
  try {
    window.localStorage?.removeItem(DRAG_KEY)
  } catch {
    /* ignore */
  }
  return { x: 0, y: 0 }
}

function saveDragOffset(): void {
  // Intentionally a no-op: drag offset does not survive restarts.
}

const CAT_PARAM_EXPRESSIONS: Record<string, Record<string, number | null>> = {
  idle: {
    PARAM_EYE_L_OPEN: null,
    PARAM_EYE_R_OPEN: null,
    PARAM_MOUTH_OPEN_Y: null,
    PARAM_MOUTH_FORM: null,
    PARAM_TAIL: null,
    PARAM_EAR_L: null,
    PARAM_EAR_R: null,
  },
  thinking: {
    PARAM_EYE_L_OPEN: 0.5,
    PARAM_EYE_R_OPEN: 0.5,
    PARAM_MOUTH_OPEN_Y: 0.15,
    PARAM_TAIL: -0.3,
  },
  tool: {
    PARAM_EYE_L_OPEN: 0.9,
    PARAM_EYE_R_OPEN: 0.9,
    PARAM_MOUTH_OPEN_Y: 0.1,
    PARAM_TAIL: 0.5,
  },
  done: {
    PARAM_EYE_L_OPEN: 0.8,
    PARAM_EYE_R_OPEN: 0.8,
    PARAM_MOUTH_FORM: 0.4,
    PARAM_TAIL: 0.7,
  },
  failed: {
    PARAM_EYE_L_OPEN: 0.4,
    PARAM_EYE_R_OPEN: 0.4,
    PARAM_EAR_L: -0.4,
    PARAM_EAR_R: -0.4,
    PARAM_TAIL: -0.8,
  },
  drag: {
    PARAM_EYE_L_OPEN: 0.9,
    PARAM_EYE_R_OPEN: 0.9,
    PARAM_MOUTH_OPEN_Y: 0.2,
    PARAM_TAIL: 1,
  },
  sleep: {
    PARAM_EYE_L_OPEN: 0.15,
    PARAM_EYE_R_OPEN: 0.15,
    PARAM_MOUTH_OPEN_Y: 0.05,
    PARAM_TAIL: 0.2,
  },
  surprise: {
    PARAM_EYE_L_OPEN: 1,
    PARAM_EYE_R_OPEN: 1,
    PARAM_MOUTH_OPEN_Y: 0.3,
    PARAM_TAIL: -0.5,
  },
}

function applyExpression(model: any, name: string): void {
  const snap = CAT_PARAM_EXPRESSIONS[name]
  if (snap) {
    try {
      for (const [id, value] of Object.entries(snap)) {
        if (value !== null) {
          model.internalModel.coreModel.setParameterValueById(id, value, 1)
        }
      }
      return
    } catch {
      /* fall through */
    }
  }
  try {
    model.expression(name)
  } catch {
    /* ignore */
  }
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function playMotionGroup(model: any, group: string | null, motionActiveRef: { current: boolean }): void {
  if (!model || !group) return
  try {
    model.internalModel?.motionManager?.stopAllMotions()
    motionActiveRef.current = true
    model.motion(group)
  } catch {
    // Group may not exist on this model (e.g. Haru has no Think) — try Tap then Idle.
    try {
      model.motion(TAP_MOTION_GROUP)
      motionActiveRef.current = true
    } catch {
      try {
        model.motion(IDLE_MOTION)
      } catch {
        /* ignore */
      }
      motionActiveRef.current = false
    }
  }
}

function returnToIdle(model: any, motionActiveRef: { current: boolean }): void {
  try {
    model?.internalModel?.motionManager?.stopAllMotions()
    model?.motion(IDLE_MOTION)
  } catch {
    /* ignore */
  }
  motionActiveRef.current = false
}

/* ---- Settings section styles (dsh-pet-like tokens) ---- */
const cardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '12px 14px',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: 12,
  maxWidth: 720,
}
const fieldStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }
const labelStyle: CSSProperties = { fontSize: 12, color: 'var(--dsw-alias-label-secondary)' }
const inputStyle: CSSProperties = {
  boxSizing: 'border-box',
  width: '100%',
  minHeight: 28,
  padding: '4px 10px',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: 8,
  background: 'var(--dsw-alias-bg-layer-1)',
  color: 'var(--dsw-alias-label-primary)',
  font: 'inherit',
  fontSize: 13,
  outline: 'none',
}
const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '10px 16px',
  alignItems: 'end',
}
const btnPrimary: CSSProperties = {
  border: '1px solid var(--dsw-alias-button-info-fill)',
  background: 'var(--dsw-alias-button-info-fill)',
  color: '#fff',
  borderRadius: 8,
  padding: '4px 14px',
  font: 'inherit',
  fontSize: 12,
  lineHeight: '20px',
  cursor: 'pointer',
}

type Draft = {
  enabled: boolean
  model: string
  size: number
  offsetX: number
  offsetY: number
  right: number
  bottom: number
  fidgetSec: number
  phaseMotions: boolean
}

function Live2DPetConfigSection() {
  const [draft, setDraft] = useState<Draft>({
    enabled: false,
    model: 'tororo/tororo.model3.json',
    size: 220,
    offsetX: 0,
    offsetY: 0,
    right: 24,
    bottom: 100,
    fidgetSec: 7,
    phaseMotions: true,
  })
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(USER_CONFIG_URL)
        const data = await res.json()
        const m = data?.merged ?? {}
        if (cancelled) return
        setDraft({
          enabled: Boolean(m.enabled),
          model: String(m.model ?? 'tororo/tororo.model3.json'),
          size: Number(m.size ?? 220),
          offsetX: Number(m.offsetX ?? 0),
          offsetY: Number(m.offsetY ?? 0),
          right: Number(m.right ?? 24),
          bottom: Number(m.bottom ?? 100),
          fidgetSec: Number(m.fidgetSec ?? 7),
          phaseMotions: m.phaseMotions !== false,
        })
      } catch (error) {
        if (!cancelled) setStatus('加载配置失败：' + String(error))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const setField = useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
  }, [])

  const onSave = useCallback(async () => {
    setBusy(true)
    setStatus('保存中…')
    try {
      const res = await fetch(USER_CONFIG_URL, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          enabled: draft.enabled,
          model: draft.model,
          size: draft.size,
          offsetX: draft.offsetX,
          offsetY: draft.offsetY,
          right: draft.right,
          bottom: draft.bottom,
          fidgetSec: draft.fidgetSec,
          phaseMotions: draft.phaseMotions,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || res.statusText)
      try {
        window.localStorage?.setItem(STORAGE_KEY, draft.enabled ? '1' : '0')
      } catch {
        /* ignore */
      }
      await (window as any).__dshLive2dPetReloadConfig?.(data.merged)
      setStatus('已保存并生效')
    } catch (error) {
      setStatus('保存失败：' + String(error))
    } finally {
      setBusy(false)
    }
  }, [draft])

  const num = (key: keyof Draft, label: string, min?: number, max?: number) =>
    createElement('div', { style: fieldStyle }, [
      createElement('label', { key: 'l', style: labelStyle }, label),
      createElement('input', {
        key: 'i',
        type: 'number',
        style: inputStyle,
        value: draft[key] as number,
        min,
        max,
        onChange: (e: ChangeEvent<HTMLInputElement>) => {
          const v = Number(e.target.value)
          if (!Number.isFinite(v)) return
          setField(key, v as Draft[typeof key])
        },
      }),
    ])

  return createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        color: 'var(--dsw-alias-label-primary)',
        fontSize: 13,
        lineHeight: '20px',
      },
    },
    [
      createElement('h3', { key: 't', style: { margin: 0, fontSize: 16, fontWeight: 500 } }, 'Live2D 宠物'),
      createElement('p', {
        key: 'intro',
        style: { margin: 0, fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' },
      }, '在设置里开关白猫/黑猫/Haru，调整大小与位置；保存后即时生效，无需顶栏按钮。'),
      createElement('div', { key: 'card', style: cardStyle }, [
        createElement(
          'label',
          {
            key: 'en',
            style: { display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
          },
          [
            createElement('input', {
              key: 'c',
              type: 'checkbox',
              checked: draft.enabled,
              onChange: (e: ChangeEvent<HTMLInputElement>) => setField('enabled', e.target.checked),
              style: { width: 16, height: 16, accentColor: 'var(--dsw-alias-state-business-primary)' },
            }),
            createElement('span', { key: 's' }, '启用宠物'),
          ],
        ),
        createElement('div', { key: 'model', style: fieldStyle }, [
          createElement('label', { key: 'l', style: labelStyle }, '模型'),
          createElement(
            'select',
            {
              key: 's',
              style: inputStyle,
              value: draft.model,
              onChange: (e: ChangeEvent<HTMLSelectElement>) => setField('model', e.target.value),
            },
            MODEL_OPTIONS.map((o) =>
              createElement('option', { key: o.id, value: o.path }, o.label),
            ),
          ),
        ]),
        createElement('div', { key: 'grid', style: gridStyle }, [
          num('size', '大小 size（px）', 120, 480),
          num('fidgetSec', '空闲小动作间隔（秒）', 2, 60),
          num('offsetX', 'offsetX', -800, 800),
          num('offsetY', 'offsetY', -800, 800),
          num('right', '距右边 (px)', 0, 800),
          num('bottom', '距底边 (px)', 0, 800),
        ]),
        createElement(
          'label',
          {
            key: 'pm',
            style: { display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
          },
          [
            createElement('input', {
              key: 'c',
              type: 'checkbox',
              checked: draft.phaseMotions,
              onChange: (e: ChangeEvent<HTMLInputElement>) => setField('phaseMotions', e.target.checked),
              style: { width: 16, height: 16, accentColor: 'var(--dsw-alias-state-business-primary)' },
            }),
            createElement('span', { key: 's' }, '状态动作（思考/完成等播放对应动作）'),
          ],
        ),
        createElement('div', { key: 'actions', style: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 } }, [
          createElement(
            'button',
            {
              key: 'save',
              type: 'button',
              style: { ...btnPrimary, opacity: busy ? 0.6 : 1 },
              disabled: busy,
              onClick: onSave,
            },
            '保存',
          ),
          createElement(
            'span',
            {
              key: 'st',
              style: {
                fontSize: 12,
                color: status.includes('失败')
                  ? 'var(--dsw-alias-state-error-primary)'
                  : 'var(--dsw-alias-state-success-primary)',
              },
            },
            status,
          ),
        ]),
      ]),
    ],
  )
}

type Live2DPetProps = {
  phase?: string
  toolName?: string
  cfg: PetRuntimeConfig
}

/** The floating Live2D pet component. */
export function Live2DPet(props: Live2DPetProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const modelRef = useRef<any>(null)
  const [dragging, setDragging] = useState(false)
  const [hovering, setHovering] = useState(false)
  const dragOffsetRef = useRef<{ x: number; y: number }>(loadDragOffset())
  const phaseRef = useRef(props.phase ?? 'idle')
  phaseRef.current = props.phase ?? 'idle'
  const motionActiveRef = useRef(false)
  const mouseRef = useRef({ dx: 0, dy: 0 })
  const idleReturnTimer = useRef<any>(null)
  const cfg = props.cfg
  const size = cfg.size ?? 220
  const phaseMotions = cfg.phaseMotions !== false
  const fidgetMs = Math.max(2000, (cfg.fidgetSec ?? 7) * 1000)

  const scheduleReturnIdle = useCallback(() => {
    if (idleReturnTimer.current) clearTimeout(idleReturnTimer.current)
    idleReturnTimer.current = setTimeout(() => {
      if (phaseRef.current === 'idle' || phaseRef.current === 'sleep') {
        returnToIdle(modelRef.current, motionActiveRef)
      } else if (phaseMotions) {
        const g = PHASE_MOTION[phaseRef.current]
        if (!g) returnToIdle(modelRef.current, motionActiveRef)
      } else {
        returnToIdle(modelRef.current, motionActiveRef)
      }
    }, ONESHOT_RETURN_MS)
  }, [phaseMotions])

  useEffect(() => {
    let disposed = false
    let app: any = null
    let onMove: ((e: MouseEvent) => void) | null = null
    let dragState: { startX: number; startY: number; baseX: number; baseY: number } | null = null
    let onDown: ((e: MouseEvent) => void) | null = null
    let onDragMove: ((e: MouseEvent) => void) | null = null
    let onUp: ((e: MouseEvent) => void) | null = null
    let onClick: ((e: MouseEvent) => void) | null = null
    let irisLoop: (() => void) | null = null
    let dragMoved = false

    async function boot(): Promise<void> {
      if (disposed || !canvasRef.current) return
      const csize = size
      const canvas = canvasRef.current
      const placeCorner = (): void => {
        const off = dragOffsetRef.current
        canvas.style.left = 'auto'
        canvas.style.top = 'auto'
        canvas.style.right = `${Math.max(4, Math.round((cfg.right ?? 24) - (cfg.offsetX ?? 0) - off.x))}px`
        canvas.style.bottom = `${Math.max(4, Math.round((cfg.bottom ?? 100) + (cfg.offsetY ?? 0) - off.y))}px`
      }
      placeCorner()
      canvas.style.width = `${csize}px`
      canvas.style.height = `${csize}px`
      canvas.style.pointerEvents = 'auto'
      canvas.style.cursor = 'grab'

      app = new PIXI.Application({
        view: canvas,
        width: csize,
        height: csize,
        backgroundAlpha: 0,
        autoStart: true,
        antialias: true,
        autoDensity: true,
        resolution: Math.max(1, Math.round((window as any).devicePixelRatio || 1)),
      })

      Live2DModel.registerTicker(PIXI.Ticker)

      console.log('[dsh-live2d-pet] loading model…', cfg.model)
      const model = await Live2DModel.from(cfg.model, { autoInteract: false })
      if (disposed) {
        try {
          model.destroy?.()
        } catch {
          /* ignore */
        }
        return
      }
      console.log('[dsh-live2d-pet] model loaded ✓', { w: model.width, h: model.height })
      const baseH = model.height ?? csize
      model.scale.set(csize / Math.max(baseH, 1), csize / Math.max(baseH, 1))
      model.anchor?.set(0.5, 1)
      model.position?.set(csize / 2, csize)
      app.stage.addChild(model)
      modelRef.current = model
      ;(window as any).__dshLive2dPetModel = model
      ;(window as any).pet = (expr?: string, motion?: string): void => {
        const mm = (window as any).__dshLive2dPetModel
        if (!mm) return
        if (expr) {
          try {
            mm.expression(expr)
          } catch {
            /* ignore */
          }
        }
        if (motion) {
          try {
            mm.motion(motion)
          } catch {
            /* ignore */
          }
        }
      }
      applyExpression(model, PHASE_EXPRESSION[phaseRef.current] ?? PHASE_EXPRESSION.idle)
      try {
        model.motion(IDLE_MOTION)
      } catch {
        /* no Idle group */
      }

      placeCorner()

      onDown = (e: MouseEvent): void => {
        if (e.button !== 0) return
        e.preventDefault()
        dragMoved = false
        const rect = canvas.getBoundingClientRect()
        dragState = { startX: e.clientX, startY: e.clientY, baseX: rect.left, baseY: rect.top }
        canvas.style.cursor = 'grabbing'
        setDragging(true)
      }
      onDragMove = (e: MouseEvent): void => {
        if (!dragState) return
        const dx = e.clientX - dragState.startX
        const dy = e.clientY - dragState.startY
        if (Math.abs(dx) + Math.abs(dy) > 4) dragMoved = true
        canvas.style.left = `${dragState.baseX + dx}px`
        canvas.style.top = `${dragState.baseY + dy}px`
        canvas.style.right = 'auto'
        canvas.style.bottom = 'auto'
      }
      onUp = (e: MouseEvent): void => {
        if (!dragState) return
        const off = dragOffsetRef.current
        off.x += e.clientX - dragState.startX
        off.y += e.clientY - dragState.startY
        dragState = null
        saveDragOffset()
        placeCorner()
        canvas.style.cursor = 'grab'
        setDragging(false)
      }
      onClick = (): void => {
        if (dragMoved) return
        const m = modelRef.current
        if (!m) return
        playMotionGroup(m, TAP_MOTION_GROUP, motionActiveRef)
        scheduleReturnIdle()
      }
      canvas.addEventListener('mousedown', onDown)
      canvas.addEventListener('click', onClick)
      window.addEventListener('mousemove', onDragMove)
      window.addEventListener('mouseup', onUp)

      onMove = (e: MouseEvent): void => {
        const m = modelRef.current
        if (!m) return
        const cx = window.innerWidth / 2
        const cy = window.innerHeight / 2
        const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / cx))
        const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / cy))
        mouseRef.current = { dx, dy }
        try {
          if (!motionActiveRef.current) {
            m.internalModel.coreModel.setParameterValueById('PARAM_ANGLE_X', dx * 24, 1)
            m.internalModel.coreModel.setParameterValueById('PARAM_ANGLE_Y', -dy * 18, 1)
            // Haru fallback ids
            m.internalModel.coreModel.setParameterValueById('ParamAngleX', dx * 24, 1)
            m.internalModel.coreModel.setParameterValueById('ParamAngleY', -dy * 18, 1)
          }
        } catch {
          /* ignore */
        }
      }
      window.addEventListener('mousemove', onMove)

      irisLoop = (): void => {
        const m2 = modelRef.current
        if (!m2) return
        const { dx, dy } = mouseRef.current
        try {
          m2.internalModel.coreModel.setParameterValueById('PARAM_EYE_BALL_X', dx, 1)
          m2.internalModel.coreModel.setParameterValueById('PARAM_EYE_BALL_Y', -dy, 1)
          m2.internalModel.coreModel.setParameterValueById('ParamEyeBallX', dx, 1)
          m2.internalModel.coreModel.setParameterValueById('ParamEyeBallY', -dy, 1)
        } catch {
          /* ignore */
        }
      }
      app.ticker.add(irisLoop)

      canvas.addEventListener('pointerenter', () => setHovering(true))
      canvas.addEventListener('pointerleave', () => setHovering(false))
    }

    boot().catch((error) => {
      console.error('[dsh-live2d-pet] boot failed', error)
    })
    return () => {
      disposed = true
      if (idleReturnTimer.current) clearTimeout(idleReturnTimer.current)
      try {
        if (irisLoop) app?.ticker.remove(irisLoop)
      } catch {
        /* ignore */
      }
      if (onDown) canvasRef.current?.removeEventListener('mousedown', onDown)
      if (onClick) canvasRef.current?.removeEventListener('click', onClick)
      if (onDragMove) window.removeEventListener('mousemove', onDragMove)
      if (onUp) window.removeEventListener('mouseup', onUp)
      if (onMove) window.removeEventListener('mousemove', onMove)
      try {
        app?.destroy(true)
      } catch {
        /* ignore */
      }
      modelRef.current = null
    }
  }, [size, cfg.model, cfg.right, cfg.bottom, cfg.offsetX, cfg.offsetY, cfg.gap, scheduleReturnIdle])

  // Expression + phase motions
  useEffect(() => {
    const m = modelRef.current
    if (!m) return
    if ((window as any).__dshLive2dPetFreeze) return

    let expr = PHASE_EXPRESSION[props.phase ?? 'idle'] ?? PHASE_EXPRESSION.idle
    if (props.phase === 'tool' && props.toolName) expr = PHASE_EXPRESSION.tool ?? expr
    if (hovering && (props.phase === 'idle' || props.phase === 'sleep')) expr = HOVER_EXPRESSION
    if (dragging) expr = PHASE_EXPRESSION.drag
    applyExpression(m, expr)

    if (dragging) {
      try {
        m.internalModel?.motionManager?.stopAllMotions()
        m.motion(IDLE_MOTION)
      } catch {
        /* ignore */
      }
      motionActiveRef.current = false
      return
    }

    if (!phaseMotions) {
      if (props.phase === 'idle' || props.phase === 'sleep') {
        // leave fidget / idle to the other effect
      } else {
        try {
          m.internalModel?.motionManager?.stopAllMotions()
        } catch {
          /* ignore */
        }
        motionActiveRef.current = false
      }
      return
    }

    const group = PHASE_MOTION[props.phase ?? 'idle']
    if (group) {
      // Prefer custom groups; stock Flick* as fallback inside playMotionGroup
      let g = group
      if (props.phase === 'thinking' || props.phase === 'deep') {
        // Prefer Think, fall back to FlickUp
        try {
          m.internalModel?.motionManager?.stopAllMotions()
          motionActiveRef.current = true
          m.motion('Think')
        } catch {
          playMotionGroup(m, 'FlickUp', motionActiveRef)
          g = 'FlickUp'
        }
      } else if (props.phase === 'done' || props.phase === 'celebrate') {
        try {
          m.internalModel?.motionManager?.stopAllMotions()
          motionActiveRef.current = true
          m.motion('Happy')
        } catch {
          playMotionGroup(m, 'Tap', motionActiveRef)
          g = 'Tap'
        }
      } else if (props.phase === 'sleep') {
        try {
          m.internalModel?.motionManager?.stopAllMotions()
          motionActiveRef.current = true
          m.motion('Sleepy')
        } catch {
          playMotionGroup(m, IDLE_MOTION, motionActiveRef)
          motionActiveRef.current = false
        }
      } else {
        playMotionGroup(m, g, motionActiveRef)
      }
      if (props.phase !== 'sleep') scheduleReturnIdle()
    } else if (props.phase === 'idle') {
      // restore idle loop when returning to idle
      returnToIdle(m, motionActiveRef)
    }
  }, [props.phase, dragging, props.toolName, hovering, phaseMotions, scheduleReturnIdle])

  // Idle fidget
  useEffect(() => {
    if (props.phase !== 'idle' || dragging || hovering) return
    let timer: any
    const fidget = (): void => {
      const m = modelRef.current
      if (m && phaseRef.current === 'idle') {
        const group = pickRandom(FIDGET_GROUPS)
        playMotionGroup(m, group, motionActiveRef)
        timer = setTimeout(() => {
          returnToIdle(modelRef.current, motionActiveRef)
          timer = setTimeout(fidget, fidgetMs)
        }, IDLE_FIDGET_PLAY_MS)
      }
    }
    timer = setTimeout(fidget, fidgetMs)
    return () => {
      clearTimeout(timer)
      motionActiveRef.current = false
      try {
        modelRef.current?.internalModel?.motionManager?.stopAllMotions()
      } catch {
        /* ignore */
      }
    }
  }, [props.phase, dragging, hovering, fidgetMs])

  return createElement('canvas', {
    ref: canvasRef,
    width: size,
    height: size,
    style: {
      position: 'fixed',
      right: `${cfg.right ?? 24}px`,
      bottom: `${cfg.bottom ?? 100}px`,
      zIndex: 2147483000,
      pointerEvents: 'auto',
      cursor: 'grab',
      width: `${size}px`,
      height: `${size}px`,
    },
  })
}

function computePhase(snap: any, lastTurnEndAt: number): string {
  if (snap?.pending?.length) return 'waiting'
  if (snap?.running) {
    if (snap?.runningCalls?.length) return 'tool'
    return 'thinking'
  }
  if (snap?.lastAgentError) return 'failed'
  if (Date.now() - lastTurnEndAt < DONE_MS) return 'done'
  return 'idle'
}

function normalizeRuntime(raw: any): PetRuntimeConfig {
  const modelRel = String(
    raw?.modelRel ??
      raw?.model?.replace?.(/^\/pet\/live2d\//, '') ??
      DEFAULT_RUNTIME.modelRel,
  )
  const modelUrl = String(raw?.modelUrl ?? raw?.model ?? `${'/pet/live2d'}/${modelRel}`)
  return {
    model: modelUrl.startsWith('/') ? modelUrl : `/pet/live2d/${modelRel}`,
    modelRel,
    size: Number(raw?.size ?? DEFAULT_RUNTIME.size),
    right: Number(raw?.right ?? DEFAULT_RUNTIME.right),
    bottom: Number(raw?.bottom ?? DEFAULT_RUNTIME.bottom),
    offsetX: Number(raw?.offsetX ?? DEFAULT_RUNTIME.offsetX),
    offsetY: Number(raw?.offsetY ?? DEFAULT_RUNTIME.offsetY),
    gap: Number(raw?.gap ?? DEFAULT_RUNTIME.gap),
    enabled: Boolean(raw?.enabled),
    fidgetSec: Number(raw?.fidgetSec ?? DEFAULT_RUNTIME.fidgetSec),
    phaseMotions: raw?.phaseMotions !== false,
  }
}

export const inject = ['slots']

export function apply(ctx: any): void {
  let runtimeCfg: PetRuntimeConfig = { ...DEFAULT_RUNTIME }
  let lastPhase = 'idle'
  let lastToolName: string | undefined

  const mount = (): void => {
    if (typeof window === 'undefined') return
    if (!runtimeCfg.enabled) return
    if ((window as any).__dshLive2dPetRoot) return
    const container = document.createElement('div')
    container.dataset.dshLive2dPet = ''
    document.body.appendChild(container)
    const root = createRoot(container)
    root.render(createElement(Live2DPet, { phase: lastPhase, toolName: lastToolName, cfg: runtimeCfg }))
    ;(window as any).__dshLive2dPetRoot = root
    ;(window as any).__dshLive2dPetContainer = container
  }

  const unmount = (): void => {
    if (typeof window === 'undefined') return
    const root = (window as any).__dshLive2dPetRoot
    const container = (window as any).__dshLive2dPetContainer
    if (root) {
      try {
        root.unmount()
      } catch {
        /* ignore */
      }
    }
    if (container) {
      try {
        container.remove()
      } catch {
        /* ignore */
      }
    }
    ;(window as any).__dshLive2dPetRoot = null
    ;(window as any).__dshLive2dPetContainer = null
  }

  const remount = (): void => {
    unmount()
    mount()
  }

  let listUnsub: (() => void) | null = null
  let sessionUnsub: (() => void) | null = null
  let refreshTimer: any = null
  let currentSessionId: string | null = null
  let wasRunning = false
  let lastTurnEndAt = 0
  let lastKey = ''
  let thinkingSince = 0
  let idleSince = 0
  let toolCount = 0
  let lastCallCount = 0

  const renderPhase = (phase: string, toolName?: string): void => {
    const key = `${phase}|${toolName ?? ''}`
    if (key === lastKey) return
    lastKey = key
    lastPhase = phase
    lastToolName = toolName
    console.log('[dsh-live2d-pet] phase →', phase, '| tool:', toolName ?? '-')
    const root = (window as any).__dshLive2dPetRoot
    if (root) root.render(createElement(Live2DPet, { phase, toolName, cfg: runtimeCfg }))
  }

  const tearDownSession = (): void => {
    sessionUnsub?.()
    sessionUnsub = null
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
    currentSessionId = null
    lastKey = ''
  }

  const attachSession = (sessions: any, sessionId: string): void => {
    if (sessionId === currentSessionId) return
    tearDownSession()
    currentSessionId = sessionId
    const binding = sessions.binding?.(sessionId)
    const session = binding?.session
    if (!session?.subscribe) {
      console.warn('[dsh-live2d-pet] no session binding for', sessionId)
      return
    }
    console.log('[dsh-live2d-pet] watching session', sessionId)
    const refresh = (): void => {
      const snap = session.getSnapshot()
      const running = Boolean(snap?.running)
      if (wasRunning && !running) lastTurnEndAt = Date.now()
      wasRunning = running
      let phase = computePhase(snap, lastTurnEndAt)
      const toolName = snap?.runningCalls?.length ? snap.runningCalls[0].name : undefined
      const now = Date.now()

      const callCount = snap?.runningCalls?.length ?? 0
      if (phase === 'tool') {
        if (callCount > lastCallCount) toolCount += callCount - lastCallCount
        lastCallCount = callCount
      } else if (!running && phase !== 'done') {
        toolCount = 0
        lastCallCount = 0
      }

      if (phase === 'thinking') {
        if (!thinkingSince) thinkingSince = now
        else if (now - thinkingSince > DEEP_THINK_MS) phase = 'deep'
      } else {
        thinkingSince = 0
      }

      if (phase === 'idle') {
        if (!idleSince) idleSince = now
        else if (now - idleSince > SLEEP_MS) phase = 'sleep'
      } else {
        idleSince = 0
      }

      if (phase === 'done' && toolCount >= CELEBRATE_TOOL_COUNT) phase = 'celebrate'

      renderPhase(phase, toolName)
    }
    sessionUnsub = session.subscribe(refresh)
    refreshTimer = setInterval(refresh, 1000)
    refresh()
  }

  const attach = (): void => {
    const sessions = ctx.get?.('sessions')
    if (!sessions?.list) {
      console.warn('[dsh-live2d-pet] sessions service unavailable — state linkage disabled (static idle)')
      return
    }
    console.log('[dsh-live2d-pet] sessions service attached')
    listUnsub?.()
    const onList = (): void => {
      const list = sessions.list.getSnapshot()
      const id = list?.current
      if (id) attachSession(sessions, id)
      else {
        tearDownSession()
        currentSessionId = null
        renderPhase('idle')
      }
    }
    listUnsub = sessions.list.subscribe(onList)
    onList()
  }

  const handleEnabled = (open: boolean): void => {
    runtimeCfg = { ...runtimeCfg, enabled: open }
    try {
      window.localStorage?.setItem(STORAGE_KEY, open ? '1' : '0')
    } catch {
      /* ignore */
    }
    if (open) {
      remount()
      attach()
    } else {
      tearDownSession()
      listUnsub?.()
      unmount()
    }
  }

  const applyMerged = (merged: any): void => {
    const next = normalizeRuntime(merged)
    const wasEnabled = runtimeCfg.enabled
    const needRemount =
      next.model !== runtimeCfg.model ||
      next.size !== runtimeCfg.size ||
      next.offsetX !== runtimeCfg.offsetX ||
      next.offsetY !== runtimeCfg.offsetY ||
      next.right !== runtimeCfg.right ||
      next.bottom !== runtimeCfg.bottom ||
      next.fidgetSec !== runtimeCfg.fidgetSec ||
      next.phaseMotions !== runtimeCfg.phaseMotions
    runtimeCfg = next
    try {
      window.localStorage?.setItem(STORAGE_KEY, next.enabled ? '1' : '0')
    } catch {
      /* ignore */
    }
    if (!next.enabled) {
      if (wasEnabled) {
        tearDownSession()
        listUnsub?.()
        unmount()
      }
      return
    }
    if (!wasEnabled) {
      remount()
      attach()
      return
    }
    if (needRemount || !(window as any).__dshLive2dPetRoot) {
      remount()
    } else {
      lastKey = ''
      renderPhase(lastPhase, lastToolName)
    }
  }

  ;(window as any).__dshLive2dPetReloadConfig = async (merged?: any): Promise<void> => {
    if (merged) {
      applyMerged(merged)
      return
    }
    try {
      const res = await fetch(CONFIG_URL)
      const data = await res.json()
      applyMerged(data)
    } catch (error) {
      console.error('[dsh-live2d-pet] reload config failed', error)
    }
  }

  // Keep a soft toggle for console debugging (no header button).
  ;(window as any).__dshLive2dPetToggle = (): void => {
    handleEnabled(!runtimeCfg.enabled)
  }

  // Settings section (replaces ✨ header button).
  if (ctx.slots?.inject) {
    ctx.slots.inject('settings.section', function* () {
      yield ctx.slots.register(
        {
          name: 'settings.section',
          id: 'live2d-pet-config',
          order: 31,
          label: () => 'Live2D 宠物',
        },
        Live2DPetConfigSection,
      )
    })
  }

  // Boot: fetch host merged config (source of truth). Fall back to localStorage.
  ;(async () => {
    try {
      const res = await fetch(CONFIG_URL)
      const data = await res.json()
      // If host has never saved enabled, migrate from localStorage
      if (data.enabled === undefined || data.enabled === false) {
        const ls = window.localStorage?.getItem(STORAGE_KEY) === '1'
        if (ls && data.enabled !== true) {
          // Prefer preserving previous localStorage-on state on first upgrade
          data.enabled = true
          try {
            await fetch(USER_CONFIG_URL, {
              method: 'PUT',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ enabled: true }),
            })
          } catch {
            /* ignore */
          }
        }
      }
      applyMerged(data)
      if (runtimeCfg.enabled) attach()
    } catch (error) {
      console.warn('[dsh-live2d-pet] config fetch failed, using localStorage', error)
      const lsOn = window.localStorage?.getItem(STORAGE_KEY) === '1'
      runtimeCfg = { ...DEFAULT_RUNTIME, enabled: lsOn }
      if (lsOn) {
        mount()
        attach()
      }
    }
  })()
}
