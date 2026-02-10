# Prism → Spectrum Migration Quick Start

## 🌈 What's Changing?

**Ralph → Spectrum** everywhere. Light through a prism creates a spectrum. Your feature, decomposed into a full spectrum of atomic stories.

## Key Renames

```bash
# Files
ralph.sh                     → spectrum.sh
prism-ralph.md               → prism-spectrum.md
ralph-tui                    → prism-tui
cmd/ralph-tui/               → cmd/prism-tui/

# Directories
thoughts/                    → .prism/
thoughts/shared/ralph/       → .prism/shared/spectrum/

# Important: stories.json is now SEPARATED
thoughts/shared/ralph/stories.json  → .prism/stories/stories.json
thoughts/shared/ralph/progress.md   → .prism/shared/spectrum/progress.md

# Commands
/prism:prism-ralph          → /prism:prism-spectrum
/prism:decompose_plan       → (unchanged)

# New Structure
.prism/
├── stories/                # 🆕 SEPARATED - Task definitions
│   └── stories.json        # Source of truth for what to do
├── shared/
│   ├── spectrum/           # ← Execution state (was ralph/)
│   │   └── progress.md     # What we learned
│   ├── ref/                # ← NEW
│   └── docs/               # ← NEW
└── local/
    ├── ref/                # ← NEW
    └── docs/               # ← NEW
```

**Why separate stories.json?**
- `stories.json` = **what to do** (rarely changes)
- `progress.md` = **what we learned** (changes every iteration)
- Multiple Spectrum runs can share same stories
- Cleaner mental model and file organization

## Priority Actions (Week 1)

### Day 1-2: Core Migration
- [ ] Global find/replace: `ralph` → `spectrum`
- [ ] Rename files: `ralph.sh` → `spectrum.sh`
- [ ] Test all commands still work
- [ ] Commit: "refactor: migrate ralph to spectrum namespace"

### Day 3-4: Directory Structure
- [ ] Create `/prism-dir-update` command
- [ ] Create `init_prism.py` script
- [ ] Separate stories.json into `.prism/stories/`
- [ ] Keep progress.md in `.prism/shared/spectrum/`
- [ ] Test migration on sample project
- [ ] Update `.gitignore` templates
- [ ] Update TUI code paths:
  - [ ] Rename `cmd/ralph-tui/` → `cmd/prism-tui/`
  - [ ] Update path constants in `config/paths.go`
  - [ ] Update file loaders in `models/`
  - [ ] Update file watchers
  - [ ] Test TUI loads both files correctly
- [ ] Commit: "feat: add .prism directory structure with ref/docs"

### Day 5: Documentation
- [ ] Update README with Spectrum branding
- [ ] Add quick start with new structure
- [ ] Update all code examples
- [ ] Commit: "docs: update README with spectrum branding"

## TUI Dashboard (Week 2)

### Core Implementation
```bash
# Research Charm libraries
- Bubble Tea (framework)
- Lip Gloss (styling)
- Examples: lazygit, k9s

# Implement 5 screens
1. Home dashboard
2. Story list view
3. Story detail view
4. Live progress
5. Debug logs
```

### Integration
```bash
# Launch standalone
prism-tui

# Follow live execution
prism-tui --follow

# Add to workflow
/prism:prism-spectrum  # Now shows TUI option
```

## Demo Recordings (Week 2-3)

### Install VHS
```bash
brew install vhs
# or
go install github.com/charmbracelet/vhs@latest
```

### Record 5 Demos
1. `demos/01-quick-start.tape` - Init & setup
2. `demos/02-spectrum-execution.tape` - Story execution
3. `demos/03-tui-demo.tape` - Dashboard walkthrough
4. `demos/04-debug-workflow.tape` - Debug flow
5. `demos/05-full-workflow.tape` - End-to-end

### Generate GIFs
```bash
vhs demos/01-quick-start.tape
# Outputs: demos/01-quick-start.gif
```

## README Polish (Week 3)

### New Sections
```markdown
# Add to README:
- 🌈 Hero with animated logo (1200x400px)
- ✨ Features with GIF demos
- 🚀 Quick start (3 steps)
- 📊 Architecture diagrams (Mermaid)
- ❓ FAQ section
- 🤝 Contributing guide
```

### Badges
```markdown
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)]()
![Claude Code](https://img.shields.io/badge/Claude_Code-Compatible-purple.svg)
```

## Testing Checklist

- [ ] Fresh install works
- [ ] Migration from old structure works
- [ ] All `/prism:*` commands work
- [ ] TUI launches and updates
- [ ] GIFs render in GitHub
- [ ] README is professional

## Timeline

| Week | Focus | Hours |
|------|-------|-------|
| 1 | Core migration + directory structure | 16-20h |
| 2 | TUI implementation | 16-24h |
| 3 | Demos + documentation | 10-14h |

**Total: 42-58 hours (1.5-2 weeks)**

## Quick Commands Reference

```bash
# Before (Ralph)
./scripts/ralph.sh
/prism:prism-ralph
thoughts/shared/ralph/stories.json
thoughts/shared/ralph/progress.md
cmd/ralph-tui/

# After (Spectrum)
./scripts/spectrum.sh
/prism:prism-spectrum
.prism/stories/stories.json          # ← Separated!
.prism/shared/spectrum/progress.md   # ← In spectrum/
cmd/prism-tui/

# New Features
/prism-dir-update              # Migrate existing project
prism-tui                      # Launch dashboard
prism-tui --follow             # Monitor live execution
```

**Key architectural change**: `stories.json` now lives separately from `progress.md`
- `.prism/stories/` = Task definitions (what to do)
- `.prism/shared/spectrum/` = Execution state (what we learned)

## Search & Replace Patterns

```bash
# Case-sensitive replacements
ralph → spectrum
Ralph → Spectrum
RALPH → SPECTRUM

# File renames
ralph.sh → spectrum.sh
prism-ralph.md → prism-spectrum.md
ralph/ → spectrum/

# Directory structure
thoughts/ → .prism/
thoughts/shared/ → .prism/shared/
thoughts/local/ → .prism/local/
```

## Success Metrics

✅ All commands work with `spectrum` namespace  
✅ Migration command successfully converts old projects  
✅ TUI dashboard shows live progress  
✅ 5 demo GIFs generated and display correctly  
✅ README looks professional with badges and demos  
✅ No remaining references to "ralph" in codebase  

## Support

For detailed implementation instructions, see `prism-update-instructions.md`

---

**Ready to begin?** Start with the Day 1-2 tasks above! 🚀
