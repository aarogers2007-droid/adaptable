"use client";

import { useState, useEffect } from "react";
import { getOrgScenarios, createScenario, updateScenario, deactivateScenario } from "./scenario-actions";
import type { Scenario } from "./scenario-actions";
import { UNIVERSAL_RUBRIC } from "@/lib/scenario-rubric";

interface Props {
  orgId: string;
}

const INDUSTRIES = [
  "food",
  "retail",
  "logistics",
  "technology",
  "healthcare",
  "finance",
  "hospitality",
  "education",
  "manufacturing",
  "marketing",
  "design",
  "agriculture",
  "entertainment",
  "sports",
  "nonprofit",
  "environment",
  "custom",
] as const;

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Starter",
  2: "Intermediate",
  3: "Advanced",
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function ScenariosPanel({ orgId }: Props) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [situation, setSituation] = useState("");
  const [industry, setIndustry] = useState<string>("food");
  const [difficulty, setDifficulty] = useState(1);
  const [rubricCriteria, setRubricCriteria] = useState<Set<string>>(new Set());
  const [badgeName, setBadgeName] = useState("");
  const [badgeIcon, setBadgeIcon] = useState("");
  const [isSponsored, setIsSponsored] = useState(false);
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorLogoUrl, setSponsorLogoUrl] = useState("");
  const [sponsorContext, setSponsorContext] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadScenarios() {
    setLoading(true);
    const result = await getOrgScenarios();
    if ("scenarios" in result) {
      setScenarios(result.scenarios);
    }
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-only data fetch
  useEffect(() => { loadScenarios(); }, [orgId]);

  function resetForm() {
    setTitle("");
    setSituation("");
    setIndustry("food");
    setDifficulty(1);
    setRubricCriteria(new Set());
    setBadgeName("");
    setBadgeIcon("");
    setIsSponsored(false);
    setSponsorName("");
    setSponsorLogoUrl("");
    setSponsorContext("");
    setError(null);
  }

  function openCreate() {
    resetForm();
    setEditingScenario(null);
    setShowModal(true);
  }

  function openEdit(scenario: Scenario) {
    setEditingScenario(scenario);
    setTitle(scenario.title);
    setSituation(scenario.situation);
    setIndustry(scenario.industry);
    setDifficulty(scenario.difficulty);
    setRubricCriteria(new Set(scenario.rubric_criteria));
    setBadgeName(scenario.badge_name);
    setBadgeIcon(scenario.badge_icon);
    setIsSponsored(scenario.is_sponsored);
    setSponsorName(scenario.sponsor_name ?? "");
    setSponsorLogoUrl(scenario.sponsor_logo_url ?? "");
    setSponsorContext(scenario.sponsor_context ?? "");
    setError(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingScenario(null);
    resetForm();
  }

  function toggleCriterion(id: string) {
    setRubricCriteria((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleSubmit() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!situation.trim()) {
      setError("Scenario situation is required.");
      return;
    }
    if (rubricCriteria.size === 0) {
      setError("Select at least one rubric criterion.");
      return;
    }
    if (!badgeName.trim()) {
      setError("Badge name is required.");
      return;
    }
    if (!badgeIcon.trim()) {
      setError("Badge icon is required.");
      return;
    }
    if (isSponsored && !sponsorName.trim()) {
      setError("Sponsor name is required for sponsored scenarios.");
      return;
    }

    setError(null);
    setSubmitting(true);

    const fd = new FormData();
    fd.set("title", title.trim());
    fd.set("situation", situation.trim());
    fd.set("industry", industry);
    fd.set("difficulty", String(difficulty));
    fd.set("rubric_criteria", JSON.stringify(Array.from(rubricCriteria)));
    fd.set("badge_name", badgeName.trim());
    fd.set("badge_icon", badgeIcon.trim());
    fd.set("is_sponsored", String(isSponsored));
    if (isSponsored) {
      fd.set("sponsor_name", sponsorName.trim());
      if (sponsorLogoUrl.trim()) fd.set("sponsor_logo_url", sponsorLogoUrl.trim());
      if (sponsorContext.trim()) fd.set("sponsor_context", sponsorContext.trim());
    }

    const result = editingScenario
      ? await updateScenario(editingScenario.id, fd)
      : await createScenario(fd);
    setSubmitting(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    closeModal();
    await loadScenarios();
  }

  async function handleDeactivate(scenarioId: string) {
    const result = await deactivateScenario(scenarioId);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    await loadScenarios();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-[var(--bg-muted)]" />
        <div className="h-32 animate-pulse rounded-xl bg-[var(--bg-muted)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--text-primary)]">
            Scenarios
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Create custom business challenges for your students. Sponsors can fund branded scenarios that produce engagement data.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="shrink-0 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors min-h-[44px]"
        >
          + Create Scenario
        </button>
      </div>

      {/* Scenario list or empty state */}
      {scenarios.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-subtle)] p-8 text-center">
          <p className="text-sm font-semibold text-[var(--text-primary)]">No scenarios yet</p>
          <p className="mt-2 text-sm text-[var(--text-muted)] max-w-md mx-auto">
            Create your first business challenge for students. Sponsors can fund custom scenarios that give them direct insight into how students think.
          </p>
          <button
            onClick={openCreate}
            className="mt-4 rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors min-h-[44px]"
          >
            + Create Scenario
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {scenarios.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5 space-y-3"
            >
              {/* Title row */}
              <div className="flex items-start gap-3">
                <span className="text-2xl leading-none">{s.badge_icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {s.title}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="inline-block rounded-full bg-[var(--bg-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
                      {capitalize(s.industry)}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]" title={DIFFICULTY_LABELS[s.difficulty]}>
                      {"★".repeat(s.difficulty)}{"☆".repeat(3 - s.difficulty)}
                    </span>
                    {s.is_sponsored && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        Sponsored{s.sponsor_name ? ` \u00b7 ${s.sponsor_name}` : ""}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    s.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-[var(--bg-muted)] text-[var(--text-muted)]"
                  }`}
                >
                  {s.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Rubric criteria pills */}
              <div className="flex flex-wrap gap-1.5">
                {s.rubric_criteria.map((cid) => {
                  const criterion = UNIVERSAL_RUBRIC.find((c) => c.id === cid);
                  return (
                    <span
                      key={cid}
                      className="rounded-full border border-[var(--border)] bg-[var(--bg-subtle)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]"
                    >
                      {criterion?.short_label ?? cid}
                    </span>
                  );
                })}
              </div>

              {/* Actions */}
              {s.is_active && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => openEdit(s)}
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] transition-colors min-h-[44px]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeactivate(s.id)}
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--error)] hover:border-[var(--error)] transition-colors min-h-[44px]"
                  >
                    Deactivate
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-lg sm:max-w-lg sm:rounded-xl">
            <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--text-primary)]">
              {editingScenario ? "Edit Scenario" : "Create a Scenario"}
            </h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {editingScenario
                ? "Update this business challenge."
                : "Design a new business challenge for your students."}
            </p>

            <div className="mt-5 space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="sc-title" className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                  Title
                </label>
                <input
                  id="sc-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="The Pop-Up Challenge"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>

              {/* Situation */}
              <div>
                <label htmlFor="sc-situation" className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                  Scenario Situation
                </label>
                <textarea
                  id="sc-situation"
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  placeholder="Describe the business challenge students will face..."
                  rows={6}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>

              {/* Industry */}
              <div>
                <label htmlFor="sc-industry" className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                  Industry
                </label>
                <select
                  id="sc-industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {capitalize(ind)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
                  Difficulty
                </label>
                <div className="flex gap-3">
                  {[1, 2, 3].map((level) => (
                    <label
                      key={level}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors min-h-[44px] ${
                        difficulty === level
                          ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                          : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="difficulty"
                        value={level}
                        checked={difficulty === level}
                        onChange={() => setDifficulty(level)}
                        className="sr-only"
                      />
                      <span>{"★".repeat(level)}</span>
                      <span>{DIFFICULTY_LABELS[level]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rubric Criteria */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
                  Rubric Criteria <span className="font-normal text-[var(--text-muted)]">(select 1-6)</span>
                </label>
                <div className="space-y-2">
                  {UNIVERSAL_RUBRIC.map((criterion) => (
                    <label
                      key={criterion.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                        rubricCriteria.has(criterion.id)
                          ? "border-[var(--primary)] bg-[var(--primary)]/5"
                          : "border-[var(--border)] hover:border-[var(--border-strong)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={rubricCriteria.has(criterion.id)}
                        onChange={() => toggleCriterion(criterion.id)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--border)] text-[var(--primary)] accent-[var(--primary)]"
                      />
                      <div>
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {criterion.short_label}
                        </span>
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                          {criterion.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Badge Name */}
              <div>
                <label htmlFor="sc-badge-name" className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                  Badge Name
                </label>
                <input
                  id="sc-badge-name"
                  type="text"
                  value={badgeName}
                  onChange={(e) => setBadgeName(e.target.value)}
                  placeholder="Pop-Up Pro"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>

              {/* Badge Icon */}
              <div>
                <label htmlFor="sc-badge-icon" className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                  Badge Icon <span className="font-normal text-[var(--text-muted)]">(emoji)</span>
                </label>
                <input
                  id="sc-badge-icon"
                  type="text"
                  value={badgeIcon}
                  onChange={(e) => setBadgeIcon(e.target.value)}
                  placeholder="🏪"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>

              {/* Divider */}
              <hr className="border-[var(--border)]" />

              {/* Sponsored toggle */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Sponsored?</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    Enable if a sponsor is funding this scenario.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSponsored(!isSponsored)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors min-h-[44px] min-w-[44px] ${
                    isSponsored ? "bg-[var(--primary)]" : "bg-[var(--bg-muted)]"
                  }`}
                  aria-label="Toggle sponsored"
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      isSponsored ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Sponsor fields */}
              {isSponsored && (
                <div className="space-y-4 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
                  <div>
                    <label htmlFor="sc-sponsor-name" className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                      Sponsor Name
                    </label>
                    <input
                      id="sc-sponsor-name"
                      type="text"
                      value={sponsorName}
                      onChange={(e) => setSponsorName(e.target.value)}
                      placeholder="Acme Corp"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label htmlFor="sc-sponsor-logo" className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                      Sponsor Logo URL <span className="font-normal text-[var(--text-muted)]">(optional)</span>
                    </label>
                    <input
                      id="sc-sponsor-logo"
                      type="text"
                      value={sponsorLogoUrl}
                      onChange={(e) => setSponsorLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label htmlFor="sc-sponsor-context" className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                      Sponsor Context <span className="font-normal text-[var(--text-muted)]">(optional)</span>
                    </label>
                    <textarea
                      id="sc-sponsor-context"
                      value={sponsorContext}
                      onChange={(e) => setSponsorContext(e.target.value)}
                      placeholder="Additional context from the sponsor for the AI mentor"
                      rows={3}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>
                </div>
              )}
            </div>

            {error && <p className="mt-3 text-sm text-[var(--error)]">{error}</p>}

            {/* Footer */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={submitting}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 min-h-[44px]"
              >
                {submitting
                  ? "Saving..."
                  : editingScenario
                    ? "Save Changes"
                    : "Create Scenario"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
