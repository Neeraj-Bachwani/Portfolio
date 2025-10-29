"use client";

import { useEffect, useRef } from "react";

export default function TechTicker({ speed = 60 }) {
  const trackRef = useRef(null);
  const lastRef = useRef(0);
  const xRef = useRef(0);
  const halfRef = useRef(0);
  const rafRef = useRef(0);

  const items = [
    "REACT", "NEXT.JS", "THREE.JS", "NODE", "EXPRESS", "MONGO",
    "TAILWIND", "FRAMER-MOTION", "GSAP", "WEBGL", "FIGMA"
  ];

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const measure = () => {
      const total = el.scrollWidth;
      halfRef.current = total / 2;
    };
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    const loop = (ts) => {
      if (!lastRef.current) lastRef.current = ts;
      const dt = Math.min(0.05, (ts - lastRef.current) / 1000);
      lastRef.current = ts;
      xRef.current -= speed * dt;
      const half = halfRef.current || 1;
      while (xRef.current <= -half) xRef.current += half;
      el.style.transform = `translate3d(${xRef.current}px,0,0)`;
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [speed]);

  return (
    <div className="tech-ticker" aria-hidden>
      <div className="tech-track" ref={trackRef} style={{ willChange: 'transform' }}>
        {[...items, ...items].map((t, i) => (
          <span key={i} className="tech-item">{t}</span>
        ))}
      </div>
    </div>
  );
}
