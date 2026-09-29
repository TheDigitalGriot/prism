# Orca DESIGN WORKFLOW band - contract addendum
# Applies ON TOP OF 2026-09-29-orca-screen-port-CONTRACT.md. Where they conflict, this wins,
# and only for the workflow band. Everything the base contract says about tokens, the Design
# type's rules, and desktop+mobile pairing still binds.

## Why this addendum exists

The base contract says: "render the state the CODE ACTUALLY RENDERS for its default/empty case.
Do not invent a populated state to make the board look richer." That rule is correct for a screen
port and it would be fatal here. A workflow band whose every stage renders the empty case is five
boards of identical empty chrome, which shows no workflow at all.

Gavin, 2026-09-29: "i want to see the big picture of what the djeli orca design workflows screens
look like."

So for THIS band the rule inverts, under a guard.

## The two bands

**BAND ONE - the workflow, composed screens.** One board per STAGE of the flow, desktop 1440x900
and mobile 390x844. Each board renders the WHOLE surface in that state - chrome, sidebar, pane,
overlay, sheet, together - not an isolated component on a blank ground. The bands read left to
right as the flow proceeds. Stages come from the composition walk's payload path, never invented.

**BAND TWO - the components, natural frames.** One board per component in the composition, sized
to what the component actually is. A menu is a small board. A device frame is a tall board. A
sheet is a mid board. SIZE IS NEVER A REASON TO EXCLUDE A COMPONENT - an 850-byte menu that is
where a routing decision gets made earns a board exactly like a 14KB frame does.

## THE POPULATED-STATE CLAUSE, and its guard

PERMITTED AND REQUIRED for band one: render a populated state. An element actually selected. A
payload actually in the sheet. A destination actually highlighted in the send menu.

STILL BANNED: inventing the content of that state. Every value visible on a workflow board -
element tag, selector, URL, snippet, file name, device name, session title, chat text - must come
from one of:
  1. a default or placeholder the code itself defines,
  2. a fixture, mock, seed or test file in the repo,
  3. a literal in the component or its story/e2e spec,
  4. a docs example committed to the repo.
and the board must carry that origin as a `file:line` comment beside the value it fills.

If no source exists for a value, use an obvious placeholder in square brackets - [SELECTED
ELEMENT] - and never a plausible-looking invention. A plausible invention is worse than a
placeholder here, because it reads as a real product fact and nothing downstream can tell.

## Stage fidelity

A stage board shows ONE stage. Do not compose a board that shows two states at once for
convenience (an overlay active AND the sheet open, unless the code genuinely renders both
together). If the walk shows they co-occur, render them together and say so.

## What gates this band

- Every band-one board names its stage in the board title, and the stage names match the
  composition walk's payload path exactly.
- Every populated value carries its `file:line` origin comment, or is a bracketed placeholder.
- Every desktop board has its 390x844 twin - the base contract's pairing rule is unchanged.
- register-ported-boards.mjs places band two; band one placement is a separate band-y with its
  own title note, so the two read as distinct rows on the canvas.