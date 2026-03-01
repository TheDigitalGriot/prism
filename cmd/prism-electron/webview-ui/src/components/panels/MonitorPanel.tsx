import React from "react"
import { usePrismState } from "@prism-ui/context/PrismStateContext"
import { CollapsibleSection } from "../common/CollapsibleSection"
import { StatusDot } from "../common/StatusDot"

// ---------------------------------------------------------------------------
// MonitorPanel
// ---------------------------------------------------------------------------

export const MonitorPanel: React.FC = () => {
  const state = usePrismState()
  const { spectrum, stories, plan } = state

  const isRunning = spectrum.executionState === "running"
  const statusLabel = isRunning ? "Prism: Running" : "Prism: Idle"
  const statusDotStatus = isRunning ? "running" as const : "complete" as const

  const completedStories = stories.filter((s) => s.status === "complete")

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
      {/* System Health */}
      <CollapsibleSection title="System Health" defaultOpen>
        <div style={{ padding: "6px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <StatusDot status={statusDotStatus} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--prism-fg)" }}>
              {statusLabel}
            </span>
          </div>
          <div style={{ fontSize: 10.5, color: "var(--prism-fg-disabled)" }}>
            Last refresh: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </CollapsibleSection>

      {/* Execution History */}
      <CollapsibleSection
        title="Execution History"
        defaultOpen
        badge={completedStories.length || undefined}
      >
        {completedStories.length === 0 ? (
          <div
            style={{
              padding: "8px 12px",
              fontSize: 11,
              color: "var(--prism-fg-disabled)",
              textAlign: "center",
            }}
          >
            No completed stories
          </div>
        ) : (
          completedStories.map((story) => (
            <div
              key={story.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 12px",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--prism-bg-hover)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent"
              }}
            >
              <StatusDot status="complete" size={6} />
              <span
                style={{
                  fontSize: 10,
                  color: "var(--prism-fg-muted)",
                  flexShrink: 0,
                }}
              >
                {story.id}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--prism-fg)",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {story.title}
              </span>
            </div>
          ))
        )}
      </CollapsibleSection>

      {/* Quality Gates */}
      <CollapsibleSection title="Quality Gates" defaultOpen={false}>
        {plan?.qualityGates && plan.qualityGates.length > 0 ? (
          <div style={{ padding: "4px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
            {plan.qualityGates.map((gate, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 8px",
                  borderRadius: 4,
                  border: "1px solid var(--prism-border)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "var(--prism-fg-disabled)",
                    background: "rgba(255,255,255,0.05)",
                    padding: "1px 5px",
                    borderRadius: 3,
                  }}
                >
                  —
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--prism-fg-muted)",
                    fontFamily: "var(--prism-font-code)",
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {gate}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "4px 12px", fontSize: 11, color: "var(--prism-fg-disabled)" }}>
            No quality gates defined
          </div>
        )}
      </CollapsibleSection>
    </div>
  )
}
