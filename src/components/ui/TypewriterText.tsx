"use client";

import { useState, useEffect, useRef } from "react";

/**
 * TypewriterText: reveals text character by character like a video game.
 * When streaming, characters appear at a steady pace regardless of chunk size.
 * When not streaming, shows full text immediately.
 */
export default function TypewriterText({
  text,
  streaming,
}: {
  text: string;
  streaming: boolean;
}) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    if (!streaming) {
      setDisplayed(text);
      indexRef.current = text.length;
      return;
    }

    const INTERVAL = 16;
    const CHARS_PER_TICK = 2;

    function tick(now: number) {
      if (now - lastTimeRef.current >= INTERVAL) {
        lastTimeRef.current = now;
        if (indexRef.current < text.length) {
          const next = Math.min(indexRef.current + CHARS_PER_TICK, text.length);
          indexRef.current = next;
          setDisplayed(text.slice(0, next));
        }
      }
      if (indexRef.current < text.length) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [text, streaming]);

  const paragraphs = displayed
    ? displayed.split(/\n\n+/).filter((p) => p.trim())
    : [];

  return (
    <>
      {paragraphs.map((para, j) => (
        <p key={j} className="text-base leading-relaxed">
          {para}
        </p>
      ))}
    </>
  );
}
