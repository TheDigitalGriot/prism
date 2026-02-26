import React, { useEffect } from "react"
import { usePrismState } from "./context/PrismStateContext"
import { ChatView } from "./views/ChatView"

// ---------------------------------------------------------------------------
// Loading screen
// ---------------------------------------------------------------------------

const LoadingView: React.FC = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      color: "var(--vscode-descriptionForeground)",
      fontSize: "13px",
    }}
  >
    Loading Prism…
  </div>
)

// ---------------------------------------------------------------------------
// App root
// ---------------------------------------------------------------------------

export const App: React.FC = () => {
  const state = usePrismState()

  // Listen for command messages from extension host (e.g. phase changes triggered by keybindings)
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data as { type: string; command?: string; payload?: unknown }
      if (msg?.type === "command") {
        console.log("[Prism] Received command:", msg.command, msg.payload)
        // Future: dispatch to command handler
      }
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [])

  // Hydration loading state
  if (!state.isHydrated) {
    return <LoadingView />
  }

  // Main view — ChatView is always shown (Phase 3+)
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "var(--vscode-sideBar-background)",
        color: "var(--vscode-foreground)",
        fontFamily: "var(--vscode-font-family)",
        fontSize: "var(--vscode-font-size, 13px)",
      }}
    >
      <ChatView />
    </div>
  )
}
