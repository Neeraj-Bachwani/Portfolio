"use client";

import { useEffect, useRef, useState } from "react";

export default function ScrollIndicator({
  width = 4,
  height = 42,
  right = 10,
  borderRadius = 3,
  color = "#b6a9c7",
  hideDelay = 500,
}) {
  const [visible, setVisible] = useState(false);
  const [top, setTop] = useState(0);
  const rafRef = useRef(0);
  const timerRef = useRef(0);

  useEffect(() => {
    const update = () => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop || 0;
      const scrollHeight = doc.scrollHeight || 1;
      const inner = window.innerHeight || 1;
      const max = Math.max(1, scrollHeight - inner);
      const progress = Math.min(1, Math.max(0, scrollTop / max));
      const travel = inner - height - 10; // small padding from edges
      setTop(5 + travel * progress);
    };

    const onScroll = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setVisible(true);
      update();
      timerRef.current = setTimeout(() => setVisible(false), hideDelay);
    };

    const onResize = () => update();

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onScroll, { passive: true });
    window.addEventListener("touchmove", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onScroll);
      window.removeEventListener("touchmove", onScroll);
      window.removeEventListener("resize", onResize);
      if (timerRef.current) clearTimeout(timerRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [height, hideDelay]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 0,
        pointerEvents: "none",
        zIndex: 40,
      }}
      aria-hidden
    >
      <div
        style={{
          position: "absolute",
          right,
          width,
          height,
          top,
          borderRadius,
          background: color,
          boxShadow: "0 0 12px rgba(182,169,199,0.35)",
          opacity: visible ? 1 : 0,
          transition: "opacity 180ms ease, top 60ms linear",
        }}
      />
    </div>
  );
}

