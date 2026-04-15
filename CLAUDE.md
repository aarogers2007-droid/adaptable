# Adaptable

AI-native venture studio where students design, plan, and prepare to launch real businesses. Built for VentureLab.

## The Adaptable Factual Floor

Adaptable's stated mission is **transformation, not education** — and the founder's
own words: *"confidence in their knowledge should be facts-based. We want to keep
things transparent and real, especially when trying to make these young students
more confident."*

That mission demands a non-negotiable editorial standard for any content the AI
mentor can surface to a student — whether shown as a citation, paraphrased, or
absorbed into generated text.

**The standard, adopted 2026-04-08 after an internal eval surfaced 13% citation
hallucination in the knowledge base:**

> Any claim the AI mentor can surface to a student must be traceable to a source
> a 16-year-old could independently verify in under 60 seconds. Named individuals
> paired with specific outcomes, quoted statistics, and study citations require
> a real, checkable source at seed time, or they do not enter the knowledge base.
> Principles, frameworks, and mechanism explanations do not require citations and
> are preferred over anecdotes whenever the pedagogical value is equivalent.

**The test isn't "is this probably true." The test is "can a skeptical teenager
verify it in 60 seconds." That test automatically kills fake teen case studies,
fabricated statistics, and paraphrase-drift misattributions, because none of them
survive a Google search.**

### Operational rules that follow from the Factual Floor

1. **The eval harness is a pre-commit gate, not a post-hoc audit.** No knowledge
   base entry ships to `verified=true` without passing
   `scripts/eval-knowledge-base.ts` with a likely_hallucinated count of 0 (or
   manually-reviewed exceptions for fields where the judge marks UNVERIFIED but
   the human can confirm).

2. **The paraphrasing layer is a product feature, not an integrity control.** Do
   not rely on "the AI paraphrases context conversationally so students don't see
   the exact citation" as a defense for shipping unverified claims. Integrity
   lives in the source of truth, not in downstream rendering.

3. **Principles over anecdotes.** When seeding new knowledge, prefer mechanism
   explanations and well-known frameworks (Lean Canvas, Jobs-to-be-Done, Mom Test,
   Golden Circle) over named teen case studies. If a real, verifiable example
   exists, cite it. If you're tempted to invent one for vividness, generalize
   instead with "imagine a teen who..." framing.

4. **When in doubt, cut.** A knowledge base entry with one fewer claim is strictly
   better than one with a fabricated claim. Surgical removal beats clever
   replacement.

5. **Velocity is not a defense.** When schedule pressure makes a fact-checking
   shortcut tempting, the answer is "delay the feature" not "ship the
   contamination." The mission cannot survive one screenshot of a fabricated
   citation; the lesson can survive 48 hours of degraded RAG context.

## Ikigai Synthesis Prompt — Standing Decisions

These prompt rules were validated through eval-driven iteration and regression tests.
They are standing decisions — do not revert without re-running the regression tests
and confirming scores remain above the baselines in `evals/baseline-scores.json`.

### Rule 11: Young Student Guard (age ≤ 12)

When `grade_tier === "elementary"`, the user message prepends a flag that triggers
rule 11: business ideas MUST require zero startup capital. Ideas must be purely
skill-based or time-based (tutoring, pet sitting, yard work, digital art commissions
using free tools). Any idea requiring the student to spend money before earning money
is rejected. Regression test: `scripts/eval-age12-regression.ts`, baseline capital_required ≥ 4.0.

### Rules 4-5: Dominant Interest Selection for Multi-Interest Students

When a student has 2-3 unrelated interests, the prompt picks the DOMINANT one —
the interest where the student's language is most specific, emotional, or experienced.
The dominant interest drives the niche, name, customer, and revenue model completely.
Secondary interests may ONLY appear in `why_this_fits` as transferable skill insight.

### Rule 5: Anti-Hybrid Self-Check

After generating an idea, the prompt runs a self-check: "If I removed the secondary
interest from this student's profile, would the niche description need to change?"
If yes, it's a forced hybrid and gets regenerated. Concrete bad examples are listed
in the prompt: "anime-themed nail art," "music-themed tutoring," "gaming-themed
cooking." The Valorant+drawing test case is explicit: produce EITHER Valorant coaching
OR character art commissions, NOT "Valorant character art."
Regression test: `scripts/eval-multi-interest-regression.ts`, baseline noHyb ≥ 4.5, insight ≥ 4.0.

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
