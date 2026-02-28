import React from "react"

/** Git commit graph — placeholder for Phase 3. Real implementation in Phase 6. */
export const GitGraphView: React.FC = () => {
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
      <div style={{ fontSize: 20, color: "var(--prism-amber)" }}>🔀</div>
      <div style={{ fontSize: 13, fontWeight: 600 }}>Git Graph</div>
      <div style={{ fontSize: 11 }}>Commit graph — coming in Phase 6</div>
    </div>
  )
}
