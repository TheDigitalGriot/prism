# vendor/ — the source, copied whole

Not grafts. Not summaries. The actual trees from `GriotSandbox/viz-generate`, cloned by
`/prism:griot-harvest` and copied here entire, because the earlier passes lifted mechanism
(an IR mapping, 20 lines of projection maths) and threw away the layer that actually
matters — the visuals, the motion, the assets, the look and feel. Those don't survive
being summarised; they have to be present.

| dir | from | what's here |
|---|---|---|
| `fossflow/` | FossFLOW `packages/fossflow-lib` | 186 source files + its own package.json. The real renderer, stores, components, styles, assets. |
| `archify/` | archify `archify/` | renderers, the 5 JSON schemas, assets, examples, recipes, references, migrations, delta, brand-marks. |
| `diagram-design/` | diagram-design `skills/diagram-design` | the whole skill — 40 type references, 162 example HTMLs, the style guide, onboarding, scripts. This is the aesthetic reference for the cluster. |
| `lanshu/` | lanshu-animated-architecture-diagram | scripts, references, assets, agents, SKILL.md. |
| `visual-explainer/` | visual-explainer | plugins, scripts, configs. |

**The dependencies were the point, not the weight.** An earlier pass called MUI, Emotion,
GSAP, Paper and Quill a "dependency mountain" and skipped them. They are the design system,
the motion engine and the vector engine — the look and feel itself. All 19 of FossFLOW's
dependencies are now installed at its declared majors (MUI 5, zustand 4, immer 10, zod 3,
chroma 2, uuid 9 — not the newer majors npm resolves to by default, which its source
predates and would break against).

Nothing here is edited. It is reference material to build the engine's feel FROM, present
at full fidelity, so nothing has to be recalled or inferred.
