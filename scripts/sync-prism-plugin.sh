#!/bin/sh
# sync-prism-plugin.sh - push the plugin dirs to the clean plugin-only mirror repo.
#
# WHY: Claude Desktop's marketplace backend settles `failed_content` on the full
# multi-GB prism monorepo, AND on any mirror whose marketplace.json sources the
# plugin from an external repo. This mirror ships marketplace.json with
# `source: "."` (the plugin lives in this same repo) and only the six plugin dirs
# (a few MB), so the backend crawls it clean. Point the Desktop marketplace at
# TheDigitalGriot/prism-plugin.
#
# Invoked from repo root (manually or by prism-release Step 6.5):
#   sh scripts/sync-prism-plugin.sh
#
# Mirror history is a single fresh commit per sync (force-push): the mirror is a
# build artifact, not a source of truth. Never edit the mirror directly.
#
# POSIX sh ONLY - see the LF/POSIX hook contract (PRISM-DOCUMENTATION-4.3.0).
set -eu
if (set -o pipefail) 2>/dev/null; then set -o pipefail; fi

MIRROR_URL="git@github.com:TheDigitalGriot/prism-plugin.git"
VERSION=$(cat VERSION)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# git archive respects .gitattributes (eol=lf) and skips gitlinks - the same
# properties that make /prism-sideload zips reliable. marketplace.json already
# carries source:"." so the mirror is self-contained (no post-archive patching).
git archive HEAD .claude-plugin skills agents commands hooks scripts | tar -x -C "$TMP"

cat > "$TMP/README.md" <<EOF
# Prism Plugin (marketplace)

Clean, self-contained plugin-only marketplace for Prism (https://github.com/TheDigitalGriot/prism) -
plugin dirs only, source ".", synced at **v$VERSION**.

Add in Claude Desktop / Cowork: Customize -> Plugins -> add marketplace TheDigitalGriot/prism-plugin.

Do not edit here: changes land in the main repo and are pushed by
scripts/sync-prism-plugin.sh (see prism-release Step 6.5).
EOF

cd "$TMP"
git init -q -b main
git remote add origin "$MIRROR_URL"
git add -A
git commit -q -m "sync: prism v$VERSION"
git push -q -f origin main
echo "OK  prism-plugin synced at v$VERSION -> $MIRROR_URL"