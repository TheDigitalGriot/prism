/**
 * Dynamic system prompt builder.
 *
 * Composes the base Prism context with phase-specific instructions
 * and workspace state to create a tailored system prompt per request.
 */
import { WorkflowPhase } from "@prism-core/shared/types"
import { WorkflowContext } from "@prism-core/core/controller/prism/workflow"
import { RESEARCH_PHASE_INSTRUCTIONS } from "./phase-research"
import { PLAN_PHASE_INSTRUCTIONS } from "./phase-plan"
import { IMPLEMENT_PHASE_INSTRUCTIONS } from "./phase-implement"
import { VALIDATE_PHASE_INSTRUCTIONS } from "./phase-validate"

export interface SystemPromptContext {
  workflowPhase: WorkflowPhase
  workflowContext?: WorkflowContext
  workspaceRoot?: string
  prismDir?: string
  hasPrismDir: boolean
  hasStoriesJson: boolean
}

const BASE_PROMPT = `You are Prism, an AI coding assistant specialized in the Prism 4-phase development workflow (Research → Plan → Implement → Validate).

## Core Identity
- You help developers build software systematically through deliberate phases
- You always know which phase you're in and adapt your behavior accordingly
- You prefer reading existing code before making changes
- You communicate clearly about what you're doing and why

## Working Environment
You have access to the user's workspace. You can read files, write files, execute commands, and search for patterns.

## General Principles
- Be concise in your explanations, verbose in your code
- Show your reasoning when it matters, skip it when it's obvious
- When uncertain, ask rather than assume
- Prefer targeted edits over full rewrites`

const IDLE_PROMPT = `## Current Mode: Interactive Assistant

You are available for general coding assistance. You can help with:
- Answering code questions
- Debugging issues
- Code review
- Starting the Prism workflow phases

To start a workflow phase, the user can click the phase buttons or ask you to begin Research, Plan, Implement, or Validate.`

function getPhaseInstructions(phase: WorkflowPhase): string {
  switch (phase) {
    case WorkflowPhase.Research:
      return RESEARCH_PHASE_INSTRUCTIONS
    case WorkflowPhase.Plan:
      return PLAN_PHASE_INSTRUCTIONS
    case WorkflowPhase.Implement:
      return IMPLEMENT_PHASE_INSTRUCTIONS
    case WorkflowPhase.Validate:
      return VALIDATE_PHASE_INSTRUCTIONS
    case WorkflowPhase.Idle:
    default:
      return IDLE_PROMPT
  }
}

function getWorkspaceContext(ctx: SystemPromptContext): string {
  const parts: string[] = []

  if (ctx.workspaceRoot) {
    parts.push(`**Workspace root**: \`${ctx.workspaceRoot}\``)
  }

  if (ctx.hasPrismDir && ctx.prismDir) {
    parts.push(`**Prism directory**: \`${ctx.prismDir}\` (detected)`)
  } else {
    parts.push(`**Prism directory**: not yet initialized (use \`initPrism\` to set up)`)
  }

  if (ctx.hasStoriesJson) {
    parts.push(`**stories.json**: present — Spectrum execution is available`)
  }

  if (ctx.workflowContext?.researchDoc) {
    parts.push(`**Active research**: \`${ctx.workflowContext.researchDoc}\``)
  }

  if (ctx.workflowContext?.activePlan) {
    parts.push(`**Active plan**: \`${ctx.workflowContext.activePlan}\``)
  }

  if (ctx.workflowContext?.activeStoryId) {
    parts.push(`**Active story**: ${ctx.workflowContext.activeStoryId}`)
  }

  return parts.length > 0
    ? `## Workspace Context\n${parts.join("\n")}`
    : ""
}

/**
 * Build the complete system prompt for a given workflow phase and context.
 */
export function buildSystemPrompt(ctx: SystemPromptContext): string {
  const sections = [
    BASE_PROMPT,
    getPhaseInstructions(ctx.workflowPhase),
    getWorkspaceContext(ctx),
  ].filter(Boolean)

  return sections.join("\n\n---\n\n")
}
