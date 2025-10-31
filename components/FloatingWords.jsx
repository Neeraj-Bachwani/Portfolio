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
  const [now, setNow] = useState(0);
  const sectionRef = useRef(null);
  const rafRef = useRef(0);
  const rowElsRef = useRef([]);         // DOM nodes for rows
  const wordElsRef = useRef([]);        // per-row arrays of spans
  const baseRef = useRef([]);           // per-row base positions/widths
  const txRef = useRef([]);             // per-row current translateX per word
  const vRef = useRef([]);              // per-row velocity per word (px/s)
  const prevRef = useRef([]);           // per-row previous tx values
  const stillRef = useRef([]);          // per-row stagnation counters
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // simple time base for any subtle effects
    const loop = (ts) => {
      setNow(ts);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); };
  }, []);

  // Build DOM references after render
  useEffect(() => {
    rowElsRef.current = Array.from(sectionRef.current?.querySelectorAll('.w-row') || []);
    wordElsRef.current = rowElsRef.current.map(row => Array.from(row.querySelectorAll('.wobble-word')));

    const initFromLayout = () => {
      const isMobile = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 720px)').matches;
      baseRef.current = rowElsRef.current.map((row, ri) => {
        const rowRect = row.getBoundingClientRect();
        const bases = wordElsRef.current[ri].map((el) => {
          const r = el.getBoundingClientRect();
          return { x: r.left - rowRect.left, width: r.width };
        });
        return { width: rowRect.width, items: bases };
      });
      // Center each row's group of words
      txRef.current = baseRef.current.map((r, ri) => {
        const items = r.items;
        if (!items || !items.length) return [];
        const minX = items.reduce((m, it) => Math.min(m, it.x), items[0].x);
        const maxRight = items.reduce((m, it) => Math.max(m, it.x + it.width), 0);
        const groupW = maxRight - minX;
        const desiredLeft = Math.max(0, (r.width - groupW) / 2);
        const delta = desiredLeft - minX; // initial translate to center
        return items.map(() => delta);
      });
      // Alternate velocities so they drift and bounce
      vRef.current = baseRef.current.map((r, ri) => r.items.map((_, wi) => {
        const dir = (wi % 2 === 0) ? 1 : -1;
        const base = isMobile ? 22 : 48;
        const step = isMobile ? 3 : 8;
        const speed = base + ((ri * 7 + wi * 13) % 5) * step; // slower on mobile
        return dir * speed;
      }));

      // Initialize previous and stagnation trackers
      prevRef.current = txRef.current.map(row => row.map(v => v));
      stillRef.current = txRef.current.map(row => row.map(() => 0));

      // Apply initial centered transform immediately so they don't "come in from left"
      rowElsRef.current.forEach((row, ri) => {
        const els = wordElsRef.current[ri] || [];
        const tx = txRef.current[ri] || [];
        els.forEach((el, i) => {
          el.style.transform = `translate3d(${(tx[i]||0)}px,0,0)`;
        });
      });
      setReady(true);
    };

    initFromLayout();
    const onResize = () => initFromLayout();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [text]);

  // Physics update: move each word within bounds and bounce on neighbors/edges
  useEffect(() => {
    let last = performance.now();
    let af;
    const step = () => {
      const nowT = performance.now();
      const dt = Math.min(0.05, Math.max(0.016, (nowT - last) / 1000)); // 16–50ms
      last = nowT;

      for (let ri = 0; ri < (baseRef.current?.length || 0); ri++) {
        const row = baseRef.current[ri];
        if (!row) continue;
        const rowW = row.width;
        const bases = row.items;
        const tx = txRef.current[ri];
        const v = vRef.current[ri];
        if (!bases || !tx || !v) continue;
        const isMobile = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 720px)').matches;
        const gap = isMobile ? 4 : 8; // px between words
        const sidePad = isMobile ? 18 : 28; // keep some room at edges

        // Update in order so neighbor constraints use updated positions
        for (let i = 0; i < bases.length; i++) {
          const b = bases[i];
          let next = (tx[i] ?? 0) + (v[i] ?? 0) * dt;

          // Absolute neighbor edges using updated positions
          const prevEnd = i === 0 ? -Infinity : (bases[i-1].x + (tx[i-1] ?? 0) + bases[i-1].width);
          const nextStart = i === bases.length - 1 ? Infinity : (bases[i+1].x + (tx[i+1] ?? 0));
          const leftAbs = i === 0 ? sidePad : prevEnd + gap;
          const rightAbs = i === bases.length - 1 ? (rowW - sidePad) : nextStart - gap;
          const txMin = leftAbs - b.x;
          const txMax = rightAbs - b.x - b.width;

          if (next < txMin) { next = txMin; v[i] = Math.abs(v[i] || 40); }
          if (next > txMax) { next = txMax; v[i] = -Math.abs(v[i] || 40); }

          tx[i] = next;

          // Release from potential sticking: if barely moving for ~0.5s, flip direction
          const prev = (prevRef.current[ri] || [])[i] ?? next;
          const delta = Math.abs(next - prev);
          const rowStill = stillRef.current[ri] || (stillRef.current[ri] = []);
          rowStill[i] = (delta < 0.1) ? (rowStill[i]||0) + 1 : 0;
          if (rowStill[i] > 20) { // ~0.33s at 60fps
            v[i] = -(v[i] || 60);
            tx[i] = Math.min(txMax, Math.max(txMin, next + v[i] * dt * 2));
            rowStill[i] = 0;
          }
          if (!prevRef.current[ri]) prevRef.current[ri] = [];
          prevRef.current[ri][i] = next;
        }

        // Apply transforms
        const els = wordElsRef.current[ri] || [];
        for (let i = 0; i < els.length; i++) {
          const el = els[i];
          const x = tx[i] || 0;
          el.style.transform = `translate3d(${x}px,0,0)`;
        }
      }

      af = requestAnimationFrame(step);
    };
    af = requestAnimationFrame(step);
    return () => cancelAnimationFrame(af);
  }, [text]);

  return (
    <section
      id={id}
      ref={sectionRef}
      className="wobble-section section-animate"
    >
      <div className={`wobble-rows ${ready ? 'ready' : ''}`}>
        {rows.map((row, ri) => (
          <div className="w-row" key={ri}>
            {row.map((w, wi) => {
              const cls = `wobble-word ${w.fixed ? 'fixed' : 'dynamic'}`;
              return (
                <span key={wi} className={cls}>{w.text}</span>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
