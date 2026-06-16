"use client";

import { useRef, useState, useCallback, useEffect } from "react";

/*
 * SVG freehand drawing surface — cursor/touch/pen drawing. SVG, not <canvas>,
 * per the Chromebook hardware rule (CSS/DOM/SVG only).
 *
 * - Standalone: has its own Save (download) + name field.
 * - Embedded: pass `onChange` to receive the current drawing as an SVG string
 *   (used by the assessment flow so the drawing submits with everything else).
 *   Pass `embedded` to hide the standalone name/Save controls.
 */

type Pt = { x: number; y: number };
type Stroke = { d: string; color: string; width: number };

const COLORS = ["#111827", "#0D9488", "#F59E0B", "#DC2626", "#3B82F6"];
const WIDTH = 3;
const MIN_DIST = 2;

function toPath(points: Pt[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x} ${p.y} l 0.1 0.1`;
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

export default function DrawingCanvas({
  onChange,
  embedded = false,
}: {
  onChange?: (svg: string) => void;
  embedded?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const ptsRef = useRef<Pt[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [liveD, setLiveD] = useState<string>("");
  const [color, setColor] = useState<string>(COLORS[0]);
  const [name, setName] = useState<string>("");
  const drawing = useRef(false);

  const buildSvgDoc = useCallback((items: Stroke[]): string => {
    const svg = svgRef.current;
    if (!svg || items.length === 0) return "";
    const rect = svg.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    const paths = items
      .map(
        (s) =>
          `<path d="${s.d}" fill="none" stroke="${s.color}" stroke-width="${s.width}" stroke-linecap="round" stroke-linejoin="round"/>`
      )
      .join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#ffffff"/>${paths}</svg>`;
  }, []);

  // Report the current drawing up to a parent (assessment flow).
  useEffect(() => {
    if (onChange) onChange(buildSvgDoc(strokes));
  }, [strokes, onChange, buildSvgDoc]);

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

  const save = () => {
    const doc = buildSvgDoc(strokes);
    if (!doc) return;
    const blob = new Blob([doc], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const slug = (name.trim() || "drawing").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    a.download = `${slug}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
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
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {!embedded && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={60}
              aria-label="Your name (for the saved file)"
              className="w-28 rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
            />
          )}
          <button
            type="button"
            onClick={undo}
            className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)]"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={clear}
            className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)]"
          >
            Clear
          </button>
          {!embedded && (
            <button
              type="button"
              onClick={save}
              disabled={strokes.length === 0}
              className="rounded-lg bg-[var(--primary)] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
            >
              Save
            </button>
          )}
        </div>
      </div>

      <svg
        ref={svgRef}
        className="w-full rounded-xl border border-[var(--border-strong)] bg-white"
        style={{ height: "55vh", minHeight: 320, touchAction: "none", cursor: "crosshair" }}
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
