import * as fs from "fs/promises"
import type { Plan, StoryFile, Step, Story, StoriesFile } from "@prism-core/prism/types"

// Re-export types for consumers of this module
export type { Plan, StoryFile, Step, Story, StoriesFile }

// ---------------------------------------------------------------------------
// Dependency resolution
// ---------------------------------------------------------------------------

/**
 * Returns true if the story is blocked by an incomplete dependency.
 * Mirrors Story.IsBlocked(stories []Story) in Go.
 */
export function isBlocked(story: Story, stories: Story[]): boolean {
  if (story.blockedBy === null || story.blockedBy === undefined) {
    return false
  }
  for (const other of stories) {
    if (other.id === story.blockedBy) {
      return other.status !== "complete"
    }
  }
  // Blocking story not found — assume not blocked
  return false
}

// ---------------------------------------------------------------------------
// StoriesFile operations
// ---------------------------------------------------------------------------

/**
 * Returns the next story to execute (lowest priority, not blocked, not complete).
 * Returns null if no stories are available.
 * Mirrors StoriesFile.GetNextStory() in Go.
 */
export function getNextStory(sf: StoriesFile): Story | null {
  const candidates = sf.stories.filter(
    (s) => s.status !== "complete" && !isBlocked(s, sf.stories),
  )
  if (candidates.length === 0) {
    return null
  }
  candidates.sort((a, b) => a.priority - b.priority)
  return candidates[0]
}

/** Number of completed stories. */
export function completedCount(sf: StoriesFile): number {
  return sf.stories.filter((s) => s.status === "complete").length
}

/** Number of non-complete stories. */
export function remainingCount(sf: StoriesFile): number {
  return sf.stories.length - completedCount(sf)
}

/** True if all stories are complete. */
export function allComplete(sf: StoriesFile): boolean {
  return remainingCount(sf) === 0
}

/** Update a story's status to "complete" and mark all steps done. */
export function markStoryComplete(
  sf: StoriesFile,
  storyID: string,
  commitHash: string,
): void {
  for (const story of sf.stories) {
    if (story.id === storyID) {
      story.status = "complete"
      story.commitHash = commitHash
      for (const step of story.steps) {
        step.done = true
      }
      return
    }
  }
}

/** Update a story's status to "in_progress". */
export function markStoryInProgress(sf: StoriesFile, storyID: string): void {
  for (const story of sf.stories) {
    if (story.id === storyID) {
      story.status = "in_progress"
      return
    }
  }
}

/** Find a story by its ID. Returns undefined if not found. */
export function getStoryByID(sf: StoriesFile, id: string): Story | undefined {
  return sf.stories.find((s) => s.id === id)
}

// ---------------------------------------------------------------------------
// File I/O
// ---------------------------------------------------------------------------

/** Read and parse a stories.json file from disk. */
export async function loadStoriesFile(path: string): Promise<StoriesFile> {
  const data = await fs.readFile(path, "utf-8")
  return JSON.parse(data) as StoriesFile
}

/** Write a stories file back to disk with 2-space indentation. */
export async function saveStoriesFile(
  sf: StoriesFile,
  path: string,
): Promise<void> {
  const data = JSON.stringify(sf, null, 2)
  await fs.writeFile(path, data, "utf-8")
}
