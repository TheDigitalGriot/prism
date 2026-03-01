import React from "react"
import { usePrismState } from "@prism-ui/context/PrismStateContext"
import { useLayout } from "../../context/LayoutContext"
import { CollapsibleSection } from "../common/CollapsibleSection"
import { StatusDot } from "../common/StatusDot"
import type { StatusDotStatus } from "../common/StatusDot"

// ---------------------------------------------------------------------------
// Helper — map story status string to StatusDot status
// ---------------------------------------------------------------------------

function toStatusDotStatus(s: string): StatusDotStatus {
  if (s === "complete") return "complete"
  if (s === "in_progress") return "in_progress"
  return "pending"
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

const PhaseProgressBar: React.FC<{ completedCount: number; totalCount: number }> = ({
  completedCount,
  totalCount,
}) => {
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  return (
    <div
      style={{
        height: 3,
        background: "var(--prism-border)",
        borderRadius: 2,
        overflow: "hidden",
        margin: "4px 0 6px",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: "linear-gradient(90deg, var(--prism-teal), var(--prism-green))",
          borderRadius: 2,
          transition: "width 0.3s ease",
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

export const StoriesPanel: React.FC = () => {
  const state = usePrismState()
  const layout = useLayout()

  const { stories, workflowPhase, plan, completedCount } = state
  const total = stories.length

  const PHASE_COLORS: Record<string, string> = {
    idle: "var(--prism-fg-muted)",
    research: "var(--prism-blue)",
    plan: "var(--prism-teal)",
    implement: "var(--prism-green)",
    validate: "var(--prism-amber)",
  }
  const phaseColor = PHASE_COLORS[workflowPhase] ?? "var(--prism-fg-muted)"

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Current Phase */}
      <CollapsibleSection title="Current Phase" defaultOpen>
        <div style={{ padding: "4px 12px 8px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: phaseColor,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {workflowPhase === "idle" ? "Idle" : workflowPhase}
            </span>
            <span style={{ fontSize: 10.5, color: "var(--prism-fg-muted)" }}>
              {completedCount}/{total} stories
            </span>
          </div>
          <PhaseProgressBar completedCount={completedCount} totalCount={total} />
          {plan && (
            <div
              style={{
                fontSize: 10.5,
                color: "var(--prism-fg-disabled)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {plan.name}
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Stories list */}
      <CollapsibleSection title="Stories" defaultOpen badge={total || undefined}>
        {stories.length === 0 ? (
          <div
            style={{
              padding: "12px",
              fontSize: 11,
              color: "var(--prism-fg-disabled)",
              textAlign: "center",
            }}
          >
            No stories loaded
          </div>
        ) : (
          stories.map((story) => {
            const doneSteps = story.steps.filter((s) => s.done).length
            const totalSteps = story.steps.length
            return (
              <button
                key={story.id}
                onClick={() =>
                  layout.openTab({
                    id: "story:" + story.id,
                    type: "story",
                    label: story.title,
                  })
                }
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  width: "100%",
                  padding: "6px 12px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--prism-bg-hover)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent"
                }}
              >
                <div style={{ paddingTop: 2, flexShrink: 0 }}>
                  <StatusDot status={toStatusDotStatus(story.status)} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: "var(--prism-fg-muted)",
                      marginBottom: 1,
                    }}
                  >
                    {story.id}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "var(--prism-fg)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {story.title}
                  </div>
                </div>
                {totalSteps > 0 && (
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--prism-fg-disabled)",
                      flexShrink: 0,
                      paddingTop: 2,
                    }}
                  >
                    {doneSteps}/{totalSteps}
                  </div>
                )}
              </button>
            )
          })
        )}
      </CollapsibleSection>

      {/* Research placeholder */}
      <CollapsibleSection title="Research" defaultOpen={false}>
        <div style={{ padding: "4px 12px", fontSize: 11, color: "var(--prism-fg-disabled)" }}>
          No research documents
        </div>
      </CollapsibleSection>

      {/* Plans placeholder */}
      <CollapsibleSection title="Plans" defaultOpen={false}>
        <div style={{ padding: "4px 12px", fontSize: 11, color: "var(--prism-fg-disabled)" }}>
          No plans
        </div>
      </CollapsibleSection>
    </div>
  )
}
