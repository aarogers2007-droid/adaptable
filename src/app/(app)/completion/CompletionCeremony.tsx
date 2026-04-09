"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

const PHI = 1.618034;
const BASE = 1000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface CeremonyProps {
  studentName: string;
  businessName: string;
  businessNiche: string;
  ikigai: {
    passions: string[];
    skills: string[];
    needs: string[];
    monetization: string;
  } | null;
  onComplete: () => void;
  /**
   * When true (default), the ceremony shows the four Ikigai answer labels
   * around the circles during the reveal scene. When false, the circles
   * appear and animate without any text labels — pure visual reveal.
   *
   * AJ's call (2026-04-08): cleaner is better. Default: false.
   */
  showAnswerLabels?: boolean;
  /**
   * Demo mode: starts directly on the Ikigai reveal (skipping the
   * "Program Complete" beat), plays the gravitational collapse + business
   * name reveal, then auto-advances through the founder's letter and
   * diploma on a timer (no "I'M IN" / "Continue" buttons), then calls
   * onComplete. Used by the /demo page so testers can watch the whole
   * graduation arc without clicking.
   *
   * Default: false (real students get the full ceremony with click-through).
   */
  demoMode?: boolean;
}

type Scene = "letter" | "complete" | "reveal" | "diploma";

export default function CompletionCeremony({
  studentName,
  businessName,
  businessNiche,
  ikigai,
  onComplete,
  showAnswerLabels = false,
  demoMode = false,
}: CeremonyProps) {
  const [activeScene, setActiveScene] = useState<Scene>(demoMode ? "reveal" : "letter");
  const [exitingScene, setExitingScene] = useState<Scene | null>(null);
  const [letterPhase, setLetterPhase] = useState<"hidden" | "p1" | "p2" | "sig" | "reading" | "fading">("hidden");
  const [revealedCircles, setRevealedCircles] = useState<number[]>([]);
  const [revealedAnswers, setRevealedAnswers] = useState<number[]>([]);
  // ── VIGIL state ──
  // The four parents do not contract. There is no center collapse.
  // The ember ignites between them, the name is born, the parents
  // remain and applaud their child.
  const [emberLit, setEmberLit] = useState(false);
  const [emberSettled, setEmberSettled] = useState(false);
  const [bizVisible, setBizVisible] = useState(false);
  const [applauseRipple, setApplauseRipple] = useState(false);
  const [applauding, setApplauding] = useState(false);
  const [imInVisible, setImInVisible] = useState(false);
  const mountedRef = useRef(true);

  const firstName = studentName.split(" ")[0] || "there";

  // Dust motes — generated once per mount. Below conscious notice
  // but the eye knows the scene is INHABITED.
  const dustMotes = useMemo(
    () =>
      Array.from({ length: 12 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * -26,
        duration: 24 + Math.random() * 14,
      })),
    []
  );

  // Ikigai answers for the reveal
  const answers = ikigai
    ? [
        ikigai.passions.slice(0, 3).join(", "),
        ikigai.skills.slice(0, 3).join(", "),
        ikigai.needs.slice(0, 3).join(", "),
        typeof ikigai.monetization === "string" ? ikigai.monetization : "Creative Services",
      ]
    : ["What you love", "What you're good at", "What the world needs", "How you earn"];

  const transitionTo = useCallback(
    async (to: Scene, duration = PHI * BASE) => {
      setExitingScene(activeScene);
      await sleep(duration);
      if (!mountedRef.current) return;
      setActiveScene(to);
      setExitingScene(null);
    },
    [activeScene]
  );

  // ─── MAIN SEQUENCE ───
  // Runs ONCE on mount. Must not depend on activeScene, or self-transitions
  // below would cancel the sequence mid-flight via the cleanup.
  // In demoMode: skips the letter and "Program Complete" scenes entirely
  // and starts directly on the Ikigai reveal.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // ── Skip the founder's letter + Program Complete scenes in demo mode ──
      if (!demoMode) {
        await sleep(PHI * BASE);
        if (cancelled) return;
        setLetterPhase("p1"); // "Dear [name],"

        await sleep(2.618 * BASE);
        if (cancelled) return;
        setLetterPhase("p2"); // Main text

        await sleep(4.236 * BASE);
        if (cancelled) return;
        setLetterPhase("sig"); // Signature

        await sleep(4.236 * BASE);
        if (cancelled) return;
        setLetterPhase("fading"); // Dissolve all

        await sleep(3.236 * BASE); // Hold darkness

        if (cancelled) return;
        // Transition to Program Complete
        setExitingScene("letter");
        await sleep(618);
        if (cancelled) return;
        setActiveScene("complete");
        setExitingScene(null);

        // Hold "Program Complete"
        await sleep(PHI * PHI * PHI * BASE);

        if (cancelled) return;
        setExitingScene("complete");
        await sleep(PHI * BASE);
        if (cancelled) return;
        setActiveScene("reveal");
        setExitingScene(null);
      }

      // ── REVEAL SCENE (VIGIL) — runs in both modes ──
      // Beat 0: silence in the void.
      await sleep(demoMode ? 0.5 * BASE : 1.2 * BASE);

      // Beat 1: the four parents arrive, gentle and slow.
      // 1.4s stagger between births. Each takes 3.236s to fully bloom
      // (CSS handles the transform/opacity curve).
      for (let i = 0; i < 4; i++) {
        if (cancelled) return;
        setRevealedCircles((prev) => [...prev, i]);
        // Answer label state still updates so showAnswerLabels keeps working.
        setRevealedAnswers((prev) => [...prev, i]);
        await sleep(1.4 * BASE);
      }

      // Beat 2: let the four breathe together. φ seconds — Kuleshov
      // compositional-read ceiling for a 4-element symmetric shot.
      await sleep(1.618 * BASE);

      // Beat 3: the ember ignites between the parents. No collapse.
      // No sacrifice. The light gathers from nothing, in the negative
      // space the parents hold open. They remain.
      if (cancelled) return;
      setEmberLit(true);

      // Wait through ignition. φ² seconds — ember passes its 35%
      // warmth keyframe at ~2.26s in, curiosity peaks before it decays.
      await sleep(2.618 * BASE);

      // Beat 4: held breath. φ⁻¹ seconds — Walter Murch's "inhale
      // before the cut". 618ms is the golden pause inside that window.
      await sleep(0.618 * BASE);

      // Beat 5: the name is born. Ember settles into a soft halo.
      if (cancelled) return;
      setBizVisible(true);
      setEmberSettled(true);

      // Wait for the name to fully form
      await sleep(1.8 * BASE);

      // Beat 6: applause. ONE shockwave ripples outward through the
      // parents. As it passes them, they brighten in response. Witness.
      if (cancelled) return;
      setApplauseRipple(true);
      setApplauding(true);

      // Beat 7: hold the final tableau.
      await sleep(PHI * PHI * BASE);
      if (cancelled) return;

      // Demo mode plays the full graduation arc on its own timer — no
      // "I'M IN" button. Sequence: reveal → founder's letter → diploma → done.
      // Real students click through the buttons themselves.
      if (demoMode) {
        await sleep(PHI * BASE); // Let the name breathe

        // ── Founder's letter ──
        if (cancelled) return;
        setExitingScene("reveal");
        await sleep(PHI * BASE);
        if (cancelled) return;
        setActiveScene("letter");
        setExitingScene(null);

        // Cycle through the letter phases (same beats as real mode)
        await sleep(PHI * BASE);
        if (cancelled) return;
        setLetterPhase("p1");

        await sleep(2.618 * BASE);
        if (cancelled) return;
        setLetterPhase("p2");

        await sleep(4.236 * BASE);
        if (cancelled) return;
        setLetterPhase("sig");

        await sleep(4.236 * BASE);
        if (cancelled) return;
        setLetterPhase("fading");

        await sleep(2 * BASE);

        // ── Diploma ──
        if (cancelled) return;
        setExitingScene("letter");
        await sleep(PHI * BASE);
        if (cancelled) return;
        setActiveScene("diploma");
        setExitingScene(null);

        await sleep(PHI * PHI * PHI * BASE); // Hold the diploma
        if (cancelled) return;
        onComplete();
      } else {
        setImInVisible(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const sceneClass = (scene: Scene) =>
    `ceremony-scene ${activeScene === scene ? "active" : ""} ${exitingScene === scene ? "exiting" : ""}`;

  const letterPVisible = (phase: string) => {
    const phases = ["p1", "p2", "sig", "reading"];
    if (letterPhase === "fading") return "ceremony-letter-fade-out";
    if (phases.indexOf(letterPhase) >= phases.indexOf(phase)) return "ceremony-letter-fade-in";
    return "";
  };


  return (
    <div className="ceremony-root">
      {/* Scene 1: Founder's Letter */}
      <div className={sceneClass("letter")}>
        <div className="ceremony-letter-content">
          <p className={letterPVisible("p1")}>Dear {firstName},</p>
          <p className={letterPVisible("p2")}>
            With this launchpad, I only hope you realize all that you are capable
            of. I started this platform with nothing but a vision, and an
            unstoppable will. You are capable of more than you know.
          </p>
          <p className={`ceremony-letter-signature ${letterPVisible("sig")}`}>
            <span className="ceremony-letter-name">&mdash; AJ Rogers, age 19</span>
            <span className="ceremony-letter-title">Founder of Adaptable</span>
          </p>
        </div>
      </div>

      {/* Scene 2: Program Complete */}
      <div className={sceneClass("complete")}>
        <span className="ceremony-complete-text">Program Complete.</span>
      </div>

      {/* Scene 3: Ikigai Reveal — VIGIL
          The four parents do not disappear. The name is born between
          them. They remain, lit, and applaud their child. */}
      <div className={sceneClass("reveal")}>
        {/* Background dust field — 12 motes drift slowly */}
        <div className="ceremony-particles">
          {dustMotes.map((m, i) => (
            <div
              key={i}
              className="ceremony-dust-mote"
              style={{
                left: `${m.left}%`,
                top: `${m.top}%`,
                animationDelay: `${m.delay}s`,
                animationDuration: `${m.duration}s`,
              }}
            />
          ))}
        </div>
        <div className="ceremony-vignette" />
        <div className="ceremony-ambient-glow" />

        <div className="ceremony-ik-wrap">
          {/* Answer labels — hidden by default. showAnswerLabels prop kept
              for backward compat with any callers that pass it. */}
          {showAnswerLabels &&
            ["a1", "a2", "a3", "a4"].map((cls, i) => (
              <div
                key={cls}
                className={`ceremony-ik-answer ${cls} ${revealedAnswers.includes(i) ? "visible" : ""}`}
              >
                {answers[i]}
              </div>
            ))}

          {/* Four parents — born one by one, breathe on their own
              periods, applaud when the child is named. */}
          {["c1", "c2", "c3", "c4"].map((cls, i) => (
            <div
              key={cls}
              className={`ceremony-ik-circle ${cls} ${revealedCircles.includes(i) ? "reveal" : ""} ${applauding ? "applauding" : ""}`}
            />
          ))}

          {/* Ember — ignites between the parents, then settles into a halo */}
          <div className={`ceremony-ik-ember ${emberLit ? "lit" : ""} ${emberSettled ? "settled" : ""}`} />

          {/* Applause — single shockwave ripples through the parents */}
          <div className={`ceremony-ik-applause ${applauseRipple ? "ripple" : ""}`} />

          {/* Business name — the christening */}
          <div className={`ceremony-biz-wrap ${bizVisible ? "birthing" : ""}`}>
            <span className="ceremony-biz-name">{businessName}</span>
          </div>
        </div>

        {/* I'm in */}
        <div className={`ceremony-imin-wrap ${imInVisible ? "visible" : ""}`}>
          <button
            className="ceremony-imin"
            onClick={() => {
              setExitingScene("reveal");
              setTimeout(() => {
                setActiveScene("diploma");
                setExitingScene(null);
              }, PHI * BASE);
            }}
          >
            I&apos;M IN
          </button>
        </div>
      </div>

      {/* Scene 4: Diploma */}
      <div className={sceneClass("diploma")}>
        <div className="ceremony-diploma">
          <div className="ceremony-diploma-institution">Adaptable Venture Program</div>
          <div className="ceremony-diploma-title">Certificate of Completion</div>
          <div className="ceremony-diploma-name">{studentName}</div>
          <div className="ceremony-diploma-body">
            has completed the Adaptable Venture Program and designed{" "}
            <strong>{businessName}</strong>, {businessNiche}
          </div>
          <div className="ceremony-diploma-date">
            {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </div>
          <div className="ceremony-diploma-id">
            AVP-{new Date().getFullYear()}-{Math.random().toString(36).slice(2, 6).toUpperCase()}
          </div>
        </div>
        <button
          className="ceremony-diploma-continue"
          onClick={onComplete}
        >
          Begin
        </button>
      </div>
    </div>
  );
}
