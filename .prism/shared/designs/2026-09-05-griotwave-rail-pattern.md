# Griotwave rail pattern — collapsible, resizable panes

**Status:** extracted 2026-09-05 from four real bugs hit in the Prism brainstorm companion, then
found by inspection in the Cinopsis viewer. **Both are fixed; this is the pattern so the next
surface does not rediscover them.**
**Applies to:** any griotwave surface with a collapsible + drag-resizable pane — Prism companion,
Cinopsis viewer, and (eventually) the shared griotwave-ui.

## The single root cause

> **A pane's SAVED SIZE outliving its COLLAPSED state.**

All four bugs are the same mistake wearing different clothes. Persistence and collapse are two
pieces of state about one pane, and every bug came from letting the persisted one win.

---

## R1 · Collapsed must beat the saved size

**Symptom:** the pane is invisible but still occupies its full width, pushing content across. Looks
like a broken layout for reasons nothing in the DOM explains.

**Cause:** the saved width is written INLINE (`el.style.width`, or an inline custom property on the
root). Inline beats a class or attribute rule, so `.collapsed` loses.

```js
// WRONG - restores a width onto a pane that is currently closed
var saved = sessionStorage.getItem(key);
if (saved) { el.style.width = saved + 'px'; }
```

**Fix, one of:**
- do not restore onto a closed pane (check the class AND the persisted flag — the restore may run
  before the collapse wiring has applied classes, so call order cannot be trusted); or
- make the collapsed rule authoritative: `--rail-w:66px !important`.

The saved width is not lost either way — it returns on expand.

## R2 · No drag handle on a closed pane

A collapsed pane has no width to distribute, so a live handle can only produce a confusing no-op
drag. **`display:none` removes the affordance AND the behaviour in one move** — there is no
disabled-but-present state left to get wrong.

```css
.rail.collapsed ~ .rail-resizer[data-target="rail"]{display:none}
.app[data-rail="collapsed"] .rail-rz{display:none}
```

## R3 · Restore collapse state BEFORE first paint

**Symptom:** on reload, a closed pane paints OPEN at its default width and then snaps/animates shut.

**Cause:** the markup carries no collapsed class and the CSS default is a real width; the class is
only applied later, when the script runs.

```html
<script>
(function(){var d=document.documentElement;
  d.classList.add('no-anim');                     /* R4 */
  try{var v=sessionStorage.getItem('pane-collapsed');
      if(v===null||v==='1'){d.classList.add('pre-collapsed');}}catch(e){}
  requestAnimationFrame(function(){requestAnimationFrame(function(){
    d.classList.remove('no-anim');});});})();
</script>
```

**ORDER IS LOAD-BEARING when the script takes over.** Apply the real class FIRST, release the
pre-paint guard SECOND. Releasing first leaves one frame where neither rule applies — the pane
snaps to its default and animates shut, which is the exact glitch the guard existed to prevent.

```js
pane.classList.toggle('collapsed', collapsed);          // apply
document.documentElement.classList.remove('pre-collapsed'); // then release
```

## R4 · Suppress transitions for the first paint

Rails carry `transition: flex-basis .26s, width .26s`. Without suppression they ANIMATE into their
restored position on every load, which reads as a glitch rather than as state being restored.
Release after two frames (see the snippet in R3).

```css
html.no-anim .rail,html.no-anim .pane{transition:none !important}
```

## R5 · A tab rounds on its FREE edge

A tab protruding out of a collapsed pane has one joined edge and one free edge. **Round the free
edge; square the joined one**, and put the borders on the free edges only. Getting this mirrored
makes the tab read as if it hangs off the wrong side.

```css
/* pane on the left, tab protruding right */
.tab.collapsed-state{border-radius:0 6px 6px 0; border-left:0}
```

**Scope each state explicitly.** Four competing radius rules is how the *correct* expanded state got
broken while fixing the collapsed one — and never "pin" a value you have not measured.

---

## Checklist for the next surface

- [ ] **R1** closed pane cannot carry a saved size (check class AND persisted flag)
- [ ] **R2** handles are `display:none` when their pane is closed
- [ ] **R3** collapse state applied before first paint; class applied before guard released
- [ ] **R4** transitions suppressed for the first two frames
- [ ] **R5** tab rounds on its free edge; both states scoped explicitly
- [ ] **Verify by measuring, not by reasoning** — read `getBoundingClientRect()` and computed style
      in BOTH states, drive the real click handler rather than toggling classes by hand, and
      **restore the pane to how you found it.** Verification must leave no residue (ledger M8).

## Where this is implemented

| Surface | Files |
|---|---|
| Prism brainstorm companion | `skills/prism-brainstorm/scripts/frame-template.html` · `helper.js` |
| Cinopsis viewer | `viewer/viewer.html` — "COLLAPSED-PANE RULES (shared griotwave rail pattern)" |
| griotwave-ui | **not yet** — fold R1–R5 in when the shared rail component is built |
