/**
 * Spectrum Execution Engine — Phase 6 implementation.
 *
 * Full state machine for autonomous story-by-story execution,
 * mirroring the shell-based spectrum.sh loop in a VS Code-native form.
 *
 * States:
 *   idle          → not running
 *   running       → actively executing an iteration
 *   paused        → loop suspended, waiting for resume
 *   complete      → all stories finished
 *   maxIterations → hit the iteration cap
 *   error         → too many consecutive errors
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SpectrumExecutionState =
  | "idle"
  | "running"
  | "paused"
  | "complete"
  | "maxIterations"
  | "error"

export interface LogEntry {
  ts: number
  level: "info" | "warn" | "error"
  message: string
}

export interface SpectrumActivity {
  toolName: string
  description: string
  ts: number
}

/** Full Spectrum state — serialized to JSON and broadcast to the webview. */
export interface SpectrumState {
  executionState: SpectrumExecutionState
  currentIteration: number
  maxIterations: number
  /** The story currently being executed (null when idle / between iterations). */
  currentStoryId: string | null
  /** 0–100 based on completed / total stories. */
  progress: number
  /** Milliseconds elapsed since execution started (updated every second). */
  elapsedMs: number
  /** Unix timestamp when execution started, null if never started. */
  startedAt: number | null
  /** Number of consecutive errors without a successful completion. */
  consecutiveErrors: number
  /** Signal type from the last iteration. */
  lastSignalType: string
  /** Signal content/reason from the last iteration. */
  lastSignalContent: string
  /** Recent tool activities (last 50). */
  recentActivities: SpectrumActivity[]
  /** Execution log (last 200 entries). */
  logs: LogEntry[]
}

export const DEFAULT_SPECTRUM_STATE: SpectrumState = {
  executionState: "idle",
  currentIteration: 0,
  maxIterations: 50,
  currentStoryId: null,
  progress: 0,
  elapsedMs: 0,
  startedAt: null,
  consecutiveErrors: 0,
  lastSignalType: "none",
  lastSignalContent: "",
  recentActivities: [],
  logs: [],
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface SpectrumConfig {
  /** Maximum number of iterations before stopping. */
  maxIterations: number
  /** Milliseconds to pause between iterations. */
  pauseMs: number
  /** Log extra output during execution. */
  verbose: boolean
  /** Maximum consecutive errors before entering error state. */
  maxConsecutiveErrors: number
}

export const DEFAULT_SPECTRUM_CONFIG: SpectrumConfig = {
  maxIterations: 50,
  pauseMs: 2000,
  verbose: false,
  maxConsecutiveErrors: 3,
}

// ---------------------------------------------------------------------------
// SpectrumEngine
// ---------------------------------------------------------------------------

/**
 * Manages Spectrum execution state and transitions.
 *
 * The engine is responsible for tracking state; the actual story execution
 * loop lives in the PrismController which calls the SpectrumRunner.
 */
export class SpectrumEngine {
  private _state: SpectrumState
  private _config: SpectrumConfig
  private _onStateChange: (state: SpectrumState) => void
  private _elapsedTimer: ReturnType<typeof setInterval> | null = null

  constructor(
    config: Partial<SpectrumConfig> = {},
    onStateChange: (state: SpectrumState) => void,
  ) {
    this._config = { ...DEFAULT_SPECTRUM_CONFIG, ...config }
    this._state = {
      ...DEFAULT_SPECTRUM_STATE,
      maxIterations: this._config.maxIterations,
    }
    this._onStateChange = onStateChange
  }

  // -------------------------------------------------------------------------
  // Accessors
  // -------------------------------------------------------------------------

  get state(): SpectrumState {
    return { ...this._state }
  }

  get config(): SpectrumConfig {
    return { ...this._config }
  }

  get isRunning(): boolean {
    return this._state.executionState === "running"
  }

  get isPaused(): boolean {
    return this._state.executionState === "paused"
  }

  get isActive(): boolean {
    return this._state.executionState === "running" || this._state.executionState === "paused"
  }

  // -------------------------------------------------------------------------
  // State transitions
  // -------------------------------------------------------------------------

  /** Begin execution. Resets iteration count if starting fresh. */
  start(completedCount = 0, totalCount = 0): void {
    const isResume = this._state.executionState === "paused"
    const startedAt = isResume ? (this._state.startedAt ?? Date.now()) : Date.now()

    this._state = {
      ...this._state,
      executionState: "running",
      startedAt,
      progress: this._calcProgress(completedCount, totalCount),
      ...(isResume ? {} : { currentIteration: 0, consecutiveErrors: 0 }),
    }

    this._startTimer(startedAt)
    this._log("info", isResume ? "Spectrum: resumed" : "Spectrum: started")
    this._pushState()
  }

  /** Pause the execution loop. */
  pause(): void {
    if (this._state.executionState !== "running") return
    this._state = { ...this._state, executionState: "paused" }
    this._stopTimer()
    this._log("info", "Spectrum: paused")
    this._pushState()
  }

  /** Resume from paused state (delegates to start). */
  resume(completedCount = 0, totalCount = 0): void {
    if (this._state.executionState !== "paused") return
    this.start(completedCount, totalCount)
  }

  /** User-initiated stop — returns to idle. */
  stop(): void {
    this._state = {
      ...this._state,
      executionState: "idle",
      currentStoryId: null,
    }
    this._stopTimer()
    this._log("info", "Spectrum: stopped by user")
    this._pushState()
  }

  /** All stories complete. */
  complete(): void {
    this._state = { ...this._state, executionState: "complete", progress: 100, currentStoryId: null }
    this._stopTimer()
    this._log("info", "Spectrum: all stories complete!")
    this._pushState()
  }

  /** Reached the maximum iteration cap. */
  reachMaxIterations(): void {
    this._state = { ...this._state, executionState: "maxIterations", currentStoryId: null }
    this._stopTimer()
    this._log("warn", `Spectrum: reached max iterations (${this._config.maxIterations})`)
    this._pushState()
  }

  /** Enter error state (too many consecutive errors). */
  error(message: string): void {
    this._state = { ...this._state, executionState: "error", currentStoryId: null }
    this._stopTimer()
    this._log("error", `Spectrum error: ${message}`)
    this._pushState()
  }

  /** Reset to initial idle state. */
  reset(): void {
    this._stopTimer()
    this._state = {
      ...DEFAULT_SPECTRUM_STATE,
      maxIterations: this._config.maxIterations,
    }
    this._pushState()
  }

  // -------------------------------------------------------------------------
  // Iteration management
  // -------------------------------------------------------------------------

  /**
   * Increment the iteration counter.
   * Returns false (and transitions to maxIterations) if cap is exceeded.
   */
  incrementIteration(): boolean {
    const next = this._state.currentIteration + 1
    if (next > this._config.maxIterations) {
      this.reachMaxIterations()
      return false
    }
    this._state = { ...this._state, currentIteration: next }
    this._log("info", `Spectrum: iteration ${next}/${this._config.maxIterations}`)
    this._pushState()
    return true
  }

  /** Set the currently-executing story + recalculate progress. */
  setCurrentStory(storyId: string | null, completedCount: number, totalCount: number): void {
    this._state = {
      ...this._state,
      currentStoryId: storyId,
      progress: this._calcProgress(completedCount, totalCount),
    }
    this._pushState()
  }

  /** Record signal from last iteration + track consecutive error count. */
  recordSignal(type: string, content: string): void {
    const consecutiveErrors =
      type === "error"
        ? this._state.consecutiveErrors + 1
        : type === "complete" || type === "continue"
          ? 0
          : this._state.consecutiveErrors

    this._state = {
      ...this._state,
      lastSignalType: type,
      lastSignalContent: content,
      consecutiveErrors,
    }

    const snippet = content ? ` — ${content.slice(0, 80)}` : ""
    this._log("info", `Signal: ${type}${snippet}`)
    this._pushState()
  }

  /** Check whether we've exceeded the consecutive error threshold. */
  hasTooManyErrors(): boolean {
    return this._state.consecutiveErrors >= this._config.maxConsecutiveErrors
  }

  // -------------------------------------------------------------------------
  // Activity + logging
  // -------------------------------------------------------------------------

  /** Append a tool activity to the recent activities list (max 50). */
  addActivity(toolName: string, description: string): void {
    const activity: SpectrumActivity = { toolName, description, ts: Date.now() }
    const recentActivities = [...this._state.recentActivities, activity].slice(-50)
    this._state = { ...this._state, recentActivities }
    // don't _pushState on every activity — high frequency; let the timer handle it
  }

  /** Add a log entry (pushes state). */
  addLog(level: LogEntry["level"], message: string): void {
    this._log(level, message)
    this._pushState()
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  dispose(): void {
    this._stopTimer()
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private _calcProgress(completed: number, total: number): number {
    if (total === 0) return 0
    return Math.round((completed / total) * 100)
  }

  private _startTimer(startedAt: number): void {
    this._stopTimer()
    this._elapsedTimer = setInterval(() => {
      this._state = { ...this._state, elapsedMs: Date.now() - startedAt }
      this._pushState()
    }, 1000)
  }

  private _stopTimer(): void {
    if (this._elapsedTimer !== null) {
      clearInterval(this._elapsedTimer)
      this._elapsedTimer = null
    }
  }

  private _log(level: LogEntry["level"], message: string): void {
    const entry: LogEntry = { ts: Date.now(), level, message }
    // keep last 200 entries
    const logs = [...this._state.logs, entry].slice(-200)
    this._state = { ...this._state, logs }
  }

  private _pushState(): void {
    this._onStateChange({ ...this._state })
  }
}
