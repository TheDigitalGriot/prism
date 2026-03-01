/**
 * Domain types — mirror of cmd/prism-cli/domain/story.go
 * Shared between prism-core (PrismState) and prism-vscode (stories.ts, stories-tree.ts).
 */

/** Metadata and configuration for a Spectrum execution plan. */
export interface Plan {
  name: string
  source: string
  createdAt?: string
  qualityGates: string[]
}

/** A file that a story creates, modifies, or deletes. */
export interface StoryFile {
  path: string
  action: "create" | "modify" | "delete"
}

/** A single implementation step within a story. */
export interface Step {
  description: string
  done: boolean
}

/** A single executable Spectrum story. */
export interface Story {
  id: string
  title: string
  description: string
  priority: number
  /** "pending" | "in_progress" | "complete" */
  status: string
  blockedBy: string | null
  files: StoryFile[]
  steps: Step[]
  completedAt?: string
  commitHash?: string
}

/** Root structure of stories.json. */
export interface StoriesFile {
  plan: Plan
  stories: Story[]
}
