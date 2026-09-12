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
 *   archify         THE RUNTIME  template.html:4130-4181 Reading Depth; :4294-4655 the
 *                                interaction inventory (focus, lens, reach, route probe,
 *                                relationship pin); :938-1000 the Motion Governor.
 *                                Added as the fourth seat 2026-09-11 on Gavin's read.
 *
 * ── THE DELIVERY RULING, 2026-09-11 ────────────────────────────────────────────
 * Lanshu ships its motion as a 41-frame, 6-8MB GIF (`optimize=False`, :662). That is a
 * DELIVERY LIMITATION, not a design decision — the renderer is Python/PIL with no
 * runtime, so the only way to show travelling light was to bake it.
 *
 * The vocabulary is the asset; the baking is the loss. A GIF cannot be focused, cannot
 * be probed, cannot honour `prefers-reduced-motion`, and cannot let a reader click into
 * a region to ask what it is. archify already solved exactly that — and independently
 * arrived at Lanshu's own thesis: Lanshu's 300ms pulse cursor walking Input → Scan →
 * Import → Index → Decision → Archive → Pack IS archify's guided-view chapter rail
 * (:5092-5129). Same idea, one baked and one live.
 *
 * RULED: Lanshu's motion vocabulary runs REALTIME under archify's Motion Governor, never
 * pre-rendered. The artefact export survives as an OUTPUT (archify's WebM path, capped
 * at 1280 and never upscaled) rather than as the medium. What the reader gets is the
 * instrument; what they can hand someone else is the recording.
 *
 * This also settles harvest item 10 — "one engine needs an explicit rule for when a
 * plate is ANIMATED versus STATIC." It is not a property of the engine, it is a property
 * of the MODE: `loop` is an explainer artefact and may breathe; `none`/`reveal`/`step`
 * are documents and may not. The Governor is the mechanism that enforces it, and print,
 * embed and reduced-motion all collapse to the document case automatically.
 *
 * ── THE CONFLICT, RULED 2-1 ─────────────────────────────────────────────────────
 * Merging these silently would be dishonest. TWO independent sources forbid the thing
 * the third is built on:
 *
 *   diagram-design  animation.md:46   "Avoid zoom, parallax, bounce, shake, GLOW,
 *                                      particles, and indefinite blinking."
 *   visual-explainer SKILL.md:109     bans continuous glow/pulse/breathing on static
 *                                      content. Reached independently — the two repos
 *                                      share no lineage.
 *   Lanshu          :557-596          bloom on six container edges (alpha 70, radius 18,
 *                                      GaussianBlur 4); :599 draw_glow_dot;
 *                                      :606 pulse_rect. This IS its entire value.
 *
 * RULING (2-1, and recorded as 2-1 rather than laundered into consensus): the law wins
 * on SEMANTICS, Lanshu's primitives survive as DECORATION under it. A glow or pulse may
 * never encode meaning, is always `aria-hidden`, only runs in `loop` mode at a >=3s
 * cycle, is the first thing dropped under `prefers-reduced-motion`, and never appears in
 * an export.
 *
 * What makes that defensible rather than a fudge is Lanshu's own thesis, which the
 * design harvest surfaced: "the pulse order teaches the reading order while the plate
 * itself never changes — only light is added." One region lit at a time, advancing every
 * 6 frames (300ms) over a 41-frame / 20fps / 2.05s loop. That is motion explaining a
 * complete static figure — which is diagram-design's own first principle, arriving from
 * the opposite direction. The two sides are closer than the prohibition suggests; what
 * is actually banned is glow that CARRIES meaning, and Lanshu's never does.
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

/**
 * `power1.out` — gsap's DEFAULT, which is the curve FossFLOW actually uses, because
 * neither of its two `gsap.to()` calls specifies an ease (SceneLayer.tsx:32-37,
 * Grid.tsx:32-36). An earlier revision of this file used easeOutQuint, which was a guess
 * at the feel rather than the measured curve; the design harvest settled it.
 *
 * power1 is quadratic, so `out` is 1-(1-t)^2. Gentler than quintic — it decelerates
 * sooner and settles longer, and the harvest names exactly why that matters:
 * "a fast drag produces continuous smoothed motion that lags the cursor slightly and
 * catches up on release. That lag IS the instrument feel."
 */
const power1Out = (t: number) => 1 - (1 - t) * (1 - t)

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
    const e = power1Out(p)
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

// ── Lanshu's vocabulary, as parameters rather than pixels ──────────────────────
/**
 * render_animated_diagram.py:599-649. The whole animation system is ~35 lines, and the
 * design harvest's judgement stands: "the motion vocabulary is the crown jewel."
 *
 * Ported as PARAMETERS so the paths come from the canvas edge list instead of the 11
 * hardcoded literals at :618-630 — which is the harvest's stated defect 3, hardcoded
 * coordinates as the layout model. Same numbers, driven by real data.
 *
 * Everything here is DECORATION under the 2-1 ruling above: aria-hidden, `loop` mode
 * only, first thing dropped under reduced-motion, never in an export, never carrying
 * meaning. The reading-order cursor is the one that earns its place — it teaches
 * sequence while the plate itself never changes.
 */
export const LANSHU = {
  /** :599-603 — 3-stop falloff plus a white core. This is what makes a dot read as a
   *  light source rather than a disc. Alphas are 0-255 in the source; kept verbatim. */
  glowDot: {
    stops: [
      { radius: 15, alpha: 42 },
      { radius: 10, alpha: 70 },
      { radius: 5, alpha: 210 },
    ],
    core: { radius: 4, alpha: 245 },
  },
  /** :632-634 — the comet. Three draws at t, t-0.035, t-0.07 with falling strength.
   *  ~145ms of travel at 20fps: a tail, not a dotted line. */
  trail: [
    { offset: 0, strength: 1 },
    { offset: -0.035, strength: 0.72 },
    { offset: -0.07, strength: 0.44 },
  ],
  /** :606-610 — the ring is a shockwave, not an outline: brightest and tightest at the
   *  card edge, dissolving outward. alpha = 70 + 70*sin(phase), floored at 25. */
  pulseRing: {
    grows: [0, 4, 8],
    widths: [2, 2, 1],
    baseRadius: 12,
    alphaBase: 70,
    alphaSwing: 70,
    alphaFloor: 25,
    alphaFalloffPerGrow: 8,
  },
  /** :635-647 — ONE region lit at a time, advancing every 6 frames. At 20fps that is
   *  300ms, and the walk is a guided tour of the figure. This is the reading-order
   *  teacher, and archify's chapter rail is the same instrument. */
  readingCursor: { stepMs: 300, oneAtATime: true },
  /** :14-15, :661 — 41 frames @ 20fps = 2.05s, and `phase = progress * tau * 2` gives
   *  two breaths per loop, ~1Hz. Note 2050ms is UNDER MOTION_BUDGET.minLoopCycle
   *  (3000ms), so a Lanshu-faithful loop must be slowed to clear the law's own floor —
   *  recorded rather than silently retimed. */
  loop: { frames: 41, fps: 20, cycleMs: 2050, breathsPerCycle: 2 },
} as const

/** The law's floor wins over Lanshu's native cadence. Stated, not hidden. */
export const LANSHU_LOOP_MS = Math.max(LANSHU.loop.cycleMs, MOTION_BUDGET.minLoopCycle)

// ── archify's Reading Depth — the fourth seat's contribution ───────────────────
/**
 * template.html:4130-4181. Three levels tied to zoom, carried as `data-detail-level`.
 * Elements tag themselves `data-detail="context"` (sublabels, edge labels) or
 * `"fine"` (tags, ordinals). Crucially NOTHING MOVES — the only transform is an 8px
 * nudge on `[data-detail-anchor]` so a primary label re-centres when its sublabel goes.
 *
 * The override is the part worth having: focus, hover, lens, route and reach all reveal
 * their exact matches at ANY scale. archify's own phrasing, and it is the whole
 * philosophy in six words — "reader intent outranks the global zoom level."
 */
export const READING_DEPTH = {
  levels: ["map", "read", "full"] as const,
  /** below 100% → map · 100% → read · 175% → full (viewer-runtime.md:8) */
  thresholds: { map: 1, full: 1.75 },
  hides: { map: ["context", "fine"], read: ["fine"], full: [] as string[] },
  anchorNudgePx: 8,
  transitionMs: 160,
  intentOverridesDepth: true,
} as const

export type ReadingDepth = (typeof READING_DEPTH.levels)[number]

export function depthForZoom(zoom: number): ReadingDepth {
  if (zoom >= READING_DEPTH.thresholds.full) return "full"
  if (zoom >= READING_DEPTH.thresholds.map) return "read"
  return "map"
}

/**
 * The Motion Governor (archify :938-1000). Static is the DEFAULT; six conditions kill
 * motion outright. Returned as a reason rather than a boolean so a surface can say WHY
 * it is still — the harvest's point that reduced-motion is a designed state, not a
 * blunt `animation: none`.
 */
export interface GovernorInput {
  mode: MotionMode
  still?: boolean
  embedded?: boolean
  printing?: boolean
  documentHidden?: boolean
  sharePlayback?: boolean
  reducedMotion?: boolean
}

export function motionCapable(i: GovernorInput): { capable: boolean; reason?: string } {
  if (i.mode === "none") return { capable: false, reason: "mode=none" }
  if (i.still) return { capable: false, reason: "Live/Still toggle is Still" }
  if (i.embedded) return { capable: false, reason: "embed mode" }
  if (i.printing) return { capable: false, reason: "print" }
  if (i.documentHidden) return { capable: false, reason: "document hidden" }
  if (i.sharePlayback) return { capable: false, reason: "share playback owns the budget" }
  if (i.reducedMotion) return { capable: false, reason: "prefers-reduced-motion" }
  return { capable: true }
}

/** Lanshu's breathing is licensed ONLY in loop — the animated-vs-static ruling, computed. */
export function breathingAllowed(i: GovernorInput): boolean {
  return i.mode === "loop" && motionCapable(i).capable
}
