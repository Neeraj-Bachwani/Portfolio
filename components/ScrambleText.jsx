"use client";

import { useEffect, useRef, useState } from "react";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ*^#@%&+-=!?";

export default function ScrambleText({
  text = "NEERAJ. BACHWANI",
  className = "",
  duration = 2800,
  autoStartKey,
}) {
  const [display, setDisplay] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);
  const rafRef = useRef(null);
  const startRef = useRef(0);
  const fromRef = useRef(text);
  const toRef = useRef(text);
  const scheduleRef = useRef([]); // per-char settle thresholds 0..1
  const linesRef = useRef([]); // indices per line
  const symSeqRef = useRef([]); // per-char symbol sequence limited changes

  useEffect(() => {
    // keep display in sync if text prop changes
    if (!isScrambling) setDisplay(text);
    toRef.current = text;
  }, [text, isScrambling]);

  const tick = (now) => {
    if (!startRef.current) startRef.current = now;
    const t = Math.min(1, (now - startRef.current) / duration);
    const target = toRef.current;
    let out = "";
    const symbolWindow = 0.24; // brief symbol phase before settle
    for (let i = 0; i < target.length; i++) {
      const chTarget = target[i];
      if (chTarget === "\n") { out += "\n"; continue; }
      if (chTarget === " ") { out += " "; continue; }
      const settle = scheduleRef.current[i] ?? (i / Math.max(1, target.length));
      if (t >= settle) {
        out += chTarget;
      } else if (t >= Math.max(0, settle - symbolWindow)) {
        // only 2-3 symbol changes total per char
        const progress = (t - (settle - symbolWindow)) / symbolWindow; // 0..1
        const stageCount = 5;
        const stage = Math.min(stageCount - 1, Math.floor(progress * stageCount));
        const seq = symSeqRef.current[i] || [];
        const sym = seq[stage] || LETTERS[(i + stage * 7) % LETTERS.length];
        out += sym;
      } else {
        out += " "; // fully blank before symbol phase
      }
    }
    setDisplay(out);
    if (t < 1) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      setIsScrambling(false);
      startRef.current = 0;
      rafRef.current = null;
      setDisplay(target);
    }
  };

  const start = () => {
    if (isScrambling) return;
    setIsScrambling(true);
    fromRef.current = display;
    // Build a per-line schedule so next line starts after previous settles
    const target = toRef.current;
    const lines = target.split("\n");
    const lineStarts = [];
    let idx = 0;
    lines.forEach((ln, li) => {
      lineStarts.push(idx);
      idx += ln.length + (li < lines.length - 1 ? 1 : 0); // +1 for newline
    });
    const schedule = new Array(target.length).fill(1);
    lines.forEach((ln, li) => {
      // first line: 0.00 -> 0.55, next line(s): 0.60 -> 0.98
      const base = li === 0 ? 0.0 : 0.60 + (li - 1) * 0.15;
      const end = li === 0 ? 0.55 : 0.98;
      const len = Math.max(1, ln.length);
      for (let i = 0; i < ln.length; i++) {
        const globalIndex = lineStarts[li] + i;
        schedule[globalIndex] = Math.min(0.999, base + (i / len) * Math.max(0.001, end - base));
      }
    });
    // Keep newline instant
    for (let i = 0; i < target.length; i++) if (target[i] === "\n") schedule[i] = 0;
    scheduleRef.current = schedule;
    // Precompute limited symbol sequence per character (3 stages)
    const seq = new Array(target.length).fill(null).map((_, i) => {
      if (target[i] === "\n" || target[i] === " ") return [];
      return [0,1,2].map(j => LETTERS[Math.floor(Math.random() * LETTERS.length)]);
    });
    symSeqRef.current = seq;
    setDisplay(target.replace(/[^\n]/g, " ")); // immediately blank out
    startRef.current = 0;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => rafRef.current && cancelAnimationFrame(rafRef.current), []);
  useEffect(() => { if (autoStartKey !== undefined) { // re-trigger when key changes
    // small timeout to allow layout
    const t = setTimeout(() => start(), 0);
    return () => clearTimeout(t);
  } }, [autoStartKey]);

  return (
    <span className={className} onMouseEnter={start}>
      {display}
    </span>
  );
}

ScrambleText.defaultProps = { autoStartKey: undefined };
