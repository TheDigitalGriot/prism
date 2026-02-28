import React from "react"

/** File content viewer — placeholder for Phase 3. Real implementation in Phase 6. */
export const FileContentView: React.FC<{ filePath: string }> = ({ filePath }) => {
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
      <div style={{ fontSize: 20, color: "var(--prism-purple)" }}>📄</div>
      <div
        style={{
          fontSize: 12,
          fontFamily: "var(--prism-font-code)",
          color: "var(--prism-fg)",
        }}
      >
        {filePath}
      </div>
      <div style={{ fontSize: 11 }}>File content viewer — coming in Phase 6</div>
    </div>
  )
}
