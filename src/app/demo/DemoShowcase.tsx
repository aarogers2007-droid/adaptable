"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const PHI = 1.618034;
const BASE = 1000;
function sleep(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

type Scene =
  | "welcome"
  | "ikigai-def"
  | "ikigai-love"
  | "ikigai-good"
  | "ikigai-needs"
  | "ikigai-paid"
  | "ikigai-reveal"
  | "dashboard"
  | "lesson-entrance"
  | "lesson-convo"
  | "lesson-complete"
  | "ceremony-letter"
  | "ceremony-complete"
  | "ceremony-reveal"
  | "ceremony-diploma"
  | "ceremony-farewell"
  | "end";

const IKIGAI_ANSWERS = {
  love: ["Painting", "Drawing", "Helping others create"],
  good: ["Visual composition", "Color theory", "Teaching"],
  needs: ["Creative outlets", "Art education", "Self-expression"],
  paid: ["Art workshops", "Private lessons", "Commissions"],
};

const BUSINESS_NAME = "Studio Bloom";
const STUDENT_NAME = "Elsa";

export default function DemoShowcase() {
  const [scene, setScene] = useState<Scene>("welcome");
  const [transitioning, setTransitioning] = useState(false);
  const [subPhase, setSubPhase] = useState(0);

  // Ikigai wizard state
  const [typedItems, setTypedItems] = useState<string[]>([]);
  const [circlesDone, setCirclesDone] = useState<string[]>([]);

  // Lesson state
  const [lessonMessages, setLessonMessages] = useState<{ role: string; text: string }[]>([]);
  const [lessonInput, setLessonInput] = useState("");
  const [lessonThinking, setLessonThinking] = useState(false);
  const [checkpointShown, setCheckpointShown] = useState(false);

  // Ceremony state
  const [letterPhase, setLetterPhase] = useState(0);
  const [revealCircles, setRevealCircles] = useState<number[]>([]);
  const [revealCenter, setRevealCenter] = useState(false);
  const [revealName, setRevealName] = useState(false);
  const [farewellText, setFarewellText] = useState("");
  const [farewellDone, setFarewellDone] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(async (next: Scene) => {
    setTransitioning(true);
    await sleep(800);
    setScene(next);
    setSubPhase(0);
    setTransitioning(false);
  }, []);

  // Auto-scroll lesson messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lessonMessages, lessonThinking]);

  // Scene-specific auto-play effects
  useEffect(() => {
    if (scene === "ikigai-def") {
      // Fade in the definition
      const t1 = setTimeout(() => setSubPhase(1), 800);
      const t2 = setTimeout(() => setSubPhase(2), 2000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }

    if (["ikigai-love", "ikigai-good", "ikigai-needs", "ikigai-paid"].includes(scene)) {
      // Auto-type items for this circle
      const key = scene.replace("ikigai-", "") as keyof typeof IKIGAI_ANSWERS;
      const items = IKIGAI_ANSWERS[key];
      setTypedItems([]);
      let cancelled = false;
      (async () => {
        for (let i = 0; i < items.length; i++) {
          await sleep(800);
          if (cancelled) return;
          setTypedItems((prev) => [...prev, items[i]]);
        }
        await sleep(1200);
        if (cancelled) return;
        setSubPhase(1); // Show "continue" button
      })();
      return () => { cancelled = true; };
    }

    if (scene === "ikigai-reveal") {
      // Gravitational collapse sequence
      let cancelled = false;
      (async () => {
        await sleep(PHI * PHI * BASE);
        if (cancelled) return;
        setSubPhase(1); // contracting
        await sleep(2.618 * BASE);
        if (cancelled) return;
        setSubPhase(2); // center absorb
        await sleep(PHI * BASE);
        if (cancelled) return;
        setSubPhase(3); // collapse + shockwave + name
        await sleep(2.618 * BASE);
        if (cancelled) return;
        setSubPhase(4); // origin text + continue
      })();
      return () => { cancelled = true; };
    }

    if (scene === "lesson-entrance") {
      let cancelled = false;
      (async () => {
        await sleep(800);
        if (cancelled) return;
        setSubPhase(1);
        await sleep(600);
        if (cancelled) return;
        setSubPhase(2);
        await sleep(1800);
        if (cancelled) return;
        setSubPhase(3); // dissolve
        await sleep(1000);
        if (cancelled) return;
        goTo("lesson-convo");
      })();
      return () => { cancelled = true; };
    }

    if (scene === "lesson-convo") {
      setLessonMessages([]);
      setCheckpointShown(false);
      let cancelled = false;
      (async () => {
        await sleep(800);
        if (cancelled) return;
        setLessonMessages([
          { role: "ai", text: "Let's think about who your ideal customer really is. Not just \"everyone\" — but the specific person who would be MOST excited about Studio Bloom." },
        ]);
        await sleep(3000);
        if (cancelled) return;
        setLessonMessages((prev) => [...prev, { role: "ai", text: "Think about age, location, and what problem they're trying to solve. Who comes to mind?" }]);
        await sleep(2000);
        if (cancelled) return;
        setSubPhase(1); // show input for "see it for yourself"
      })();
      return () => { cancelled = true; };
    }

    if (scene === "ceremony-letter") {
      let cancelled = false;
      (async () => {
        await sleep(PHI * BASE);
        if (cancelled) return;
        setLetterPhase(1);
        await sleep(2.618 * BASE);
        if (cancelled) return;
        setLetterPhase(2);
        await sleep(4.236 * BASE);
        if (cancelled) return;
        setLetterPhase(3);
        await sleep(4.236 * BASE);
        if (cancelled) return;
        setLetterPhase(4); // fade out
        await sleep(3 * BASE);
        if (cancelled) return;
        goTo("ceremony-complete");
      })();
      return () => { cancelled = true; };
    }

    if (scene === "ceremony-complete") {
      const t = setTimeout(() => goTo("ceremony-reveal"), PHI * PHI * PHI * BASE);
      return () => clearTimeout(t);
    }

    if (scene === "ceremony-reveal") {
      let cancelled = false;
      (async () => {
        await sleep(BASE);
        for (let i = 0; i < 4; i++) {
          if (cancelled) return;
          setRevealCircles((prev) => [...prev, i]);
          await sleep(PHI * BASE);
        }
        await sleep(PHI * PHI * BASE);
        if (cancelled) return;
        setRevealCenter(true);
        await sleep(PHI * PHI * BASE);
        if (cancelled) return;
        setSubPhase(1); // contract
        await sleep(2.618 * BASE);
        if (cancelled) return;
        setSubPhase(2); // name
        setRevealName(true);
        await sleep(PHI * PHI * BASE);
        if (cancelled) return;
        setSubPhase(3); // continue button
      })();
      return () => { cancelled = true; };
    }

    if (scene === "ceremony-farewell") {
      let cancelled = false;
      const text = `${STUDENT_NAME}. I remember when you first told me about ${BUSINESS_NAME}. You said it like you weren\u2019t sure you were allowed to want something that big. You were.\n\nYou didn\u2019t take the easy path. When the hard decisions came, you made them. When the research challenged what you assumed, you actually listened.\n\n${BUSINESS_NAME} is real. You built it from who you are.\n\nI\u2019ll be here. For this venture, the next one, or just to talk.`;
      (async () => {
        let built = "";
        for (let i = 0; i < text.length; i++) {
          if (cancelled) return;
          built += text[i] === "\n" ? "<br>" : text[i];
          setFarewellText(built);
          if (text[i] === "." || text[i] === "?") await sleep(400);
          else if (text[i] === ",") await sleep(150);
          else if (text[i] === "\n") await sleep(600);
          else await sleep(45);
        }
        if (cancelled) return;
        setFarewellDone(true);
      })();
      return () => { cancelled = true; };
    }
  }, [scene, goTo]);

  // Lesson: handle user sending a message
  async function handleLessonSend() {
    if (!lessonInput.trim()) return;
    const text = lessonInput.trim();
    setLessonInput("");
    setLessonMessages((prev) => [...prev, { role: "user", text }]);
    setSubPhase(0); // hide input

    await sleep(1000);
    setLessonThinking(true);
    await sleep(2500);
    setLessonThinking(false);

    setLessonMessages((prev) => [...prev, {
      role: "ai",
      text: `That\u2019s a great answer. You\u2019re already thinking like a founder. The specificity matters \u2014 it means you can actually find these people and talk to them.`,
    }]);

    await sleep(1500);
    setCheckpointShown(true);

    await sleep(3000);
    setCheckpointShown(false);
    setSubPhase(2); // show "continue to completion" button
  }

  const sceneActive = (s: Scene) => scene === s && !transitioning;

  return (
    <div className="demo-root">
      <style>{`
        .demo-root {
          position: fixed; inset: 0; background: #000; color: #fff;
          font-family: var(--font-body), 'DM Sans', sans-serif;
          overflow: hidden;
        }
        .demo-scene {
          position: fixed; inset: 0; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.8s ease-in-out; pointer-events: none;
        }
        .demo-scene.active { opacity: 1; pointer-events: auto; }

        .demo-btn {
          background: transparent; border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.5); padding: 14px 40px; font-size: 13px;
          font-weight: 600; letter-spacing: 0.1em; border-radius: 8px;
          cursor: pointer; transition: all 0.3s; margin-top: 32px;
          font-family: inherit;
        }
        .demo-btn:hover { border-color: rgba(255,255,255,0.4); color: rgba(255,255,255,0.85); }
        .demo-btn-primary {
          background: #0D9488; border-color: #0D9488; color: #fff;
        }
        .demo-btn-primary:hover { background: #0F766E; border-color: #0F766E; }
        .demo-btn-amber {
          background: #F59E0B; border-color: #F59E0B; color: #111827;
        }

        /* Welcome */
        .demo-welcome-badge { font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: #0D9488; }
        .demo-welcome-title { font-family: var(--font-display), 'Satoshi', sans-serif; font-size: 44px; font-weight: 800; margin-top: 12px; text-align: center; }
        .demo-welcome-sub { font-size: 17px; color: rgba(255,255,255,0.5); margin-top: 12px; text-align: center; max-width: 480px; line-height: 1.618; }

        /* Ikigai definition */
        .demo-def { max-width: 480px; text-align: left; }
        .demo-def-word { font-family: Georgia, serif; font-size: 28px; font-weight: 700; font-style: italic; color: rgba(255,255,255,0.85); }
        .demo-def-pron { font-family: Georgia, serif; font-size: 14px; color: rgba(255,255,255,0.35); margin-top: 4px; font-style: italic; }
        .demo-def-body { font-family: Georgia, serif; font-size: 17px; line-height: 1.618; color: rgba(255,255,255,0.65); margin-top: 20px; }
        .demo-def-body em { color: rgba(255,255,255,0.85); font-style: italic; }

        /* Ikigai wizard circles */
        .demo-wizard { position: relative; width: min(400px, 80vw); aspect-ratio: 1/1; }
        .demo-wiz-circle {
          position: absolute; border-radius: 50%; width: 50%; height: 50%;
          transform: translate(-50%,-50%); opacity: 0.2; transition: opacity 0.6s;
        }
        .demo-wiz-circle.active { opacity: 0.618; }
        .demo-wiz-circle.done { opacity: 0.4; }
        .demo-wiz-circle.c1 { background: #F5E642; left: 50%; top: 19.1%; }
        .demo-wiz-circle.c2 { background: #A8DB5A; left: 19.1%; top: 50%; }
        .demo-wiz-circle.c3 { background: #F4A79D; left: 80.9%; top: 50%; }
        .demo-wiz-circle.c4 { background: #6DD5D0; left: 50%; top: 80.9%; }

        .demo-wiz-label {
          position: absolute; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.7); text-align: center;
        }
        .demo-wiz-items {
          position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%);
          text-align: center; z-index: 5;
        }
        .demo-wiz-item {
          display: inline-block; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
          border-radius: 99px; padding: 6px 16px; margin: 4px; font-size: 13px; color: rgba(255,255,255,0.8);
          animation: demo-chip-in 0.4s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes demo-chip-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }

        /* Gravitational collapse (reuses ceremony CSS from globals) */
        .demo-collapse-circle {
          position: absolute; border-radius: 50%; width: 50%; height: 50%;
          transform: translate(-50%,-50%); opacity: 0.618;
          transition: all 2.618s cubic-bezier(0.55,0,0.2,1);
        }
        .demo-collapse-circle.contracting {
          left: 50% !important; top: 50% !important; width: 3% !important; height: 3% !important; opacity: 0 !important;
        }
        .demo-reveal-center {
          position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%);
          width: 19.1%; height: 19.1%; border-radius: 50%;
          background: radial-gradient(circle, #4A6741 38.2%, #8B9E6A 61.8%, transparent 100%);
          box-shadow: 0 0 40px rgba(74,103,65,0.5); opacity: 0;
          transition: all 1.618s ease-out;
        }
        .demo-reveal-center.show { opacity: 1; }
        .demo-reveal-center.collapse { opacity: 0; transform: translate(-50%,-50%) scale(0.3); }
        .demo-reveal-name {
          position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%);
          z-index: 10; text-align: center; opacity: 0; transition: opacity 2.618s ease-out;
          font-family: var(--font-display), 'Satoshi', sans-serif;
        }
        .demo-reveal-name.show { opacity: 1; }
        .demo-reveal-name .name { font-size: 28px; font-weight: 800; color: #fff; text-shadow: 0 0 28px rgba(74,103,65,0.5); }
        .demo-reveal-name .origin { display: block; margin-top: 11px; font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.35); letter-spacing: 0.146em; }

        /* Dashboard mockup */
        .demo-dash { background: #f9fafb; border-radius: 12px; padding: 24px; width: min(500px, 85vw); text-align: left; }
        .demo-dash h2 { font-family: var(--font-display), 'Satoshi', sans-serif; font-size: 24px; font-weight: 700; color: #111827; }
        .demo-dash .sub { font-size: 13px; color: #6b7280; margin-top: 4px; }
        .demo-dash .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-top: 16px; }
        .demo-dash .card-label { font-size: 10px; font-weight: 600; color: #0D9488; text-transform: uppercase; letter-spacing: 0.1em; }
        .demo-dash .card-title { font-size: 18px; font-weight: 700; color: #111827; margin-top: 4px; }
        .demo-dash .bar { height: 8px; border-radius: 99px; background: #f3f4f6; margin-top: 12px; overflow: hidden; }
        .demo-dash .bar-fill { height: 100%; width: 0%; border-radius: 99px; background: linear-gradient(90deg, #F5E642, #A8DB5A, #F4A79D, #6DD5D0); transition: width 1.5s cubic-bezier(0.16,1,0.3,1); }

        /* Lesson mockup */
        .demo-lesson { background: #fff; border-radius: 12px; width: min(520px, 90vw); height: min(500px, 70vh); display: flex; flex-direction: column; overflow: hidden; }
        .demo-lesson-header { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; background: #fff; }
        .demo-lesson-msgs { flex: 1; overflow-y: auto; padding: 16px; }
        .demo-lesson-msg { margin-bottom: 16px; animation: demo-msg-in 0.5s ease-out; }
        @keyframes demo-msg-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .demo-lesson-ai { max-width: 85%; }
        .demo-lesson-ai .bubble { background: #f3f4f6; color: #111827; border-radius: 16px; padding: 14px 18px; font-size: 14px; line-height: 1.6; position: relative; box-shadow: 0 0 20px rgba(13,148,136,0.04); }
        .demo-lesson-ai .bubble::before { content: ''; position: absolute; left: 0; top: 10px; bottom: 10px; width: 2px; border-radius: 1px; background: linear-gradient(to bottom, #F5E642, #A8DB5A, #F4A79D, #6DD5D0); }
        .demo-lesson-user { text-align: right; }
        .demo-lesson-user .bubble { display: inline-block; background: #0D9488; color: #fff; border-radius: 16px; padding: 10px 16px; font-size: 14px; line-height: 1.6; max-width: 80%; text-align: left; }
        .demo-lesson-guide { display: flex; align-items: center; gap: 4px; margin-bottom: 3px; }
        .demo-lesson-guide span { font-size: 9px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; }
        .demo-lesson-input { padding: 12px 16px; border-top: 1px solid #e5e7eb; display: flex; gap: 8px; }
        .demo-lesson-input input { flex: 1; border: 1px solid #d1d5db; border-radius: 10px; padding: 8px 12px; font-size: 14px; outline: none; font-family: inherit; }
        .demo-lesson-input input:focus { border-color: #0D9488; box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
        .demo-lesson-input button { background: #0D9488; color: #fff; border: none; border-radius: 10px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .demo-checkpoint { text-align: center; padding: 8px; margin: 8px 0; border-radius: 8px; background: linear-gradient(90deg, rgba(245,230,66,0.08), rgba(168,219,90,0.08), rgba(244,167,157,0.08), rgba(109,213,208,0.08)); border: 1px solid rgba(13,148,136,0.15); animation: demo-cp-in 0.4s ease-out; }
        @keyframes demo-cp-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .demo-thinking { display: flex; gap: 5px; padding: 8px 4px; }
        .demo-tdot { width: 7px; height: 7px; border-radius: 50%; animation: demo-tdot 1.2s ease-in-out infinite; }
        .demo-tdot:nth-child(1) { background: #F5E642; animation-delay: 0ms; }
        .demo-tdot:nth-child(2) { background: #A8DB5A; animation-delay: 150ms; }
        .demo-tdot:nth-child(3) { background: #F4A79D; animation-delay: 300ms; }
        @keyframes demo-tdot { 0%,60%,100% { opacity: 0.3; transform: scale(0.8); } 30% { opacity: 1; transform: scale(1); } }

        /* Ceremony scenes */
        .demo-letter { max-width: 480px; font-family: var(--font-serif), Georgia, serif; font-size: 17px; line-height: 1.618; color: rgba(255,255,255,0.75); text-align: left; }
        .demo-letter p { margin-bottom: 1.618em; opacity: 0; transform: translateY(6px); transition: opacity 1.618s ease-out, transform 1.618s ease-out; }
        .demo-letter p.show { opacity: 1; transform: translateY(0); }
        .demo-letter p.fade { opacity: 0; transition: opacity 2.618s ease-in; }
        .demo-letter .sig { margin-top: 2.618em; font-style: italic; color: rgba(255,255,255,0.6); }
        .demo-letter .sig-name { font-style: normal; font-weight: 600; color: rgba(255,255,255,0.7); display: block; margin-top: 6px; }
        .demo-letter .sig-title { font-style: normal; font-size: 11px; color: rgba(255,255,255,0.4); display: block; margin-top: 3px; }

        .demo-complete-text { font-size: 17px; font-weight: 600; letter-spacing: 0.236em; text-transform: uppercase; color: rgba(255,255,255,0.65); }

        /* Diploma */
        .demo-diploma {
          background: #f5f0e8; width: min(500px, 85vw); aspect-ratio: 1.618/1;
          border: 2px solid #c4b18a; outline: 1px solid #d4c9a8; outline-offset: 8px;
          padding: 8%; display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; position: relative;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), inset 0 0 80px rgba(196,177,138,0.08);
          opacity: 0; transform: scale(0.96); animation: demo-diploma-in 1.618s ease-out 0.5s forwards;
        }
        @keyframes demo-diploma-in { to { opacity: 1; transform: scale(1); } }
        .demo-diploma::before { content: ''; position: absolute; inset: 5px; border: 1px solid #d4c9a8; pointer-events: none; }
        .demo-diploma .inst { font-family: var(--font-serif), Georgia, serif; font-size: 11px; letter-spacing: 0.382em; text-transform: uppercase; color: #8a7d65; margin-bottom: 1.618em; }
        .demo-diploma .cert-title { font-family: var(--font-diploma), 'Playfair Display', serif; font-size: 17px; letter-spacing: 0.146em; text-transform: uppercase; color: #5c5240; margin-bottom: 0.618em; }
        .demo-diploma .sname { font-family: var(--font-diploma), 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #1a1712; margin-bottom: 0.618em; }
        .demo-diploma .cert-body { font-family: var(--font-serif), Georgia, serif; font-size: 11px; color: #6b6050; line-height: 1.618; max-width: 340px; margin-bottom: 1.618em; }
        .demo-diploma .cert-date { font-family: var(--font-serif), Georgia, serif; font-size: 11px; color: #9a8e78; }

        /* Farewell */
        .demo-farewell { max-width: 500px; text-align: left; }
        .demo-farewell-mentor { font-size: 11px; font-weight: 500; letter-spacing: 0.146em; color: rgba(255,255,255,0.22); margin-bottom: 1.618em; }
        .demo-farewell-text { font-size: 17px; line-height: 1.618; color: rgba(255,255,255,0.65); min-height: 180px; }
        .demo-farewell-cursor { display: inline-block; width: 2px; height: 1em; background: rgba(255,255,255,0.4); margin-left: 2px; animation: demo-blink 0.618s step-end infinite; vertical-align: text-bottom; }
        @keyframes demo-blink { 50% { opacity: 0; } }

        /* End */
        .demo-end-title { font-family: var(--font-display), 'Satoshi', sans-serif; font-size: 32px; font-weight: 800; text-align: center; }
        .demo-end-sub { font-size: 15px; color: rgba(255,255,255,0.4); text-align: center; margin-top: 12px; }

        /* Ambient glow for reveal scenes */
        .demo-ambient { position: absolute; width: 61.8vh; height: 61.8vh; left: 50%; top: 50%; transform: translate(-50%,-50%); background: radial-gradient(circle, rgba(25,50,82,0.09) 0%, transparent 61.8%); animation: demo-glow 6.854s ease-in-out infinite; }
        @keyframes demo-glow { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 0.618; } 50% { transform: translate(-50%,-50%) scale(1.146); opacity: 1; } }

        /* Scene label */
        .demo-scene-label {
          position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
          font-size: 9px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase;
          color: rgba(255,255,255,0.15); z-index: 50; white-space: nowrap;
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.1s !important; }
        }
      `}</style>

      {/* ═══ WELCOME ═══ */}
      <div className={`demo-scene ${sceneActive("welcome") ? "active" : ""}`}>
        <div className="demo-welcome-badge">A VentureLab Product</div>
        <h1 className="demo-welcome-title">Adaptable</h1>
        <p className="demo-welcome-sub">
          An AI-native venture studio where every student discovers what they care about,
          validates a real business idea, and builds a plan to launch it.
        </p>
        <p className="demo-welcome-sub" style={{ marginTop: "8px", fontSize: "14px", color: "rgba(255,255,255,0.3)" }}>
          This is {STUDENT_NAME}&apos;s journey.
        </p>
        <button className="demo-btn demo-btn-primary" onClick={() => goTo("ikigai-def")}>
          Begin
        </button>
      </div>

      {/* ═══ IKIGAI DEFINITION ═══ */}
      <div className={`demo-scene ${sceneActive("ikigai-def") ? "active" : ""}`}>
        <div className="demo-def">
          <div className="demo-def-word" style={{ opacity: subPhase >= 1 ? 1 : 0, transition: "opacity 1.618s" }}>
            Ikigai
          </div>
          <div className="demo-def-pron" style={{ opacity: subPhase >= 1 ? 1 : 0, transition: "opacity 1.618s 0.3s" }}>
            /ee-kee-guy/ &middot; noun
          </div>
          <div className="demo-def-body" style={{ opacity: subPhase >= 2 ? 1 : 0, transition: "opacity 1.618s" }}>
            A reason for being; the intersection of what you <em>love</em>, what you&apos;re <em>good at</em>,
            what the world <em>needs</em>, and what you can be <em>paid for</em>.
          </div>
        </div>
        {subPhase >= 2 && (
          <button className="demo-btn" onClick={() => goTo("ikigai-love")} style={{ opacity: subPhase >= 2 ? 1 : 0 }}>
            Continue
          </button>
        )}
      </div>

      {/* ═══ IKIGAI CIRCLES ═══ */}
      {(["love", "good", "needs", "paid"] as const).map((key, idx) => {
        const sceneKey = `ikigai-${key}` as Scene;
        const circleClass = ["c1", "c2", "c3", "c4"][idx];
        const labels = ["What you love", "What you're good at", "What the world needs", "What you can be paid for"];
        const labelPositions = [
          { left: "50%", top: "4%", transform: "translateX(-50%)" },
          { left: "2%", top: "48%" },
          { right: "2%", top: "48%", textAlign: "right" as const },
          { left: "50%", bottom: "2%", transform: "translateX(-50%)" },
        ];
        const nextScene = idx < 3 ? `ikigai-${(["love", "good", "needs", "paid"] as const)[idx + 1]}` as Scene : "ikigai-reveal" as Scene;

        return (
          <div key={key} className={`demo-scene ${sceneActive(sceneKey) ? "active" : ""}`}>
            <div className="demo-scene-label">{labels[idx]}</div>
            <div className="demo-wizard">
              {["c1", "c2", "c3", "c4"].map((c, ci) => (
                <div
                  key={c}
                  className={`demo-wiz-circle ${c} ${ci === idx ? "active" : ""} ${circlesDone.includes(c) ? "done" : ""}`}
                />
              ))}
              <div className="demo-wiz-label" style={labelPositions[idx]}>{labels[idx]}</div>
              <div className="demo-wiz-items">
                {typedItems.map((item, i) => (
                  <span key={i} className="demo-wiz-item">{item}</span>
                ))}
              </div>
            </div>
            {subPhase >= 1 && (
              <button
                className="demo-btn"
                onClick={() => {
                  setCirclesDone((prev) => [...prev, circleClass]);
                  setTypedItems([]);
                  goTo(nextScene);
                }}
              >
                Continue
              </button>
            )}
          </div>
        );
      })}

      {/* ═══ IKIGAI REVEAL — GRAVITATIONAL COLLAPSE ═══ */}
      <div className={`demo-scene ${sceneActive("ikigai-reveal") ? "active" : ""}`}>
        <div className="demo-ambient" />
        <div className="demo-wizard" style={{ zIndex: 2 }}>
          {[
            { c: "c1", bg: "#F5E642", left: "50%", top: "19.1%" },
            { c: "c2", bg: "#A8DB5A", left: "19.1%", top: "50%" },
            { c: "c3", bg: "#F4A79D", left: "80.9%", top: "50%" },
            { c: "c4", bg: "#6DD5D0", left: "50%", top: "80.9%" },
          ].map((circle) => (
            <div
              key={circle.c}
              className={`demo-collapse-circle ${subPhase >= 1 ? "contracting" : ""}`}
              style={{ background: circle.bg, left: circle.left, top: circle.top }}
            />
          ))}
          <div className={`demo-reveal-center ${subPhase >= 0 && subPhase < 3 ? "show" : ""} ${subPhase >= 3 ? "collapse" : ""}`} />
          <div className={`demo-reveal-name ${subPhase >= 3 ? "show" : ""}`}>
            <span className="name">{BUSINESS_NAME}</span>
            {subPhase >= 4 && <span className="origin">This came from who you are.</span>}
          </div>
        </div>
        {subPhase >= 4 && (
          <button className="demo-btn" style={{ zIndex: 10 }} onClick={() => goTo("dashboard")}>
            I&apos;M IN
          </button>
        )}
      </div>

      {/* ═══ DASHBOARD ═══ */}
      <div className={`demo-scene ${sceneActive("dashboard") ? "active" : ""}`}>
        <div className="demo-scene-label">Student Dashboard</div>
        <div className="demo-dash">
          <h2>{BUSINESS_NAME}</h2>
          <div className="sub">{STUDENT_NAME}&apos;s venture studio</div>
          <div className="card">
            <div className="card-label">Continue Learning</div>
            <div className="card-title">Lesson 4: Define Your Target Customer</div>
            <div className="bar">
              <div
                className="bar-fill"
                ref={(el) => { if (el && sceneActive("dashboard")) setTimeout(() => { el.style.width = "37.5%"; }, 300); }}
              />
            </div>
            <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "6px" }}>3 of 8 lessons complete</div>
          </div>
        </div>
        <button className="demo-btn demo-btn-primary" onClick={() => goTo("lesson-entrance")}>
          Enter Lesson
        </button>
      </div>

      {/* ═══ LESSON ENTRANCE ═══ */}
      <div className={`demo-scene ${sceneActive("lesson-entrance") ? "active" : ""}`}>
        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.4)", opacity: subPhase >= 1 ? 1 : 0, transition: "opacity 0.8s" }}>
          Module 1
        </p>
        <p style={{ fontSize: "28px", fontWeight: 700, color: "#fff", marginTop: "12px", opacity: subPhase >= 2 ? 1 : 0, transition: "opacity 0.8s" }}>
          Define Your Target Customer
        </p>
        <div style={{ width: subPhase >= 2 ? "120px" : "0", height: "2px", marginTop: "20px", borderRadius: "1px", background: "linear-gradient(90deg, #F5E642, #A8DB5A, #F4A79D, #6DD5D0)", transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)" }} />
      </div>

      {/* ═══ LESSON CONVERSATION ═══ */}
      <div className={`demo-scene ${sceneActive("lesson-convo") ? "active" : ""}`} style={{ justifyContent: "flex-start", paddingTop: "5vh" }}>
        <div className="demo-scene-label">Lesson Experience</div>
        <div className="demo-lesson">
          <div className="demo-lesson-header">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div>
                <div style={{ fontSize: "10px", color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.12em" }}>Module 1</div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>Define Your Target Customer</div>
              </div>
              <div style={{ flex: 1, height: "8px", borderRadius: "99px", background: "#f3f4f6", overflow: "hidden" }}>
                <div style={{ height: "100%", width: checkpointShown ? "50%" : "25%", borderRadius: "99px", background: "linear-gradient(90deg, #F5E642, #A8DB5A, #F4A79D, #6DD5D0)", transition: "width 0.8s" }} />
              </div>
              <span style={{ fontSize: "11px", color: "#9ca3af" }}>{checkpointShown ? "2/4" : "1/4"}</span>
            </div>
          </div>

          <div className="demo-lesson-msgs">
            {lessonMessages.map((msg, i) => (
              <div key={i} className={`demo-lesson-msg ${msg.role === "user" ? "demo-lesson-user" : "demo-lesson-ai"}`}>
                {msg.role === "ai" && (
                  <div className="demo-lesson-guide">
                    <div style={{ position: "relative", width: "12px", height: "12px" }}>
                      <div style={{ position: "absolute", width: "5px", height: "5px", borderRadius: "50%", background: "#F5E642", top: 0, left: "3.5px" }} />
                      <div style={{ position: "absolute", width: "5px", height: "5px", borderRadius: "50%", background: "#A8DB5A", top: "3.5px", left: 0 }} />
                      <div style={{ position: "absolute", width: "5px", height: "5px", borderRadius: "50%", background: "#F4A79D", top: "3.5px", right: 0 }} />
                      <div style={{ position: "absolute", width: "5px", height: "5px", borderRadius: "50%", background: "#6DD5D0", bottom: 0, left: "3.5px" }} />
                    </div>
                    <span>Guide</span>
                  </div>
                )}
                <div className="bubble">{msg.text}</div>
              </div>
            ))}
            {lessonThinking && (
              <div className="demo-lesson-msg demo-lesson-ai">
                <div className="demo-lesson-guide"><span>Guide</span></div>
                <div className="bubble" style={{ boxShadow: "none" }}>
                  <div className="demo-thinking">
                    <span className="demo-tdot" /><span className="demo-tdot" /><span className="demo-tdot" />
                  </div>
                </div>
              </div>
            )}
            {checkpointShown && (
              <div className="demo-checkpoint">
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#0D9488" }}>Checkpoint reached</div>
                <div style={{ fontSize: "11px", color: "#9ca3af" }}>2/4 complete</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {subPhase === 1 && (
            <div className="demo-lesson-input">
              <input
                type="text"
                placeholder="Try it — describe your target customer..."
                value={lessonInput}
                onChange={(e) => setLessonInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleLessonSend(); }}
                autoFocus
              />
              <button onClick={handleLessonSend}>Send</button>
            </div>
          )}

          {subPhase === 2 && (
            <div style={{ padding: "12px 16px", borderTop: "1px solid #e5e7eb", textAlign: "center" }}>
              <button className="demo-btn demo-btn-primary" style={{ marginTop: 0, padding: "10px 24px", fontSize: "13px" }} onClick={() => goTo("ceremony-letter")}>
                Continue to Graduation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ CEREMONY: FOUNDER'S LETTER ═══ */}
      <div className={`demo-scene ${sceneActive("ceremony-letter") ? "active" : ""}`}>
        <div className="demo-letter">
          <p className={letterPhase >= 1 ? (letterPhase >= 4 ? "fade" : "show") : ""}>Dear {STUDENT_NAME},</p>
          <p className={letterPhase >= 2 ? (letterPhase >= 4 ? "fade" : "show") : ""}>
            With this launchpad, I only hope you realize all that you are capable of.
            I started this platform with nothing but a vision, and an unstoppable will.
            You are capable of more than you know.
          </p>
          <p className={`sig ${letterPhase >= 3 ? (letterPhase >= 4 ? "fade" : "show") : ""}`}>
            <span className="sig-name">&mdash; AJ Rogers, age 19</span>
            <span className="sig-title">Founder of Adaptable</span>
          </p>
        </div>
      </div>

      {/* ═══ CEREMONY: PROGRAM COMPLETE ═══ */}
      <div className={`demo-scene ${sceneActive("ceremony-complete") ? "active" : ""}`}>
        <span className="demo-complete-text">Program Complete.</span>
      </div>

      {/* ═══ CEREMONY: IKIGAI RE-REVEAL ═══ */}
      <div className={`demo-scene ${sceneActive("ceremony-reveal") ? "active" : ""}`}>
        <div className="demo-ambient" />
        <div className="demo-wizard" style={{ zIndex: 2 }}>
          {[
            { bg: "#F5E642", left: "50%", top: "19.1%" },
            { bg: "#A8DB5A", left: "19.1%", top: "50%" },
            { bg: "#F4A79D", left: "80.9%", top: "50%" },
            { bg: "#6DD5D0", left: "50%", top: "80.9%" },
          ].map((c, i) => (
            <div
              key={i}
              className={`demo-collapse-circle ${subPhase >= 1 ? "contracting" : ""}`}
              style={{
                background: c.bg, left: c.left, top: c.top,
                opacity: revealCircles.includes(i) ? 0.618 : 0,
                transition: subPhase >= 1 ? "all 2.618s cubic-bezier(0.55,0,0.2,1)" : "opacity 1s ease-out",
              }}
            />
          ))}
          <div className={`demo-reveal-center ${revealCenter && subPhase < 2 ? "show" : ""} ${subPhase >= 2 ? "collapse" : ""}`} />
          <div className={`demo-reveal-name ${revealName ? "show" : ""}`}>
            <span className="name">{BUSINESS_NAME}</span>
            <span className="origin">This came from who you are.</span>
          </div>
        </div>
        {subPhase >= 3 && (
          <button className="demo-btn" style={{ zIndex: 10 }} onClick={() => goTo("ceremony-diploma")}>
            Continue
          </button>
        )}
      </div>

      {/* ═══ CEREMONY: DIPLOMA ═══ */}
      <div className={`demo-scene ${sceneActive("ceremony-diploma") ? "active" : ""}`} style={{ background: "#0a0a08" }}>
        <div className="demo-diploma">
          <div className="inst">Adaptable Venture Program</div>
          <div className="cert-title">Certificate of Completion</div>
          <div className="sname">{STUDENT_NAME}</div>
          <div className="cert-body">
            has completed the Adaptable Venture Program and designed <strong>{BUSINESS_NAME}</strong>,
            an art education studio for creative self-expression.
          </div>
          <div className="cert-date">{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
        </div>
        <button className="demo-btn" onClick={() => goTo("ceremony-farewell")}>
          Continue
        </button>
      </div>

      {/* ═══ CEREMONY: MENTOR FAREWELL ═══ */}
      <div className={`demo-scene ${sceneActive("ceremony-farewell") ? "active" : ""}`}>
        <div className="demo-farewell">
          <div className="demo-farewell-mentor">Nova</div>
          <div className="demo-farewell-text">
            <span dangerouslySetInnerHTML={{ __html: farewellText }} />
            {!farewellDone && <span className="demo-farewell-cursor" />}
          </div>
          {farewellDone && (
            <button className="demo-btn" style={{ marginTop: "2.618em" }} onClick={() => goTo("end")}>
              Begin
            </button>
          )}
        </div>
      </div>

      {/* ═══ END ═══ */}
      <div className={`demo-scene ${sceneActive("end") ? "active" : ""}`}>
        <div className="demo-end-title">This is Adaptable.</div>
        <p className="demo-end-sub">Built for the students who will build the future.</p>
        <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
          <a href="/for-schools" className="demo-btn demo-btn-primary" style={{ textDecoration: "none" }}>
            Learn More
          </a>
          <button className="demo-btn" onClick={() => { setScene("welcome"); setCirclesDone([]); setRevealCircles([]); setRevealCenter(false); setRevealName(false); setFarewellText(""); setFarewellDone(false); setLetterPhase(0); }}>
            Replay
          </button>
        </div>
      </div>
    </div>
  );
}
