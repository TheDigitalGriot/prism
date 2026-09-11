/**
 * The motion layer — one clock for the whole engine.
 *
 * The point of prism-viz-engine is not four tools side by side; it is their motion
 * design and methodologies fused into one coherent thing. Each of the three sources
 * owns a different layer, which is why they compose instead of collide:
 *
 *   diagram-design  THE LAW      references/animation.md — four modes, a token clock,
 *                                eight semantic primitives, a static-first contract,
 *                                reduced-motion and print discipline, anti-patterns.
 *                                The most rigorous motion spec in the cluster by far.
 *   FossFLOW        THE CAMERA   GSAP 3.11.4. SceneLayer.tsx:32-37 tweens translate +
 *                                scale at 0.25s; Grid.tsx:32-36 tweens the tile
 *                                background in step so the floor moves with the camera.
 *   Lanshu          THE TOKENS   render_animated_diagram.py:599-647 — glow dots,
 *                                pulse_rect phase maths, sequential module activation.
 *
 * ── THE CONFLICT, RULED ─────────────────────────────────────────────────────────
 * These two are in direct contradiction and merging them silently would be dishonest:
 *
 *   animation.md:46  "Avoid zoom, parallax, bounce, shake, GLOW, particles, and
 *                     indefinite blinking."
 *   Lanshu :560-571  glow via GaussianBlur; :599 draw_glow_dot; :606 pulse_rect
 *
 * RULING: diagram-design's law wins on SEMANTICS, Lanshu's primitives survive as
 * DECORATION under that law. Concretely — a glow or pulse may never encode meaning, is
 * always `aria-hidden`, only ever runs in `loop` mode at a >=3s cycle, is the first
 * thing dropped under `prefers-reduced-motion`, and never appears in an export. That
 * keeps Lanshu's feel (which is the part worth having) without violating the rule that
 * motion explains a complete static figure and never supplies missing meaning.
 *
 * The camera is exempt from that argument entirely: pan/zoom is chrome, not figure, so
 * FossFLOW's 0.25s tween sits outside the semantic budget.
 */

// ── the clock — diagram-design animation.md:49-55, adopted verbatim ─────────────
export const MOTION = {
  /** micro-feedback: hover, focus, selection */
  fast: 160,
  /** one semantic step entering */
  step: 480,
  /** how long a completed step is held before the next */
  hold: 720,
  /** hard ceiling on a whole autoplay run — animation.md:105 */
  maxTotal: 8000,
  /** animation.md:54 */
  ease: "cubic-bezier(.2,.8,.2,1)",
  /**
   * FossFLOW's camera tween — SceneLayer.tsx:33. Seconds there, ms here.
   * Deliberately NOT one of the semantic tokens above: the camera is chrome.
   */
  camera: 250,
} as const

/** animation.md:7 — exactly one mode per figure. */
export type MotionMode = "none" | "reveal" | "step" | "loop"

/**
 * animation.md:105 — motion does not raise the static budget. Enforced, not documented:
 * a generator that exceeds these gets rejected the same way bad routing does.
 */
export const MOTION_BUDGET = {
  maxSteps: 8,
  targetSteps: [3, 6] as const,
  maxItems: 12,
  maxSimultaneous: 2,
  maxDrawnPaths: 2,
  maxFlowTokens: 1,
  minLoopCycle: 3000,
  translateMax: 24,
} as const

export interface MotionPlan {
  mode: MotionMode
  /** integer steps 1..8, DOM order follows narrative order — animation.md:26 */
  stepCount: number
  /** total autoplay duration; derived, never guessed — animation.md:107 */
  totalMs: number
}

/**
 * animation.md:107 — "Set `--motion-total` to step count x `--motion-hold` and keep it
 * within the 8-second budget." Derived here so no caller invents a duration.
 */
export function planMotion(mode: MotionMode, stepCount: number): MotionPlan {
  const steps = Math.max(0, Math.min(MOTION_BUDGET.maxSteps, Math.floor(stepCount)))
  const total = mode === "none" ? 0 : Math.min(steps * MOTION.hold, MOTION.maxTotal)
  return { mode, stepCount: steps, totalMs: total }
}

export interface MotionViolation {
  rule: string
  problem: string
  fixes: string[]
}

/** Same posture as the canvas gate: collect everything, coerce nothing. */
export function validateMotion(plan: MotionPlan, itemCount: number): MotionViolation[] {
  const v: MotionViolation[] = []
  if (plan.stepCount > MOTION_BUDGET.maxSteps)
    v.push({
      rule: "animation.md:105",
      problem: `${plan.stepCount} steps exceeds the ${MOTION_BUDGET.maxSteps}-step budget`,
      fixes: [`reduce to at most ${MOTION_BUDGET.maxSteps} steps (target 3-6)`],
    })
  if (itemCount > MOTION_BUDGET.maxItems)
    v.push({
      rule: "animation.md:105",
      problem: `${itemCount} marked items exceeds the ${MOTION_BUDGET.maxItems}-item budget`,
      fixes: [`mark at most ${MOTION_BUDGET.maxItems} items with data-motion-item`],
    })
  if (plan.totalMs > MOTION.maxTotal)
    v.push({
      rule: "animation.md:107",
      problem: `${plan.totalMs}ms autoplay exceeds the ${MOTION.maxTotal}ms ceiling`,
      fixes: [`lower the step count, or shorten --motion-hold below ${MOTION.hold}ms`],
    })
  if (plan.mode === "loop" && plan.totalMs && plan.totalMs < MOTION_BUDGET.minLoopCycle)
    v.push({
      rule: "animation.md:14",
      problem: `loop cycle ${plan.totalMs}ms is under the ${MOTION_BUDGET.minLoopCycle}ms minimum`,
      fixes: [`slow the loop to at least ${MOTION_BUDGET.minLoopCycle}ms — a quiet hint, not a blink`],
    })
  return v
}

// ── the camera — FossFLOW, reimplemented without GSAP ──────────────────────────
/**
 * SceneLayer.tsx:32-37 tweens `translateX/translateY/scale` over 0.25s, with
 * `duration: disableAnimation || isFirstRender ? 0 : 0.25`. That first-render guard is
 * the actual design decision worth taking: **the scene must not animate into existence,
 * but every subsequent change eases.** An engine that fades in on load feels like a
 * slideshow; one that snaps on load and glides thereafter feels like an instrument.
 *
 * Reimplemented on rAF rather than pulling GSAP in, for one reason only: GSAP arrives
 * with FossFLOW's whole MUI/Emotion/Paper/Quill stack, and this is the one function of
 * it we need. Same curve, same duration, no tree.
 */
export interface CameraState {
  x: number
  y: number
  zoom: number
}

const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5) // ~ the .2,.8,.2,1 feel

export function tweenCamera(
  from: CameraState,
  to: CameraState,
  apply: (s: CameraState) => void,
  opts: { durationMs?: number; firstRender?: boolean; reducedMotion?: boolean } = {}
): () => void {
  const instant =
    opts.firstRender ||
    opts.reducedMotion ||
    (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches)

  if (instant) {
    apply(to)
    return () => {}
  }

  const dur = opts.durationMs ?? MOTION.camera
  const t0 = performance.now()
  let raf = 0
  const frame = (now: number) => {
    const p = Math.min(1, (now - t0) / dur)
    const e = easeOutQuint(p)
    apply({
      x: from.x + (to.x - from.x) * e,
      y: from.y + (to.y - from.y) * e,
      zoom: from.zoom + (to.zoom - from.zoom) * e,
    })
    if (p < 1) raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)
  return () => cancelAnimationFrame(raf)
}

// ── the decorative primitives — Lanshu, under diagram-design's law ─────────────
/**
 * `pulse_rect(draw, rect, color, phase, radius)` at render_animated_diagram.py:606,
 * driven by `progress * math.tau * 2` at :647 — two full sine cycles per activation.
 * Returned as a 0..1 intensity so the caller decides what it drives (opacity, stroke
 * width, filter). It must never drive anything semantic.
 */
export function pulseIntensity(elapsedMs: number, cycleMs = MOTION_BUDGET.minLoopCycle): number {
  const progress = (elapsedMs % cycleMs) / cycleMs
  return (Math.sin(progress * Math.PI * 2 * 2) + 1) / 2
}

/**
 * Lanshu's sequential module activation — `active = (idx // 6) % len(pulse_targets)` at
 * :644: one module at a time, six frames each, wrapping. The reason it reads well is
 * that it is *one* thing lit at once, which is also diagram-design's `maxSimultaneous`
 * rule arriving from the other direction. The two sources agree here.
 */
export function activeIndex(elapsedMs: number, count: number, dwellMs = 600): number {
  if (count <= 0) return -1
  return Math.floor(elapsedMs / dwellMs) % count
}

/**
 * The gate on every decorative primitive above. animation.md:42 — a flow token is
 * `aria-hidden`, on a fixed path, one at a time, loop >= 3s; :46 forbids glow from
 * carrying meaning; :76 drops `[data-motion-decorative]` entirely under reduced motion.
 */
export function decorativeAttrs(): Record<string, string> {
  return { "aria-hidden": "true", focusable: "false", "data-motion-decorative": "" }
}

/** The CSS custom properties, so the stylesheet and the TS never drift apart. */
export function motionCssVars(): Record<string, string> {
  return {
    "--motion-fast": `${MOTION.fast}ms`,
    "--motion-step": `${MOTION.step}ms`,
    "--motion-hold": `${MOTION.hold}ms`,
    "--motion-camera": `${MOTION.camera}ms`,
    "--motion-ease": MOTION.ease,
  }
}
