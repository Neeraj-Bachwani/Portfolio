"use client";

import React, { useEffect, useRef, useState } from "react";

// White background, purple scratch, masked word: WORKS
export default function ScratchWorks({ text = "WORKS", brushWidth = 4 }) {
  const containerRef = useRef(null);
  const displayCanvasRef = useRef(null);
  const trailCanvasRef = useRef(null);
  const enableLocalTrail = false; // keep local animated trail off; global cursor handles trail

  const linesRef = useRef(null);
  const maskRef = useRef(null);
  const lastPosRef = useRef(null);
  const pointsRef = useRef([]);
  const lastCursorRef = useRef({ x: 0, y: 0 });
  const lastMoveTimeRef = useRef(typeof performance !== "undefined" ? performance.now() : 0);
  const speedRef = useRef(0);
  const lastAngleRef = useRef(null);
  const trailCtxRef = useRef(null);
  const drawingRef = useRef(false); // touch drawing state

  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [pointerFine, setPointerFine] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const display = displayCanvasRef.current;
    const trail = enableLocalTrail ? trailCanvasRef.current : null;
    if (!container || !display) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    // do not change global body background; keep styling local

    linesRef.current = document.createElement("canvas");
    maskRef.current = document.createElement("canvas");

    const resize = () => {
      const width = container.clientWidth || window.innerWidth || 0;
      const height = container.clientHeight || window.innerHeight || 0;
      if (width <= 0 || height <= 0) return;

      const sizeTargets = enableLocalTrail && trail ? [display, trail] : [display];
      for (const c of sizeTargets) {
        c.width = Math.floor(width * dpr);
        c.height = Math.floor(height * dpr);
        c.style.width = width + "px";
        c.style.height = height + "px";
        const ctx = c.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
      }

      for (const c of [linesRef.current, maskRef.current]) {
        c.width = Math.floor(width * dpr);
        c.height = Math.floor(height * dpr);
        const ctx = c.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
      }

      const mctx = maskRef.current.getContext("2d");
      const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      const isSmall = Math.min(window.innerWidth, window.innerHeight) <= 820;
      const padX = width * (isCoarse || isSmall ? 0.10 : 0.08); // extra side padding on mobile
      const padY = height * (isCoarse || isSmall ? 0.12 : 0.2);

      const fitFont = (base = 120) => {
        mctx.save();
        mctx.font = `900 ${base}px NK57, system-ui, sans-serif`;
        const targetW = width - padX * 2;
        const w = Math.max(1, mctx.measureText(text).width);
        let size = (base * targetW) / w;
        mctx.font = `900 ${size}px NK57, system-ui, sans-serif`;
        const m2 = mctx.measureText(text);
        const h = (m2.actualBoundingBoxAscent || size * 0.7) + (m2.actualBoundingBoxDescent || size * 0.2);
        const targetH = height - padY * 2;
        if (h > targetH) size *= targetH / h;
        mctx.restore();
        return Math.floor(size);
      };

      let fontSize = fitFont();
      if (isCoarse || isSmall) fontSize = Math.floor(fontSize * 1.18); // make WORKS bigger on mobile
      mctx.font = `900 ${fontSize}px NK57, system-ui, sans-serif`;
      mctx.textAlign = "center";
      mctx.textBaseline = "middle";
      mctx.fillStyle = "#ffffff"; // mask fill
      const yCenter = (isCoarse || isSmall) ? height * 0.72 : height / 2; // push lower on mobile
      mctx.fillText(text, width / 2, yCenter);

      // Seed subtle pre-scratch lines in purple
      const styles = getComputedStyle(document.documentElement);
      const purple = (styles.getPropertyValue("--purpie") || "#b6a9c7").trim();
      const lctx = linesRef.current.getContext("2d");
      lctx.strokeStyle = purple;
      lctx.lineCap = "round";
      lctx.lineJoin = "round";
      lctx.lineWidth = brushWidth;
      const midY = height / 2;
      const segCount = 18; // more pre-lines for a richer look
      for (let i = 0; i < segCount; i++) {
        const y = midY + (Math.random() - 0.5) * (fontSize * 0.55);
        const segLen = Math.max(30, width * 0.08 * (0.6 + Math.random() * 0.8));
        const x0 = padX + Math.random() * ((width - padX * 2) - segLen);
        const x1 = x0 + segLen;
        lctx.beginPath();
        lctx.moveTo(x0, y);
        lctx.lineTo(x1, y + (Math.random() - 0.5) * 6);
        lctx.stroke();
      }

      const displayCtx = display.getContext("2d");
      displayCtx.clearRect(0, 0, width, height);
      displayCtx.drawImage(linesRef.current, 0, 0, width, height);
      displayCtx.globalCompositeOperation = "destination-in";
      displayCtx.drawImage(maskRef.current, 0, 0, width, height);
      displayCtx.globalCompositeOperation = "source-over";
    };

    resize();
    window.addEventListener("resize", resize);

    try {
      const mq = window.matchMedia && window.matchMedia("(pointer: fine)");
      if (mq) {
        const update = () => setPointerFine(!!mq.matches);
        update();
        mq.addEventListener?.("change", update);
      }
    } catch {}

    const styles = getComputedStyle(document.documentElement);
    const purple = (styles.getPropertyValue("--purpie") || "#b6a9c7").trim();

    const paintAt = (x, y) => {
      const lctx = linesRef.current.getContext("2d");
      lctx.strokeStyle = purple;
      lctx.lineCap = "round";
      lctx.lineJoin = "round";
      lctx.lineWidth = brushWidth;

      const prev = lastPosRef.current;
      if (!prev) {
        lctx.beginPath();
        lctx.arc(x, y, brushWidth / 2, 0, Math.PI * 2);
        lctx.fillStyle = purple;
        lctx.fill();
        lastPosRef.current = { x, y };
      } else {
        lctx.beginPath();
        lctx.moveTo(prev.x, prev.y);
        lctx.lineTo(x, y);
        lctx.stroke();
        lastPosRef.current = { x, y };
      }

      const displayCtx = display.getContext("2d");
      const width = display.width / dpr;
      const height = display.height / dpr;
      displayCtx.clearRect(0, 0, width, height);
      displayCtx.drawImage(linesRef.current, 0, 0, width, height);
      displayCtx.globalCompositeOperation = "destination-in";
      displayCtx.drawImage(maskRef.current, 0, 0, width, height);
      displayCtx.globalCompositeOperation = "source-over";
    };

    // Purple trail animation following cursor
    if (enableLocalTrail && trail) {
      const tctx = trail.getContext("2d");
      trailCtxRef.current = tctx;
      const animate = () => {
        const width = trail.width / dpr;
        const height = trail.height / dpr;
        tctx.clearRect(0, 0, width, height);

        const maxLen = 380;
        const speed = speedRef.current;
        const factor = Math.min(1, Math.max(0, speed / 1200));
        let targetLen = maxLen * factor;
        if (speed < 20) targetLen = 0;

        const pts = pointsRef.current;
        if (pts.length > 1) {
          let total = 0;
          for (let i = pts.length - 1; i > 0; i--) total += Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y);
          let remove = Math.max(0, total - targetLen);
          while (remove > 0 && pts.length > 1) {
            const a = pts[0], b = pts[1];
            const seg = Math.hypot(b.x - a.x, b.y - a.y);
            if (seg <= remove) { pts.shift(); remove -= seg; }
            else { const t = remove / seg; a.x = a.x + (b.x - a.x) * t; a.y = a.y + (b.y - a.y) * t; remove = 0; }
          }
        }

        if (pointsRef.current.length > 1) {
          tctx.strokeStyle = purple;
          tctx.lineWidth = brushWidth;
          tctx.lineJoin = "miter";
          tctx.lineCap = "round";
          tctx.beginPath();
          const time = performance.now() * 0.003;
          for (let i = 0; i < pointsRef.current.length; i++) {
            let px = pointsRef.current[i].x;
            let py = pointsRef.current[i].y;
            if (i > 0 && i < pointsRef.current.length - 1) {
              const ax = pointsRef.current[i+1].x - pointsRef.current[i-1].x;
              const ay = pointsRef.current[i+1].y - pointsRef.current[i-1].y;
              const len = Math.hypot(ax, ay) || 1;
              const nx = -ay / len, ny = ax / len;
              const amp = 0.6;
              const jitter = Math.sin(time + i) * amp;
              px += nx * jitter; py += ny * jitter;
            }
            if (i === 0) tctx.moveTo(px, py); else tctx.lineTo(px, py);
          }
          tctx.stroke();
        }

        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }

    const onMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const now = performance.now();
      const dt = Math.max(1, now - lastMoveTimeRef.current);
      const prev = lastCursorRef.current;
      const dx = x - prev.x; const dy = y - prev.y;
      const dist = Math.hypot(dx, dy);
      const speed = dist / (dt / 1000);
      speedRef.current = speed;
      const ang = Math.atan2(dy, dx);
      if (pointsRef.current.length === 0) {
        pointsRef.current.push({ x, y });
      } else {
        const lastPt = pointsRef.current[pointsRef.current.length - 1];
        const stepMin = 6;
        if (Math.hypot(x - lastPt.x, y - lastPt.y) >= stepMin) {
          const prevAng = lastAngleRef.current;
          const delta = prevAng == null ? Math.PI : Math.atan2(Math.sin(ang - prevAng), Math.cos(ang - prevAng));
          if (prevAng == null || Math.abs(delta) > 0.35) { pointsRef.current.push({ x, y }); lastAngleRef.current = ang; }
          else { lastPt.x = x; lastPt.y = y; }
        } else { lastPt.x = x; lastPt.y = y; }
      }
      lastMoveTimeRef.current = now;
      lastCursorRef.current = { x, y };
      setCursorPos({ x, y });
      // Always paint while moving (original behavior)
      paintAt(x, y);
    };
    const onLeave = () => { lastPosRef.current = null; setCursorPos({ x: -100, y: -100 }); };
    const onTouchStart = (e) => {
      if (!e.touches || e.touches.length === 0) return;
      drawingRef.current = true;
      const t = e.touches[0];
      onMove({ clientX: t.clientX, clientY: t.clientY });
    };
    const onTouchMove = (e) => {
      if (!e.touches || e.touches.length === 0) return;
      if (drawingRef.current) {
        const t = e.touches[0];
        onMove({ clientX: t.clientX, clientY: t.clientY });
        e.preventDefault(); // while drawing, keep the gesture in-canvas
      }
    };
    const onTouchEnd = () => { drawingRef.current = false; onLeave(); };

    container.addEventListener("mousemove", onMove);
    container.addEventListener("mouseenter", onMove);
    container.addEventListener("mouseleave", onLeave);
    // Touch: draw only when finger is down; otherwise allow scroll
    container.addEventListener("touchstart", onTouchStart, { passive: false });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("resize", resize);
      container.removeEventListener("mousemove", onMove);
      container.removeEventListener("mouseenter", onMove);
      container.removeEventListener("mouseleave", onLeave);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      // no global body style changes
    };
  }, [text, brushWidth]);

  return (
    <div
      ref={containerRef}
      className="relative scratch-works-container"
      style={{ background: "#ffffff", width: "100vw" }}
    >
      <canvas ref={displayCanvasRef} className="absolute inset-0 pointer-events-none" />
      {enableLocalTrail && (
        <canvas ref={trailCanvasRef} className="absolute inset-0 pointer-events-none" />
      )}

      {/* Instructional overlay */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start", paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)", paddingLeft: "clamp(14px, 5vw, 40px)", pointerEvents: "none" }}>
        <div style={{ color: "#000000", fontFamily: "Roobert, system-ui, sans-serif", letterSpacing: 2.2, fontSize: "clamp(12px, 2.8vw, 16px)", fontWeight: 600 }}>SCRATCH AROUND</div>
      </div>

      {/* Removed (05) label per request */}

      {/* Cursor handled globally to keep one cursor across sections */}
    </div>
  );
}



