"use client";

import { useRef, useState, useCallback } from "react";

/*
 * SVG freehand drawing surface — cursor (and touch/pen) drawing for fun
 * challenges and self-expression. SVG, not <canvas>, per the Chromebook
 * hardware rule (CSS/DOM/SVG only). Pointer events unify mouse/touch/pen.
 *
 * LAYER 1: the working surface — draw, pick a color, undo, clear.
 * Later: persist/submit the drawing, prompts, brush sizes.
 */

type Pt = { x: number; y: number };
type Stroke = { d: string; color: string; width: number };

// DESIGN.md palette
const COLORS = ["#111827", "#0D9488", "#F59E0B", "#DC2626", "#3B82F6"];
const WIDTH = 3;
const MIN_DIST = 2; // skip points closer than this (caps point density for perf)

/** Build a smooth path through points using quadratic midpoint smoothing. */
function toPath(points: Pt[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x} ${p.y} l 0.1 0.1`; // a dot
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y} ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

export default function DrawingCanvas() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const ptsRef = useRef<Pt[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [liveD, setLiveD] = useState<string>("");
  const [color, setColor] = useState<string>(COLORS[0]);
  const drawing = useRef(false);

  const pointFromEvent = useCallback((e: React.PointerEvent): Pt | null => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const p = pointFromEvent(e);
      if (!p) return;
      drawing.current = true;
      ptsRef.current = [p];
      setLiveD(toPath(ptsRef.current));
      (e.target as Element).setPointerCapture?.(e.pointerId);
    },
    [pointFromEvent]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drawing.current) return;
      const p = pointFromEvent(e);
      if (!p) return;
      const pts = ptsRef.current;
      const last = pts[pts.length - 1];
      if (last && Math.hypot(p.x - last.x, p.y - last.y) < MIN_DIST) return;
      pts.push(p);
      setLiveD(toPath(pts));
    },
    [pointFromEvent]
  );

  const finishStroke = useCallback(() => {
    if (!drawing.current) return;
    drawing.current = false;
    const pts = ptsRef.current;
    if (pts.length > 0) {
      setStrokes((s) => [...s, { d: toPath(pts), color, width: WIDTH }]);
    }
    ptsRef.current = [];
    setLiveD("");
  }, [color]);

  const undo = () => setStrokes((s) => s.slice(0, -1));
  const clear = () => {
    setStrokes([]);
    setLiveD("");
    ptsRef.current = [];
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Toolbar */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-label={`Pen color ${c}`}
              className="h-7 w-7 rounded-full border-2 transition-transform active:scale-90"
              style={{
                background: c,
                borderColor: color === c ? "var(--text-primary)" : "transparent",
              }}
            />
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={undo}
            className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)]"
          >
            Undo
          </button>
          <button
            onClick={clear}
            className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)]"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Drawing surface */}
      <svg
        ref={svgRef}
        className="w-full rounded-xl border border-[var(--border-strong)] bg-white"
        style={{ height: "60vh", minHeight: 360, touchAction: "none", cursor: "crosshair" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishStroke}
        onPointerLeave={finishStroke}
        onPointerCancel={finishStroke}
      >
        {strokes.map((s, i) => (
          <path
            key={i}
            d={s.d}
            fill="none"
            stroke={s.color}
            strokeWidth={s.width}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {liveD && (
          <path
            d={liveD}
            fill="none"
            stroke={color}
            strokeWidth={WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  );
}
