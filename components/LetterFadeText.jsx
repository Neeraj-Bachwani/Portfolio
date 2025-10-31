"use client";

import { useMemo } from "react";

export default function LetterFadeText({ text = "", className = "", duration = 800, stagger = 40, keySeed }) {
  const chars = useMemo(() => (text || "").split("").map((ch, i) => ({ ch, i })), [text]);
  const base = Math.max(0, Number(duration) || 800);
  const step = Math.max(0, Number(stagger) || 40);
  // Produce a randomized order per keySeed so letters disappear/appear randomly
  const order = useMemo(() => {
    const arr = chars.map((_, i) => i);
    let seed = (keySeed == null ? 13 : (Number(keySeed) + 31)) || 13;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const delays = new Array(arr.length).fill(0);
    arr.forEach((idx, k) => { delays[idx] = base * 0.2 + k * step; });
    return delays;
  }, [chars.length, keySeed, base, step]);
  return (
    <span className={className} key={keySeed} aria-label={text}>
      {chars.map(({ ch, i }) => (
        ch === " " ? (
          <span key={i} style={{ display: "inline-block", width: "0.35em" }} />
        ) : (
          <span
            key={i}
            className="lf-char"
            style={{ animationDelay: `${(order[i] || 0) / 1000}s` }}
          >
            {ch}
          </span>
        )
      ))}
    </span>
  );
}
