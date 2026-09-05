#!/usr/bin/env bash
# ============================================================================
# spectrum-walk.sh -- the ICM long-form runner (Spectrum, re-founded on ICM)
# ----------------------------------------------------------------------------
# Replaces the retired Ralph-loop spectrum.sh. It carries NONE of its machinery
# -- no MAX_ITERATIONS, no lockfile-signal, no state-verification, no story
# queue. In ICM the filesystem IS the state machine (invariant 9): a stage is
# done when its output exists, and a file cannot lie -- so the old script's
# compensating complexity is simply unnecessary here.
#
# WHAT IT DOES
#   Walks an ICM workspace: numbered stage folders (01_*, 02_*, ...), each with
#   a CONTEXT.md contract (authored by spectrum-architect) and an output/ dir.
#   For each stage in order it runs ONE fresh agent that reads only that stage's
#   contract + the inputs the contract names (invariant 7: 2-8k tokens/step),
#   writes into the stage's output/, and advances the moment that output exists.
#
# LONG FORM
#   Unattended by default: it walks every stage in one long run (overnight) --
#   the ICM-native replacement for the loop's one real job, autonomous runs.
#   Each stage is a fresh, bounded agent; nothing is ever "reloaded".
#
# Usage:  spectrum-walk [workspace-dir]
#   workspace-dir  a dir of numbered stage folders (default: current dir).
#
# Env:
#   SPECTRUM_SUPERVISED=1   pause at each stage's edit surface (invariant 6) for
#                           the human to read/edit the output before advancing.
#                           Unset (default) = long-form, walk unattended.
#   SPECTRUM_MODEL          model for each stage agent (default: claude's default)
#   SPECTRUM_CLAUDE         path to the claude binary (default: `claude` on PATH)
#
# Requires: bash (Git Bash / WSL / macOS / Linux) and the claude CLI.
# ============================================================================

set -euo pipefail

WORKSPACE="${1:-$(pwd)}"
[ -d "$WORKSPACE" ] || { echo "spectrum-walk: no such workspace: $WORKSPACE" >&2; exit 1; }
WORKSPACE="$(cd "$WORKSPACE" && pwd)"

CLAUDE="${SPECTRUM_CLAUDE:-claude}"
SUPERVISED="${SPECTRUM_SUPERVISED:-}"
LOG="$WORKSPACE/.spectrum-walk.log"

log(){ printf '%s  %s\n' "$(date -Is 2>/dev/null || date)" "$*" | tee -a "$LOG" >&2; }

# A stage is DONE when its output/ exists and is non-empty. The filesystem is
# the state machine -- this is the ONLY advance condition. No signal, no status.
stage_done(){ [ -d "$1/output" ] && [ -n "$(ls -A "$1/output" 2>/dev/null || true)" ]; }

# Discover numbered stage folders (NN_*) in lexical order -- numbering encodes
# order (invariant 3). Renaming folders reorders the walk; that is the point.
stages=()
while IFS= read -r d; do stages+=("$d"); done < <(find "$WORKSPACE" -maxdepth 1 -type d -name '[0-9][0-9]_*' | sort)
[ "${#stages[@]}" -gt 0 ] || { echo "spectrum-walk: no numbered stage folders (NN_*) in $WORKSPACE" >&2; exit 1; }

mode=$([ -n "$SUPERVISED" ] && echo "supervised" || echo "long-form")
log "WALK-START ${#stages[@]} stages | mode=$mode | workspace=$WORKSPACE"

for stage in "${stages[@]}"; do
  name="$(basename "$stage")"
  contract="$stage/CONTEXT.md"

  if [ ! -f "$contract" ]; then log "SKIP $name (no CONTEXT.md contract)"; continue; fi
  if stage_done "$stage"; then log "DONE-ALREADY $name (output present -- resuming past it)"; continue; fi

  log "STAGE-START $name"
  mkdir -p "$stage/output"

  # Thin router prompt. The agent loads ONLY this stage's contract and the
  # inputs it names -- never the whole workspace, never other stages.
  prompt=$(cat <<EOF
You are executing ONE ICM stage, headless, with no user to answer questions.
Read and follow the stage contract at:
  $contract
It names your inputs (working + reference) and the outputs you must write.
Load ONLY what the contract names -- do NOT read other stage folders or the
whole workspace. Ground claims through Prism's discovery agents where available;
query, never photocopy whole files. Write your output artifact(s) into:
  $stage/output/
exactly as the contract's Outputs / Success criteria specify. Append the
contract's heartbeat tokens as you go. Do not ask questions. When the output
exists on disk, stop.
EOF
)

  model_flag=()
  [ -n "${SPECTRUM_MODEL:-}" ] && model_flag=(--model "$SPECTRUM_MODEL")

  # One fresh, bounded agent for this stage. Fresh session each stage is the ICM
  # posture -- never load it in the first place, rather than discard-and-retry.
  ( cd "$WORKSPACE" && "$CLAUDE" --dangerously-skip-permissions "${model_flag[@]}" -p "$prompt" ) >>"$LOG" 2>&1 \
    || log "STAGE-AGENT-EXIT nonzero for $name (verifying output regardless -- exit code is not the truth, the file is)"

  # Advance ONLY on output existence. If the stage produced nothing, stop the
  # walk cleanly -- a human reads the stage and re-runs. No blind retry.
  if stage_done "$stage"; then
    log "STAGE-OK $name (output present)"
  else
    log "STAGE-STALL $name -- no output produced. Stopping. A human reads $stage/ and re-runs spectrum-walk to resume here."
    exit 2
  fi

  # Every output is an edit surface (invariant 6). In supervised mode, hold here
  # so a person can open and edit the output before the next stage reads it.
  if [ -n "$SUPERVISED" ]; then
    if [ -t 0 ] || [ -e /dev/tty ]; then
      log "EDIT-SURFACE $name -- output in $stage/output/. Edit in place, then press Enter to advance."
      read -r _ </dev/tty 2>/dev/null || true
    else
      log "EDIT-SURFACE $name -- supervised but no TTY; advancing (attach a terminal to gate)."
    fi
  fi
done

log "WALK-COMPLETE all ${#stages[@]} stages have outputs -- the workspace is the record."
