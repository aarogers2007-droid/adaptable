#!/usr/bin/env bash
# overnight.sh — unattended health checks for Adaptable
# Runs sequentially, logs everything to ~/overnight-results.md
# No permission prompts, no interactive input, no destructive ops.
#
# Usage:  bash scripts/overnight.sh &
#         (or via Claude Code background tool)

set +e   # never abort the whole bundle on a single failure
cd "$(dirname "$0")/.."   # always run from project root

REPORT="$HOME/overnight-results.md"
START=$(date +%s)
TS() { date +"%Y-%m-%d %H:%M:%S"; }

# Reset report
{
  echo "# Adaptable overnight test results"
  echo ""
  echo "Started: $(TS)"
  echo "Branch:  $(git branch --show-current)"
  echo "Commit:  $(git rev-parse --short HEAD)"
  echo ""
} > "$REPORT"

section() {
  echo ""             >> "$REPORT"
  echo "---"          >> "$REPORT"
  echo ""             >> "$REPORT"
  echo "## $1"        >> "$REPORT"
  echo ""             >> "$REPORT"
  echo "_$(TS)_"      >> "$REPORT"
  echo ""             >> "$REPORT"
}

run() {
  local name="$1"; shift
  echo "[$(TS)] starting: $name" >&2
  local out
  local t0=$(date +%s)
  out=$( "$@" 2>&1 )
  local rc=$?
  local t1=$(date +%s)
  local dur=$((t1 - t0))
  if [ $rc -eq 0 ]; then
    echo "**✅ $name** (${dur}s)" >> "$REPORT"
  else
    echo "**❌ $name** (${dur}s, exit $rc)" >> "$REPORT"
  fi
  echo "" >> "$REPORT"
  echo '```' >> "$REPORT"
  # tail of output to keep report readable
  echo "$out" | tail -50 >> "$REPORT"
  echo '```' >> "$REPORT"
  echo "" >> "$REPORT"
  return $rc
}

# ─── 1. Build + typecheck + lint ─────────────────────────────────────────
section "1. Build + typecheck + lint"

run "tsc --noEmit (strict)"   bunx tsc --noEmit -p tsconfig.json
run "next build (production)" bunx next build
run "eslint src/"             bunx eslint src/ --max-warnings=999

# ─── 2. KB citation re-eval ──────────────────────────────────────────────
section "2. KB citation re-eval (Adaptable Factual Floor)"

if [ -f scripts/eval-kb-citations-only.ts ]; then
  run "eval-kb-citations-only" bunx tsx scripts/eval-kb-citations-only.ts
else
  echo "_skipped: scripts/eval-kb-citations-only.ts not found_" >> "$REPORT"
fi

# ─── 3. End-to-end browse smoke against prod ─────────────────────────────
section "3. End-to-end browse smoke (production)"

if [ -x ~/.claude/skills/gstack/browse/dist/browse ]; then
  run "browse smoke" bunx tsx scripts/overnight-browse-smoke.ts
else
  echo "_skipped: browse binary not built_" >> "$REPORT"
fi

# ─── 4. KB structural integrity ──────────────────────────────────────────
section "4. KB structural integrity (entry count, lesson coverage, required fields)"

run "kb-integrity" bunx tsx scripts/overnight-kb-integrity.ts

# ─── 5. End-to-end authenticated user walk ──────────────────────────────
section "5. E2E auth walk (RLS, CSRF, profile UPDATE, feedback box)"

run "e2e-auth-walk" bunx tsx scripts/e2e-auth-walk.ts

# ─── 6. RLS policy regression catcher ──────────────────────────────────
section "6. RLS policies (allow/deny matrix per table)"

run "test-rls-policies" bunx tsx scripts/test-rls-policies.ts

# ─── Summary ─────────────────────────────────────────────────────────────
END=$(date +%s)
TOTAL=$((END - START))

{
  echo ""
  echo "---"
  echo ""
  echo "## Summary"
  echo ""
  echo "- Total runtime: $((TOTAL / 60))m $((TOTAL % 60))s"
  echo "- Finished: $(TS)"
  echo "- Failures: $(grep -c '^\*\*❌' "$REPORT")"
  echo "- Successes: $(grep -c '^\*\*✅' "$REPORT")"
} >> "$REPORT"

echo "[$(TS)] overnight bundle complete → $REPORT" >&2
