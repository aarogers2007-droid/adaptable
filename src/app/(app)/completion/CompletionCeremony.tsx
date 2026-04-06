"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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
}

type Scene = "letter" | "complete" | "reveal" | "diploma" | "farewell";

export default function CompletionCeremony({
  studentName,
  businessName,
  businessNiche,
  ikigai,
  onComplete,
}: CeremonyProps) {
  const [activeScene, setActiveScene] = useState<Scene>("letter");
  const [exitingScene, setExitingScene] = useState<Scene | null>(null);
  const [letterPhase, setLetterPhase] = useState<"hidden" | "p1" | "p2" | "sig" | "reading" | "fading">("hidden");
  const [revealedCircles, setRevealedCircles] = useState<number[]>([]);
  const [revealedAnswers, setRevealedAnswers] = useState<number[]>([]);
  const [centerVisible, setCenterVisible] = useState(false);
  const [contracting, setContracting] = useState(false);
  const [centerAbsorb, setCenterAbsorb] = useState(false);
  const [centerCollapse, setCenterCollapse] = useState(false);
  const [shockwave, setShockwave] = useState(false);
  const [bizVisible, setBizVisible] = useState(false);
  const [circlesReturning, setCirclesReturning] = useState(false);
  const [originVisible, setOriginVisible] = useState(false);
  const [imInVisible, setImInVisible] = useState(false);
  const [farewellText, setFarewellText] = useState("");
  const [farewellDone, setFarewellDone] = useState(false);
  const [farewellCtaVisible, setFarewellCtaVisible] = useState(false);
  const mountedRef = useRef(true);

  const firstName = studentName.split(" ")[0] || "there";

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

  // ─── SCENE 1 → 3: FOUNDER'S LETTER → COMPLETE → REVEAL ───
  // Runs ONCE on mount. Must not depend on activeScene, or self-transitions
  // below would cancel the sequence mid-flight via the cleanup.
  useEffect(() => {
    let cancelled = false;

    (async () => {
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

      // Ikigai reveal sequence
      await sleep(BASE);

      for (let i = 0; i < 4; i++) {
        if (cancelled) return;
        setRevealedCircles((prev) => [...prev, i]);
        await sleep(PHI * BASE);
        if (cancelled) return;
        setRevealedAnswers((prev) => [...prev, i]);
        await sleep(BASE);
      }

      await sleep(PHI * PHI * BASE); // Let all four breathe together

      // Gravitational collapse — circles contract inward
      if (cancelled) return;
      setContracting(true);

      // Wait for contraction to near completion, then center absorbs
      await sleep(1.618 * BASE);
      if (cancelled) return;
      setCenterAbsorb(true);
      await sleep(PHI * BASE);

      // Center collapses and disappears
      if (cancelled) return;
      setCenterCollapse(true);
      setCenterAbsorb(false);

      // Shockwaves
      await sleep(0.382 * BASE);
      if (cancelled) return;
      setShockwave(true);

      // Business name fades in with glow
      await sleep(0.382 * BASE);
      if (cancelled) return;
      setBizVisible(true);

      // Wait for name + glow to settle
      await sleep(PHI * PHI * BASE);

      // "This came from who you are."
      if (cancelled) return;
      setOriginVisible(true);

      // Circles return as ghosts
      await sleep(PHI * BASE);
      if (cancelled) return;
      setCirclesReturning(true);

      await sleep(PHI * PHI * BASE);
      if (cancelled) return;
      setImInVisible(true);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── MENTOR FAREWELL TYPEWRITER ───
  useEffect(() => {
    if (activeScene !== "farewell") return;
    let cancelled = false;

    const text = `${firstName}. I remember when you first told me about ${businessName}. You said it like you weren\u2019t sure you were allowed to want something that big. You were.\n\nYou didn\u2019t take the easy path. When the hard decisions came, you made them. When the research challenged what you assumed, you actually listened. That takes more courage than most adults ever show.\n\n${businessName} is real. You built it from who you are \u2014 not from a template, not from what someone told you to care about. From you.\n\nI\u2019ll be here. For this venture, the next one, or just to talk.`;

    (async () => {
      let built = "";
      for (let i = 0; i < text.length; i++) {
        if (cancelled) return;
        const char = text[i];
        if (char === "\n") {
          built += "<br>";
        } else {
          built += char;
        }
        setFarewellText(built);

        if (char === "." || char === "?") await sleep(450);
        else if (char === ",") await sleep(180);
        else if (char === "\n") await sleep(700);
        else if (char === "\u2014") await sleep(280);
        else await sleep(50);
      }
      if (cancelled) return;
      setFarewellDone(true);
      await sleep(PHI * PHI * BASE);
      if (cancelled) return;
      setFarewellCtaVisible(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeScene, firstName, businessName]);

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

      {/* Scene 3: Ikigai Reveal */}
      <div className={sceneClass("reveal")}>
        <div className="ceremony-particles" />
        <div className="ceremony-ambient-glow" />

        <div className="ceremony-ik-wrap">
          {/* Answer labels */}
          {["a1", "a2", "a3", "a4"].map((cls, i) => (
            <div
              key={cls}
              className={`ceremony-ik-answer ${cls} ${revealedAnswers.includes(i) ? "visible" : ""}`}
            >
              {answers[i]}
            </div>
          ))}

          {/* Four circles — collapse inward, then return as ghosts */}
          {["c1", "c2", "c3", "c4"].map((cls, i) => (
            <div
              key={cls}
              className={`ceremony-ik-circle ${cls} ${revealedCircles.includes(i) ? "reveal" : ""} ${contracting ? "contracting" : ""} ${circlesReturning ? "returning" : ""}`}
              style={contracting ? { animationDelay: `${i * 0.382}s` } : circlesReturning ? { animationDelay: `${i * 0.236}s` } : undefined}
            />
          ))}

          {/* Center glow — absorbs then collapses to nothing */}
          <div className={`ceremony-ik-center ${centerAbsorb ? "absorb" : ""} ${centerCollapse ? "collapse" : ""}`} />

          {/* Shockwaves */}
          {shockwave && (
            <>
              <div className="ceremony-shockwave expanding" />
              <div className="ceremony-shockwave s2 expanding" style={{ animationDelay: "0.236s" }} />
            </>
          )}

          {/* Business name — fades in with glow burst */}
          <div className={`ceremony-biz-wrap ${bizVisible ? "birthing" : ""}`}>
            <span className="ceremony-biz-name">{businessName}</span>
            <span className={`ceremony-biz-origin ${originVisible ? "visible" : ""}`}>
              This came from who you are.
            </span>
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
          onClick={() => {
            setExitingScene("diploma");
            setTimeout(() => {
              setActiveScene("farewell");
              setExitingScene(null);
            }, PHI * BASE);
          }}
        >
          Continue
        </button>
      </div>

      {/* Scene 5: Mentor Farewell */}
      <div className={sceneClass("farewell")}>
        <div className="ceremony-farewell-content">
          <div className="ceremony-farewell-mentor">Nova</div>
          <div className="ceremony-farewell-text">
            <span dangerouslySetInnerHTML={{ __html: farewellText }} />
            {!farewellDone && <span className="ceremony-farewell-cursor" />}
          </div>
          <div className={`ceremony-farewell-cta ${farewellCtaVisible ? "visible" : ""}`}>
            <button onClick={onComplete}>Begin</button>
          </div>
        </div>
      </div>
    </div>
  );
}
