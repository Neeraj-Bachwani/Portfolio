"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// Build rows from newline-separated lines; each line -> words
function buildRows(text) {
  const lines = text.toUpperCase().split(/\s*\n+\s*/).filter(Boolean);
  const rows = lines.map((line) => {
    const parts = line.trim().split(/\s+/).filter(Boolean); // keep commas on tokens
    // Mark every second word as dynamic for a mix
    return parts.map((w, i) => ({ text: w, fixed: i % 2 === 0 }));
  });
  return rows;
}

export default function FloatingWords({ text, id }) {
  const rows = useMemo(() => buildRows(text), [text]);

  // Motion state
  const [xRatio, setXRatio] = useState(0); // -1..1 cursor
  const [now, setNow] = useState(0);
  const sectionRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    // simple time base for subtle wobble
    const loop = (ts) => {
      setNow(ts);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); };
  }, []);

  const onMove = (e) => {
    const el = sectionRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = Math.min(Math.max(e.clientX - r.left, 0), r.width);
    const ratio = (cx - r.width / 2) / (r.width / 2);
    setXRatio(Math.max(-1, Math.min(1, ratio)));
  };

  const onLeave = () => setXRatio(0);

  return (
    <section
      id={id}
      ref={sectionRef}
      className="wobble-section section-animate"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div className="wobble-rows">
        {rows.map((row, ri) => (
          <div className="w-row" key={ri}>
            {row.map((w, wi) => {
              const i = ri * 10 + wi;
              const tsec = now / 1000;
              const amp = w.fixed ? 8 : 20; // small cursor-follow amplitude
              const wobAmp = w.fixed ? 2 : 6; // subtle per-word wobble
              const wobble = Math.sin((tsec + i * 0.22) * 2.4) * wobAmp;
              const sx = xRatio * amp + wobble; // all follow cursor in same direction
              const style = w.fixed ? undefined : { transform: `translate3d(${sx.toFixed(1)}px,0,0)` };
              const cls = `wobble-word ${w.fixed ? 'fixed' : 'dynamic'}`;
              return (
                <span key={wi} className={cls} style={style}>{w.text}</span>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
