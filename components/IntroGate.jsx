"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

const SIGNS = "*><|/\\+-_=~#%^&".split("");

export default function IntroGate({ onEnter }) {
  const baseText = useMemo(() => "NEERAJ. BACHWANI", []);
  const [isMobile, setIsMobile] = useState(false);
  const [activeText, setActiveText] = useState("NEERAJ. BACHWANI");
  const [reveal, setReveal] = useState(0); // number of real chars shown
  const [scramble, setScramble] = useState([]); // random chars for yet unrevealed indices
  const [progress, setProgress] = useState(1);
  const [retractT, setRetractT] = useState(0); // 0..1 after reaching 100
  const [visProgress, setVisProgress] = useState(1); // sticky visual progress
  const [mounted, setMounted] = useState(false); // avoid SSR/CSR mismatch
  const [hoveringEnter, setHoveringEnter] = useState(false);
  const [pointerFine, setPointerFine] = useState(false); // detect mouse vs touch
  const rafRef = useRef(null);
  const topBarRef = useRef(null);
  const lastScrambleAtRef = useRef(typeof performance !== "undefined" ? performance.now() : 0);
  const retractStartRef = useRef(null);
  const visRef = useRef(1);

  useEffect(() => {
    setMounted(true);
    // Detect fine pointer (mouse/trackpad) to decide cursor rendering
    if (typeof window !== "undefined" && window.matchMedia) {
      try {
        const mq = window.matchMedia("(pointer: fine)");
        const update = () => setPointerFine(!!mq.matches);
        update();
        mq.addEventListener?.("change", update);
      } catch {}
      try {
        const mqMobile = window.matchMedia("(max-width: 640px)");
        const updateMobile = () => {
          const mobile = !!mqMobile.matches;
          setIsMobile(mobile);
          setActiveText(mobile ? "NEERAJ." : baseText);
        };
        updateMobile();
        mqMobile.addEventListener?.("change", updateMobile);
      } catch {}
    }

    // Slower, stepped reveal with sticky scramble
    const start = performance.now();
    let lastRevealAt = start;
    let revealed = 0;

    const tick = () => {
      const now = performance.now();
      const elapsed = now - start;

      // Reveal next char at a steady, slightly-fast pace (90..120ms)
      const deltaReveal = now - lastRevealAt;
      const interval = 90 + Math.random() * 30;
      if (deltaReveal > interval && revealed < activeText.length) {
        revealed += 1;
        lastRevealAt = now;
        setReveal(revealed);
      }

      // Sticky scramble: update unrevealed chars ~every 60ms with ~45% change chance
      if (now - lastScrambleAtRef.current > 60) {
        lastScrambleAtRef.current = now;
        setScramble((prev) =>
          Array.from({ length: activeText.length }, (_, i) => {
            if (i < revealed || activeText[i] === " ") return activeText[i];
            const keep = prev?.[i];
            const rnd = Math.random();
            if (keep && rnd > 0.45) return keep; // stay sticky most frames
            return SIGNS[Math.floor(Math.random() * SIGNS.length)];
          })
        );
      }

      // Progress ties directly to reveal percent so bar finishes with text
      const pct = Math.max(1, Math.min(100, Math.floor((revealed / Math.max(1, activeText.length)) * 100)));
      setProgress(pct);

      // Sticky visual progress that eases toward target, but snap to 100 when done
      if (revealed >= activeText.length) {
        visRef.current = 100;
        setVisProgress(100);
      } else {
        const current = visRef.current || 1;
        const delta = pct - current;
        const speed = 0.25; // constant follow speed for steady motion
        const next = current + delta * speed;
        visRef.current = next;
        setVisProgress(next);
      }

      // Start retract once all characters are revealed
      if (revealed >= activeText.length && retractStartRef.current == null) {
        retractStartRef.current = now;
      }
      if (retractStartRef.current != null) {
        const rElapsed = now - retractStartRef.current;
        const rDur = 700;
        const r = Math.min(1, rElapsed / rDur);
        const easedR = 1 - Math.pow(1 - r, 3); // ease-out
        setRetractT(easedR);
      }

      if (revealed < activeText.length || (retractStartRef.current != null && retractT < 1)) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [baseText, activeText]);

  // When switching between mobile/desktop text, restart reveal/scramble/progress
  useEffect(() => {
    setReveal(0);
    setScramble(Array.from({ length: activeText.length }, () => SIGNS[Math.floor(Math.random() * SIGNS.length)]));
    setProgress(1);
    setVisProgress(1);
    visRef.current = 1;
    setRetractT(0);
    retractStartRef.current = null;
  }, [activeText]);

  // Keep track of bar width on resize to clamp number nicely
  const [, force] = useState(0);
  useEffect(() => {
    const onResize = () => force((v) => v + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Only allow "Enter" when the displayed progress reaches 100
  const isReady = Math.round(Math.max(1, Math.min(100, visProgress))) >= 100;
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter" && isReady) onEnter?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onEnter, isReady]);

  // Compute geometry for the top bar
  const width = mounted ? (topBarRef.current?.clientWidth || (typeof window !== "undefined" ? window.innerWidth : 0)) : 0;
  const margin = 20;
  const numWidth = 40; // approximate width for 3 digits
  const prog = Math.max(1, Math.min(100, visProgress));
  const leftPx = margin + (width - margin * 2) * (prog / 100);
  const tipX = Math.min(Math.max(margin + 8, leftPx), Math.max(margin + 8, width - margin - numWidth - 8));
  const fullWidth = Math.max(0, tipX);
  const currentWidth = Math.max(0, fullWidth * (1 - retractT)); // fully disappears at end
  const barLeft = Math.max(0, tipX - currentWidth);
  const numberLeft = Math.min(width - margin - numWidth, Math.max(margin, tipX + 8));

  return (
    <div
      className="fixed inset-0 z-[9999]"
      style={{ background: "#000", cursor: pointerFine ? "none" : "auto", width: "100vw", height: "100dvh" }}
    >
      {/* Top progress line with moving number 1..100 */}
      <div
        className="absolute top-0 left-0 right-0 h-10"
        style={{ position: "absolute", top: "calc(env(safe-area-inset-top, 0px) + 24px)", left: 0, right: 0, height: 40 }}
        ref={topBarRef}
      >
        {/* Solid progress line only (no gray track) */}
        {/* Filled progress with retract following the number */}
        <div
          className="absolute bg-white"
          style={{ position: "absolute", top: 0, left: barLeft, height: 2, width: currentWidth, background: "#ffffff" }}
        />
        {/* Moving number positioned on the right side of the line */}
        <div
          className="absolute text-white font-mono tracking-widest select-none"
          style={{ position: "absolute", top: 6, left: numberLeft, color: "#ffffff", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}
        >
          {String(Math.max(1, Math.min(100, Math.round(visProgress)))).padStart(3, "0")}
        </div>
      </div>

      {/* Center stack: scrambled name + ENTER directly under */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center px-6 gap-4"
        style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingLeft: 24, paddingRight: 24, gap: 16 }}
      >
        <div
          className="text-white font-bold tracking-wider text-center select-none"
          style={{ color: "#ffffff", fontFamily: "NK57, system-ui, sans-serif", fontWeight: 700, textAlign: "center", fontSize: "clamp(42px, 10vw, 120px)" }}
        >
          {activeText.split("").map((ch, i) => {
            const shown = i < reveal ? activeText[i] : scramble[i] || " ";
            // Avoid random jitter during initial render to prevent hydration mismatch
            return (
              <span key={i} style={{ display: "inline-block" }}>{shown}</span>
            );
          })}
        </div>

        <button
          onMouseEnter={() => isReady && setHoveringEnter(true)}
          onMouseLeave={() => setHoveringEnter(false)}
          onClick={() => { if (isReady) onEnter?.(); }}
          type="button"
          className="group tracking-widest"
          disabled={!isReady}
          style={{
            color: isReady ? "#ffffff" : "#777777",
            fontSize: "clamp(16px, 2.2vw, 28px)",
            background: "transparent",
            border: "none",
            outline: "none",
            appearance: "none",
            cursor: isReady ? (pointerFine ? "none" : "pointer") : "default",
            // Hide until ready, then ease-in from below
            opacity: isReady ? 1 : 0,
            transform: isReady ? "translateY(0)" : "translateY(18px)",
            transition: "opacity 220ms ease-out, transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1)",
            pointerEvents: isReady ? "auto" : "none",
          }}
        >
          <span
            className="transition-transform"
            style={{ color: hoveringEnter && isReady ? "#b6a9c7" : (isReady ? "#ffffff" : "#777777"), transform: hoveringEnter && isReady ? "translateX(-10px)" : "translateX(0)", display: "inline-block", textShadow: isReady ? "0 0 8px rgba(182,169,199,0.45)" : "none" }}
          >
            [
          </span>
          <span style={{ marginLeft: 12, marginRight: 12 }}>ENTER</span>
          <span
            className="transition-transform"
            style={{ color: hoveringEnter && isReady ? "#b6a9c7" : (isReady ? "#ffffff" : "#777777"), transform: hoveringEnter && isReady ? "translateX(10px)" : "translateX(0)", display: "inline-block", textShadow: isReady ? "0 0 8px rgba(182,169,199,0.45)" : "none" }}
          >
            ]
          </span>
        </button>
      </div>

      {/* Purple cursor for black bg (mouse only) */}
      {pointerFine && <IntroCursor color="#b6a9c7" />}
    </div>
  );
}

function IntroCursor({ color = "#b6a9c7" }) {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  useEffect(() => {
    const onMove = (e) => setPos({ x: e.clientX, y: e.clientY });
    const onLeave = () => setPos({ x: -100, y: -100 });
    const prev = document.body.style.cursor;
    document.body.style.cursor = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("mouseenter", onMove);
    return () => {
      document.body.style.cursor = prev || "auto";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mouseenter", onMove);
    };
  }, []);

  return (
    <>
      <div style={{ position: "fixed", left: 0, top: 0, transform: `translate(${pos.x - 6}px, ${pos.y - 6}px)`, width: 12, height: 12, borderRadius: "50%", background: color, pointerEvents: "none", zIndex: 99999 }} />
      <div style={{ position: "fixed", left: 0, top: 0, transform: `translate(${pos.x - 14}px, ${pos.y - 14}px)`, width: 28, height: 28, borderRadius: "50%", background: "rgba(182,169,199,0.18)", pointerEvents: "none", zIndex: 99998 }} />
    </>
  );
}
