/**
 * Generate short Tororo-compatible motion3.json files (PARAM_* ids).
 * Usage: node scripts/gen-tororo-motions.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '../assets/live2d/tororo/motion')
mkdirSync(outDir, { recursive: true })

function linearCurve(id, keys) {
  if (keys.length < 2) throw new Error(`curve ${id} needs >= 2 keyframes`)
  const segs = [keys[0][0], keys[0][1]]
  for (let i = 1; i < keys.length; i++) segs.push(0, keys[i][0], keys[i][1])
  return { Target: 'Parameter', Id: id, Segments: segs }
}

function buildMotion(curves, { duration, fps = 30, loop = false, fadeIn = 0.25, fadeOut = 0.35 } = {}) {
  let segs = 0
  let pts = 0
  for (const c of curves) {
    const s = (c.Segments.length - 2) / 3
    segs += s
    pts += s + 1
  }
  return {
    Version: 3,
    Meta: {
      Duration: duration,
      Fps: fps,
      Loop: loop,
      AreBeziersRestricted: false,
      FadeInTime: fadeIn,
      FadeOutTime: fadeOut,
      CurveCount: curves.length,
      TotalSegmentCount: segs,
      TotalPointCount: pts,
      UserDataCount: 0,
      TotalUserDataSize: 0,
    },
    Curves: curves,
  }
}

const motions = {
  // ~3s head tilt + ear twitch
  think_tilt: buildMotion(
    [
      linearCurve('PARAM_ANGLE_Z', [[0, 0], [0.6, 12], [2.2, 12], [3, 0]]),
      linearCurve('PARAM_ANGLE_X', [[0, 0], [0.5, 8], [1.5, -6], [3, 0]]),
      linearCurve('PARAM_EAR_L', [[0, 0], [0.4, 0.5], [1.2, -0.3], [2.0, 0.4], [3, 0]]),
      linearCurve('PARAM_EAR_R', [[0, 0], [0.4, -0.2], [1.2, 0.5], [2.0, -0.3], [3, 0]]),
      linearCurve('PARAM_EYE_L_OPEN', [[0, 1], [0.5, 0.55], [2.4, 0.55], [3, 1]]),
      linearCurve('PARAM_EYE_R_OPEN', [[0, 1], [0.5, 0.55], [2.4, 0.55], [3, 1]]),
      linearCurve('PARAM_TAIL', [[0, 0], [0.8, -0.3], [2.2, 0.2], [3, 0]]),
    ],
    { duration: 3 },
  ),
  // ~2.5s happy tail + bounce
  happy_tail: buildMotion(
    [
      linearCurve('PARAM_TAIL', [[0, 0], [0.25, 0.8], [0.5, 0.2], [0.75, 1], [1.0, 0.3], [1.4, 0.9], [2.0, 0.5], [2.5, 0]]),
      linearCurve('PARAM_BODY_ANGLE_Y', [[0, 0], [0.3, 4], [0.6, 0], [0.9, 4], [1.2, 0], [1.6, 3], [2.5, 0]]),
      linearCurve('PARAM_MOUTH_FORM', [[0, 0], [0.3, 0.6], [2.0, 0.5], [2.5, 0]]),
      linearCurve('PARAM_EYE_L_OPEN', [[0, 1], [0.4, 0.85], [2.0, 0.9], [2.5, 1]]),
      linearCurve('PARAM_EYE_R_OPEN', [[0, 1], [0.4, 0.85], [2.0, 0.9], [2.5, 1]]),
      linearCurve('PARAM_EAR_L', [[0, 0], [0.3, 0.4], [1.2, 0.2], [2.5, 0]]),
      linearCurve('PARAM_EAR_R', [[0, 0], [0.3, 0.4], [1.2, 0.2], [2.5, 0]]),
    ],
    { duration: 2.5 },
  ),
  // ~3s body stretch
  stretch: buildMotion(
    [
      linearCurve('PARAM_BODY_ANGLE_Y', [[0, 0], [0.6, -8], [1.8, -8], [3, 0]]),
      linearCurve('PARAM_ANGLE_Y', [[0, 0], [0.5, -10], [1.8, -8], [3, 0]]),
      linearCurve('PARAM_BODY', [[0, 0], [0.7, 0.4], [2.0, 0.4], [3, 0]]),
      linearCurve('PARAM_HAND_L', [[0, 0], [0.6, 0.5], [2.0, 0.5], [3, 0]]),
      linearCurve('PARAM_HAND_R', [[0, 0], [0.6, 0.5], [2.0, 0.5], [3, 0]]),
      linearCurve('PARAM_TAIL', [[0, 0], [0.5, 0.3], [2.0, -0.2], [3, 0]]),
      linearCurve('PARAM_BREATH', [[0, 0], [0.8, 0.6], [2.0, 0.4], [3, 0]]),
    ],
    { duration: 3 },
  ),
  // ~4s sleepy eyes closing
  sleepy: buildMotion(
    [
      linearCurve('PARAM_EYE_L_OPEN', [[0, 1], [1.0, 0.35], [3.2, 0.15], [4, 0.2]]),
      linearCurve('PARAM_EYE_R_OPEN', [[0, 1], [1.0, 0.35], [3.2, 0.15], [4, 0.2]]),
      linearCurve('PARAM_ANGLE_Z', [[0, 0], [1.2, 8], [3.5, 10], [4, 8]]),
      linearCurve('PARAM_BODY_ANGLE_Y', [[0, 0], [1.5, 3], [4, 3]]),
      linearCurve('PARAM_TAIL', [[0, 0], [1.0, 0.2], [3.0, 0.15], [4, 0.2]]),
      linearCurve('PARAM_MOUTH_OPEN_Y', [[0, 0], [2.0, 0.08], [4, 0.05]]),
      linearCurve('PARAM_EAR_L', [[0, 0], [1.5, -0.2], [4, -0.15]]),
      linearCurve('PARAM_EAR_R', [[0, 0], [1.5, -0.2], [4, -0.15]]),
    ],
    { duration: 4, loop: true },
  ),
  // ~2.5s curious lean + ear move
  curious: buildMotion(
    [
      linearCurve('PARAM_ANGLE_X', [[0, 0], [0.4, 14], [1.2, 10], [2.0, -8], [2.5, 0]]),
      linearCurve('PARAM_ANGLE_Y', [[0, 0], [0.5, 6], [1.5, 4], [2.5, 0]]),
      linearCurve('PARAM_BODY_ANGLE_X', [[0, 0], [0.5, 6], [1.5, 4], [2.5, 0]]),
      linearCurve('PARAM_EAR_L', [[0, 0], [0.3, 0.7], [1.0, 0.3], [1.8, 0.6], [2.5, 0]]),
      linearCurve('PARAM_EAR_R', [[0, 0], [0.3, -0.2], [1.0, 0.5], [1.8, -0.1], [2.5, 0]]),
      linearCurve('PARAM_EYE_L_OPEN', [[0, 1], [0.4, 1], [1.2, 0.95], [2.5, 1]]),
      linearCurve('PARAM_EYE_R_OPEN', [[0, 1], [0.4, 1], [1.2, 0.95], [2.5, 1]]),
      linearCurve('PARAM_TAIL', [[0, 0], [0.6, 0.4], [1.5, -0.2], [2.5, 0]]),
    ],
    { duration: 2.5 },
  ),
}

for (const [name, data] of Object.entries(motions)) {
  const path = join(outDir, `${name}.motion3.json`)
  writeFileSync(path, JSON.stringify(data, null, '\t') + '\n')
  console.log('wrote', path, 'duration=', data.Meta.Duration)
}
