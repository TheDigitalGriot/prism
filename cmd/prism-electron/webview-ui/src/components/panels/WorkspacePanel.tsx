import React from "react"
import { usePrismState } from "../../context/PrismStateContext"
import { CollapsibleSection } from "../common/CollapsibleSection"
import { StatusDot } from "../common/StatusDot"

// ---------------------------------------------------------------------------
// Mock agent data (wired to real state in future)
// ---------------------------------------------------------------------------

interface AgentStatus {
  name: string
  project: string
  status: "ACTIVE" | "THINKING" | "WAITING" | "DONE" | "PAUSED"
}

const MOCK_AGENTS: AgentStatus[] = [
  { name: "CLAUDE", project: "prism-test", status: "WAITING" },
]

const STATUS_CATEGORIES = [
  { label: "ACTIVE", color: "var(--prism-blue)" },
  { label: "THINKING", color: "var(--prism-teal)" },
  { label: "WAITING", color: "var(--prism-amber)" },
  { label: "DONE", color: "var(--prism-green)" },
  { label: "PAUSED", color: "var(--prism-fg)" },
] as const

const AGENT_STATUS_COLOR: Record<string, string> = {
  ACTIVE: "var(--prism-blue)",
  THINKING: "var(--prism-teal)",
  WAITING: "var(--prism-amber)",
  DONE: "var(--prism-green)",
  PAUSED: "var(--prism-fg-muted)",
}

// ---------------------------------------------------------------------------
// WorkspacePanel
// ---------------------------------------------------------------------------

export const WorkspacePanel: React.FC = () => {
  const state = usePrismState()

  const projectName = state.prismDir
    ? state.prismDir.replace(/\\/g, "/").split("/").pop() ?? "Unknown"
    : "No project"

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
      {/* Projects */}
      <CollapsibleSection title="Projects" defaultOpen>
        <div style={{ padding: "4px 12px" }}>
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 6,
              border: state.prismDir
                ? "1px solid var(--prism-teal)"
                : "1px solid var(--prism-border)",
              background: "rgba(255,255,255,0.02)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {/* Folder icon */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={state.prismDir ? "var(--prism-teal)" : "var(--prism-fg-muted)"}
              strokeWidth="1.5"
            >
              <path d="M3 7V17C3 18.1 3.9 19 5 19H19C20.1 19 21 18.1 21 17V9C21 7.9 20.1 7 19 7H11L9 5H5C3.9 5 3 5.9 3 7Z" />
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--prism-fg)" }}>
                {projectName}
              </div>
              {state.prismDir && (
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--prism-fg-disabled)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {state.prismDir}
                </div>
              )}
            </div>
            {state.prismDir && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: "var(--prism-teal)",
                  background: "var(--prism-teal)20",
                  padding: "2px 6px",
                  borderRadius: 3,
                  letterSpacing: "0.05em",
                }}
              >
                OPEN
              </span>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Agent Kanban */}
      <CollapsibleSection title="Agent Kanban" defaultOpen>
        <div style={{ padding: "4px 12px" }}>
          {/* Status category badges */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              marginBottom: 8,
            }}
          >
            {STATUS_CATEGORIES.map((cat) => (
              <span
                key={cat.label}
                style={{
                  fontSize: 8,
                  letterSpacing: "0.05em",
                  padding: "2px 5px",
                  borderRadius: 3,
                  background: cat.color + "20",
                  color: cat.color,
                  fontWeight: 600,
                }}
              >
                {cat.label}
              </span>
            ))}
          </div>

          {/* Agent cards */}
          {MOCK_AGENTS.map((agent) => {
            const color = AGENT_STATUS_COLOR[agent.status] ?? "var(--prism-fg-muted)"
            const isPulsing = agent.status === "ACTIVE" || agent.status === "THINKING"

            return (
              <div
                key={agent.name}
                style={{
                  padding: 10,
                  borderRadius: 6,
                  border: "1px solid var(--prism-border)",
                  background: "rgba(255,255,255,0.02)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <StatusDot
                  status={isPulsing ? "running" : agent.status === "DONE" ? "complete" : "pending"}
                />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--prism-fg)" }}>
                    {agent.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--prism-fg-muted)" }}>
                    {agent.project}
                  </div>
                </div>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 10,
                    color,
                  }}
                >
                  {agent.status}
                </span>
              </div>
            )
          })}
        </div>
      </CollapsibleSection>
    </div>
  )
}
