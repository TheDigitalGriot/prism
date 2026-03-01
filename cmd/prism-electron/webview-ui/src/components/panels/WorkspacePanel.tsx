import React, { useCallback, useEffect, useState } from "react"
import { usePrismState } from "@prism-ui/context/PrismStateContext"
import { CollapsibleSection } from "../common/CollapsibleSection"
import { StatusDot } from "../common/StatusDot"

// ---------------------------------------------------------------------------
// Types (mirrors packages/prism-core/src/workspace/types.ts)
// ---------------------------------------------------------------------------

interface EpicInfo {
  name: string
  storiesPath: string
  storyCount: number
  completedCount: number
}

interface ProjectInfo {
  name: string
  path: string
  branch: string
  storiesTotal: number
  storiesComplete: number
  epics: EpicInfo[]
  isCurrent: boolean
}

interface WorktreeInfo {
  path: string
  branch: string
  head: string
  isBare: boolean
  isMain: boolean
  prunable: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ProgressBar({ total, complete }: { total: number; complete: number }) {
  const pct = total > 0 ? Math.round((complete / total) * 100) : 0
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          flex: 1,
          height: 3,
          borderRadius: 2,
          background: "var(--prism-border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 2,
            background: pct === 100 ? "var(--prism-green)" : "var(--prism-teal)",
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <span style={{ fontSize: 9, color: "var(--prism-fg-disabled)", minWidth: 28, textAlign: "right" }}>
        {complete}/{total}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// WorkspacePanel
// ---------------------------------------------------------------------------

export const WorkspacePanel: React.FC = () => {
  const state = usePrismState()

  const [projects, setProjects] = useState<ProjectInfo[]>([])
  const [worktrees, setWorktrees] = useState<WorktreeInfo[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [loadingWorktrees, setLoadingWorktrees] = useState(false)
  const [addingWorkspace, setAddingWorkspace] = useState(false)

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true)
    try {
      const result = (await window.electronAPI.invoke("prism:discoverProjects")) as ProjectInfo[]
      setProjects(Array.isArray(result) ? result : [])
    } catch {
      setProjects([])
    } finally {
      setLoadingProjects(false)
    }
  }, [])

  const loadWorktrees = useCallback(async () => {
    setLoadingWorktrees(true)
    try {
      const result = (await window.electronAPI.invoke("prism:listWorktrees")) as WorktreeInfo[]
      setWorktrees(Array.isArray(result) ? result : [])
    } catch {
      setWorktrees([])
    } finally {
      setLoadingWorktrees(false)
    }
  }, [])

  // Load on mount and when prismDir changes (new project opened)
  useEffect(() => {
    void loadProjects()
    void loadWorktrees()
  }, [loadProjects, loadWorktrees, state.prismDir])

  // Subscribe to file changes that might affect workspace/worktrees
  useEffect(() => {
    const unsub = window.electronAPI.on("prism:fileChange", () => {
      void loadProjects()
    })
    return unsub
  }, [loadProjects])

  const handleAddWorkspace = useCallback(async () => {
    setAddingWorkspace(true)
    try {
      const result = (await window.electronAPI.invoke("prism:browseAndAddWorkspace")) as {
        ok: boolean
        path?: string
      }
      if (result.ok) {
        void loadProjects()
      }
    } finally {
      setAddingWorkspace(false)
    }
  }, [loadProjects])

  const handleOpenProject = useCallback(async (projectPath: string) => {
    await window.electronAPI.invoke("prism:openProject")
    // Note: openProject shows a dialog; direct path opening can be added when needed
    void loadProjects()
    void loadWorktrees()
  }, [loadProjects, loadWorktrees])

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

      {/* Projects */}
      <CollapsibleSection title="Projects" defaultOpen>
        <div style={{ padding: "4px 12px" }}>
          {loadingProjects ? (
            <div style={{ fontSize: 11, color: "var(--prism-fg-disabled)", padding: "8px 0" }}>
              Discovering projects…
            </div>
          ) : projects.length === 0 ? (
            <div style={{ fontSize: 11, color: "var(--prism-fg-disabled)", padding: "8px 0" }}>
              No projects found. Open a project or add a workspace.
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.path}
                style={{
                  padding: "10px 12px",
                  borderRadius: 6,
                  border: project.isCurrent
                    ? "1px solid var(--prism-teal)"
                    : "1px solid var(--prism-border)",
                  background: project.isCurrent
                    ? "rgba(var(--prism-teal-rgb, 0,200,180),0.04)"
                    : "rgba(255,255,255,0.02)",
                  marginBottom: 6,
                }}
              >
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={project.isCurrent ? "var(--prism-teal)" : "var(--prism-fg-muted)"}
                    strokeWidth="1.5"
                    style={{ flexShrink: 0 }}
                  >
                    <path d="M3 7V17C3 18.1 3.9 19 5 19H19C20.1 19 21 18.1 21 17V9C21 7.9 20.1 7 19 7H11L9 5H5C3.9 5 3 5.9 3 7Z" />
                  </svg>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "var(--prism-fg)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {project.name}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--prism-fg-disabled)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {project.path}
                    </div>
                  </div>
                  {project.isCurrent && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: "var(--prism-teal)",
                        background: "var(--prism-teal)20",
                        padding: "2px 6px",
                        borderRadius: 3,
                        letterSpacing: "0.05em",
                        flexShrink: 0,
                      }}
                    >
                      OPEN
                    </span>
                  )}
                </div>

                {/* Branch + stories */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--prism-fg-muted)",
                      fontFamily: "monospace",
                      background: "rgba(255,255,255,0.05)",
                      padding: "1px 5px",
                      borderRadius: 3,
                    }}
                  >
                    {project.branch}
                  </span>
                  {project.storiesTotal > 0 && (
                    <span style={{ fontSize: 10, color: "var(--prism-fg-disabled)" }}>
                      {project.storiesComplete}/{project.storiesTotal} stories
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {project.storiesTotal > 0 && (
                  <ProgressBar total={project.storiesTotal} complete={project.storiesComplete} />
                )}

                {/* Epics */}
                {project.epics.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    {project.epics.map((epic) => (
                      <div
                        key={epic.name}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 3,
                          paddingLeft: 4,
                        }}
                      >
                        <span style={{ fontSize: 10, color: "var(--prism-fg-muted)", flex: 1 }}>
                          {epic.name}
                        </span>
                        <span style={{ fontSize: 9, color: "var(--prism-fg-disabled)" }}>
                          {epic.completedCount}/{epic.storyCount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Add Workspace button */}
          <button
            onClick={() => void handleAddWorkspace()}
            disabled={addingWorkspace}
            style={{
              width: "100%",
              marginTop: 4,
              padding: "6px 10px",
              borderRadius: 5,
              border: "1px dashed var(--prism-border)",
              background: "transparent",
              color: "var(--prism-fg-muted)",
              fontSize: 11,
              cursor: addingWorkspace ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
            {addingWorkspace ? "Adding…" : "Add Workspace"}
          </button>

          {/* Refresh button */}
          <button
            onClick={() => void loadProjects()}
            style={{
              width: "100%",
              marginTop: 4,
              padding: "4px 10px",
              borderRadius: 5,
              border: "none",
              background: "transparent",
              color: "var(--prism-fg-disabled)",
              fontSize: 10,
              cursor: "pointer",
              letterSpacing: "0.03em",
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </CollapsibleSection>

      {/* Worktrees */}
      <CollapsibleSection title="Worktrees" defaultOpen={false}>
        <div style={{ padding: "4px 12px" }}>
          {loadingWorktrees ? (
            <div style={{ fontSize: 11, color: "var(--prism-fg-disabled)", padding: "8px 0" }}>
              Loading worktrees…
            </div>
          ) : worktrees.length === 0 ? (
            <div style={{ fontSize: 11, color: "var(--prism-fg-disabled)", padding: "8px 0" }}>
              No worktrees found. Open a git project to see worktrees.
            </div>
          ) : (
            worktrees.map((wt) => (
              <div
                key={wt.path}
                style={{
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: wt.isMain
                    ? "1px solid var(--prism-teal)"
                    : "1px solid var(--prism-border)",
                  background: "rgba(255,255,255,0.02)",
                  marginBottom: 5,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: "monospace",
                      color: wt.isMain ? "var(--prism-teal)" : "var(--prism-fg)",
                      fontWeight: wt.isMain ? 600 : 400,
                    }}
                  >
                    {wt.branch}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontFamily: "monospace",
                      color: "var(--prism-fg-disabled)",
                      background: "rgba(255,255,255,0.05)",
                      padding: "1px 4px",
                      borderRadius: 2,
                    }}
                  >
                    {wt.head}
                  </span>
                  {wt.isMain && (
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 600,
                        color: "var(--prism-teal)",
                        background: "var(--prism-teal)20",
                        padding: "1px 5px",
                        borderRadius: 3,
                        letterSpacing: "0.04em",
                      }}
                    >
                      MAIN
                    </span>
                  )}
                  {wt.prunable && (
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 600,
                        color: "var(--prism-amber)",
                        background: "var(--prism-amber)20",
                        padding: "1px 5px",
                        borderRadius: 3,
                        letterSpacing: "0.04em",
                      }}
                    >
                      PRUNABLE
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: "var(--prism-fg-disabled)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontFamily: "monospace",
                  }}
                >
                  {wt.path}
                </div>
              </div>
            ))
          )}

          <button
            onClick={() => void loadWorktrees()}
            style={{
              width: "100%",
              marginTop: 4,
              padding: "4px 10px",
              borderRadius: 5,
              border: "none",
              background: "transparent",
              color: "var(--prism-fg-disabled)",
              fontSize: 10,
              cursor: "pointer",
              letterSpacing: "0.03em",
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </CollapsibleSection>
    </div>
  )
}
