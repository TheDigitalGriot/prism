/**
 * Layer 02 — the node. A Waku box: every box IS a real module file.
 *
 * The prism-viz-engine thesis ends "...ships them as interactive, source-wired surfaces
 * in the Waku mold — not static SVGs." So this component refuses to be a label:
 *
 *   Wiring A — click selects it and the shell reveals its detail (hash-deep-linkable)
 *   Wiring B — the ⟨source⟩ control opens the REAL file at the REAL line
 *   Wiring C — `data-node` id glows when a live trace event names it
 *
 * It carries BOTH harvest halves on one card, because a decision about the future of
 * the tooling needs the picture and the function together: the UI half gives the
 * file:line and mount point, the code half gives licence, fit and the standing ruling.
 */

import { memo, useCallback } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { ROLE_EMBER, type LayerSlot } from "../../core/layer-roles"
import type { GriotNodeMeta } from "../../core/json-canvas"

export interface ComponentNodeData extends Record<string, unknown> {
  label: string
  griot: GriotNodeMeta
  tracing?: boolean
  reveal?: (origin: { repo: string; file: string; line: number }) => void | Promise<void>
}

const DECISION_TONE: Record<string, string> = {
  adopt: "var(--ok)",
  trial: "var(--sky)",
  defer: "var(--amber)",
  pass: "var(--dim)",
  undecided: "var(--dim)",
}

function ComponentNodeImpl({ data, selected, id }: NodeProps) {
  const d = data as ComponentNodeData
  const g = d.griot
  const ember = ROLE_EMBER[g.layer as LayerSlot] ?? "#6b7385"
  const ui = g.ui
  const code = g.code

  const onReveal = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (ui?.origin && d.reveal) void d.reveal(ui.origin)
    },
    [ui, d]
  )

  return (
    <div
      className={`vz-node${selected ? " sel" : ""}${d.tracing ? " tracing" : ""}`}
      data-node={id}
      style={{ ["--ember" as string]: ember }}
      title={ui?.mountPoint}
    >
      <Handle type="target" position={Position.Top} className="vz-handle" />

      <div className="vz-node-top">
        {ui && <span className="vz-repo">{ui.origin.repo}</span>}
        {g.walkLevel && <span className="vz-kind">{g.walkLevel}</span>}
        {code?.decision && code.decision !== "undecided" && (
          <span className="vz-dec" style={{ color: DECISION_TONE[code.decision] }}>
            {code.decision}
          </span>
        )}
        {!!ui?.notCopy?.length && (
          <span className="vz-warn" title={ui.notCopy.join("\n")}>
            ⚠{ui.notCopy.length}
          </span>
        )}
      </div>

      <div className="vz-label">{d.label}</div>

      {/* The evidence, always visible. A card without file:line is not a finding. */}
      {ui && (
        <button className="vz-src" onClick={onReveal} disabled={!d.reveal} title={d.reveal ? "open the real source" : "no reveal on this host"}>
          <span className="vz-src-file">{ui.origin.file}</span>
          <span className="vz-src-line">:{ui.origin.line}</span>
        </button>
      )}

      {/* The code half — licence is a FACT for a field, never a verdict. */}
      {code && (
        <div className="vz-code">
          <span className="vz-lic">{code.licence}</span>
          {code.fit && (
            <span className="vz-fit" title={code.fit.why}>
              {code.fit.app}
              <b>{"·".repeat(code.fit.strength)}</b>
            </span>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="vz-handle" />
    </div>
  )
}

export const ComponentNode = memo(ComponentNodeImpl)
