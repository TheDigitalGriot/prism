import React from "react"

/** Story detail view — placeholder for Phase 3. Real implementation in Phase 6. */
export const StoryDetailView: React.FC<{ storyId: string }> = ({ storyId }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 8,
        color: "var(--prism-fg-muted)",
      }}
    >
      <div style={{ fontSize: 20, color: "var(--prism-teal)" }}>📋</div>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{storyId}</div>
      <div style={{ fontSize: 11 }}>Story detail view — coming in Phase 6</div>
    </div>
  )
}
