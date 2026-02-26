import React, { useState, useRef, useEffect, useCallback } from "react"
import { Virtuoso, VirtuosoHandle } from "react-virtuoso"
import { usePrismState, PrismChatMessage } from "../context/PrismStateContext"
import { ChatServiceClient } from "../services/grpc-client"
import { ChatRow } from "../components/chat/ChatRow"
import { ChatTextArea } from "../components/chat/ChatTextArea"
import { PhaseIndicator, PhaseTransition } from "../components/workflow/PhaseIndicator"

// ---------------------------------------------------------------------------
// ApiKeySetup — shown when no API key is configured
// ---------------------------------------------------------------------------

const ApiKeySetup: React.FC = () => {
  const [apiKey, setApiKey] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!apiKey.startsWith("sk-ant-") || apiKey.length < 20) {
      setError("Invalid API key format — must start with sk-ant-")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const result = await ChatServiceClient.setApiKey(apiKey)
      if (!result.ok) {
        setError(result.error ?? "Failed to save API key")
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: "24px",
        gap: "16px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "24px" }}>🔑</div>
      <div style={{ fontWeight: 600, fontSize: "14px" }}>Configure API Key</div>
      <div style={{ color: "var(--vscode-descriptionForeground)", fontSize: "12px", maxWidth: "300px" }}>
        Enter your Anthropic API key to use Prism chat. Keys are stored securely in VS Code's Secret Storage.
      </div>
      <div style={{ width: "100%", maxWidth: "320px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-..."
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid var(--vscode-input-border, #3c3c3c)",
            backgroundColor: "var(--vscode-input-background)",
            color: "var(--vscode-input-foreground)",
            fontSize: "13px",
            width: "100%",
            boxSizing: "border-box",
          }}
          onKeyDown={(e) => e.key === "Enter" && void handleSave()}
        />
        {error && (
          <div style={{ color: "#ef4444", fontSize: "11px" }}>{error}</div>
        )}
        <button
          onClick={() => void handleSave()}
          disabled={saving || !apiKey}
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "var(--vscode-button-background, #0e639c)",
            color: "var(--vscode-button-foreground, #fff)",
            cursor: saving || !apiKey ? "not-allowed" : "pointer",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          {saving ? "Saving…" : "Save API Key"}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// EmptyChat — shown when no messages yet
// ---------------------------------------------------------------------------

const EmptyChat: React.FC<{ phase: string }> = ({ phase }) => {
  const suggestions: Record<string, string[]> = {
    idle: [
      "What does this codebase do?",
      "Help me understand the architecture",
      "What are the main components?",
    ],
    research: [
      "Document the overall architecture",
      "Map out the data flow",
      "List all external dependencies",
    ],
    plan: [
      "Create an implementation plan for...",
      "What questions do we need to resolve?",
      "Review the research and propose next steps",
    ],
    implement: [
      "Load the current plan and start Phase 1",
      "Continue from where we left off",
      "What's the next step in the plan?",
    ],
    validate: [
      "Run all automated verification commands",
      "Check the implementation against the plan",
      "Generate a validation report",
    ],
  }

  const phaseSuggestions = suggestions[phase] ?? suggestions.idle

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: "24px",
        gap: "16px",
      }}
    >
      <div
        style={{
          fontSize: "28px",
          background: "linear-gradient(135deg, #3b82f6, #14b8a6, #22c55e)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontWeight: 700,
          letterSpacing: "0.1em",
        }}
      >
        PRISM
      </div>
      <div
        style={{
          color: "var(--vscode-descriptionForeground)",
          fontSize: "12px",
          textAlign: "center",
        }}
      >
        Ask anything, or try one of these:
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", maxWidth: "300px" }}>
        {phaseSuggestions.map((suggestion) => (
          <button
            key={suggestion}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid var(--vscode-widget-border, #3c3c3c)",
              backgroundColor: "var(--vscode-editor-background)",
              color: "var(--vscode-foreground)",
              cursor: "pointer",
              fontSize: "12px",
              textAlign: "left",
            }}
            onClick={() => {
              // Dispatch to parent via custom event
              window.dispatchEvent(new CustomEvent("prism-suggestion", { detail: suggestion }))
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ChatView — main chat interface
// ---------------------------------------------------------------------------

export const ChatView: React.FC = () => {
  const state = usePrismState()
  const [inputText, setInputText] = useState("")
  const [isAtBottom, setIsAtBottom] = useState(true)
  const virtuosoRef = useRef<VirtuosoHandle>(null)

  const messages = state.chatMessages
  const isStreaming = state.isChatStreaming
  const pendingApproval = state.pendingApprovalToolUseId

  // Listen for suggestion clicks from EmptyChat
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<string>
      setInputText(ce.detail)
    }
    window.addEventListener("prism-suggestion", handler)
    return () => window.removeEventListener("prism-suggestion", handler)
  }, [])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAtBottom && messages.length > 0) {
      virtuosoRef.current?.scrollToIndex({
        index: messages.length - 1,
        behavior: "smooth",
      })
    }
  }, [messages.length, isAtBottom])

  const handleSend = useCallback(async () => {
    const text = inputText.trim()
    if (!text || isStreaming) return

    setInputText("")

    try {
      const result = await ChatServiceClient.sendMessage(text)
      if (!result.ok) {
        console.error("[Prism] sendMessage failed:", result.error)
      }
    } catch (err) {
      console.error("[Prism] sendMessage error:", err)
    }
  }, [inputText, isStreaming])

  const handleAbort = useCallback(async () => {
    try {
      await ChatServiceClient.abortTask()
    } catch (err) {
      console.error("[Prism] abortTask error:", err)
    }
  }, [])

  const handleClear = useCallback(async () => {
    try {
      await ChatServiceClient.clearMessages()
    } catch (err) {
      console.error("[Prism] clearMessages error:", err)
    }
  }, [])

  const handleApproveToolUse = useCallback(async (toolUseId: string, approved: boolean) => {
    try {
      await ChatServiceClient.approveToolUse(toolUseId, approved)
    } catch (err) {
      console.error("[Prism] approveToolUse error:", err)
    }
  }, [])

  // Show API key setup if not configured
  if (!state.hasApiKey) {
    return <ApiKeySetup />
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Phase indicator header */}
      <PhaseIndicator currentPhase={state.workflowPhase} />

      {/* Phase transition buttons */}
      <PhaseTransition currentPhase={state.workflowPhase} />

      {/* Chat header actions */}
      {state.hasActiveTask && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "4px 12px",
            gap: "8px",
            borderBottom: "1px solid var(--vscode-widget-border, #333)",
          }}
        >
          <button
            onClick={() => void handleClear()}
            style={{
              padding: "2px 8px",
              borderRadius: "4px",
              border: "1px solid var(--vscode-widget-border, #555)",
              backgroundColor: "transparent",
              color: "var(--vscode-descriptionForeground)",
              cursor: "pointer",
              fontSize: "11px",
            }}
          >
            New chat
          </button>
        </div>
      )}

      {/* Message list */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {messages.length === 0 ? (
          <EmptyChat phase={state.workflowPhase} />
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            data={messages}
            atBottomStateChange={setIsAtBottom}
            itemContent={(_index: number, message: PrismChatMessage) => (
              <div style={{ padding: "4px 12px" }}>
                <ChatRow
                  message={message}
                  onApproveToolUse={
                    pendingApproval === message.toolUseId
                      ? handleApproveToolUse
                      : undefined
                  }
                />
              </div>
            )}
            style={{ height: "100%" }}
            followOutput="smooth"
          />
        )}
      </div>

      {/* Input area */}
      <div
        style={{
          padding: "8px",
          borderTop: "1px solid var(--vscode-widget-border, #333)",
          backgroundColor: "var(--vscode-sideBar-background)",
        }}
      >
        {isStreaming ? (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "8px",
                backgroundColor: "var(--vscode-input-background)",
                color: "var(--vscode-descriptionForeground)",
                fontSize: "12px",
                border: "1px solid var(--vscode-input-border, #3c3c3c)",
              }}
            >
              Claude is thinking…
            </div>
            <button
              onClick={() => void handleAbort()}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #ef4444",
                backgroundColor: "#ef444422",
                color: "#ef4444",
                cursor: "pointer",
                fontSize: "12px",
                flexShrink: 0,
              }}
            >
              Stop
            </button>
          </div>
        ) : (
          <ChatTextArea
            value={inputText}
            onChange={setInputText}
            onSubmit={() => void handleSend()}
            disabled={isStreaming}
            placeholder={`Message Prism (${state.workflowPhase} mode)…`}
          />
        )}

        {/* Input hints */}
        <div
          style={{
            fontSize: "10px",
            color: "var(--vscode-descriptionForeground)",
            marginTop: "4px",
            textAlign: "right",
          }}
        >
          Enter to send · Shift+Enter for newline
        </div>
      </div>
    </div>
  )
}
