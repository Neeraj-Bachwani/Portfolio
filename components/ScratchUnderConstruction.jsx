"use client";

import React, { useEffect, useRef, useState } from "react";

export default function ScratchUnderConstruction({
  text = "UNDER CONSTRUCTION",
  brushWidth = 4,
}) {
  const containerRef = useRef(null);
  const displayCanvasRef = useRef(null);
  const trailCanvasRef = useRef(null);

  const linesRef = useRef(null);
  const maskRef = useRef(null);
  const lastPosRef = useRef(null);
  const pointsRef = useRef([]);
  const lastCursorRef = useRef({ x: 0, y: 0 });
  const lastMoveTimeRef = useRef(typeof performance !== "undefined" ? performance.now() : 0);
  const speedRef = useRef(0);
  const lastAngleRef = useRef(null);
  const trailCtxRef = useRef(null);

  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [pointerFine, setPointerFine] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const display = displayCanvasRef.current;
    const trail = trailCanvasRef.current;
    if (!container || !display || !trail) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    // Force black background while mounted
    const prevBodyBg = document.body.style.background;
    document.body.style.background = "#000000";

    linesRef.current = document.createElement("canvas");
    maskRef.current = document.createElement("canvas");

    const resize = () => {
      const width = container.clientWidth || window.innerWidth || 0;
      const height = container.clientHeight || window.innerHeight || 0;
      if (width <= 0 || height <= 0) return;

      // Size visible canvases
      for (const c of [display, trail]) {
        c.width = Math.floor(width * dpr);
        c.height = Math.floor(height * dpr);
        c.style.width = width + "px";
        c.style.height = height + "px";
        const ctx = c.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
      }

      // Size offscreen canvases
      for (const c of [linesRef.current, maskRef.current]) {
        c.width = Math.floor(width * dpr);
        c.height = Math.floor(height * dpr);
        const ctx = c.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
      }

      // Draw text mask in offscreen
      const mctx = maskRef.current.getContext("2d");
      const padX = width * 0.08;
      const padY = height * 0.2;

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

      const fontSize = fitFont();
      mctx.font = `900 ${fontSize}px NK57, system-ui, sans-serif`;
      mctx.textAlign = "center";
      mctx.textBaseline = "middle";
      mctx.fillStyle = "#ffffff"; // mask fill
      mctx.fillText(text, width / 2, height / 2);

      // Seed small pre-scratch segments (subtle; don't reveal too much)
      const lctx = linesRef.current.getContext("2d");
      lctx.strokeStyle = "#ff4102"; // orange
      lctx.lineCap = "round";
      lctx.lineJoin = "round";
      lctx.lineWidth = brushWidth;
      const midY = height / 2;
      const segCount = 8;
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

      // Composite seeded strokes
      const displayCtx = display.getContext("2d");
      displayCtx.clearRect(0, 0, width, height);
      displayCtx.drawImage(linesRef.current, 0, 0, width, height);
      displayCtx.globalCompositeOperation = "destination-in";
      displayCtx.drawImage(maskRef.current, 0, 0, width, height);
      displayCtx.globalCompositeOperation = "source-over";
    };

    resize();
    window.addEventListener("resize", resize);

    // Detect fine pointer for cursor
    try {
      const mq = window.matchMedia && window.matchMedia("(pointer: fine)");
      if (mq) {
        const update = () => setPointerFine(!!mq.matches);
        update();
        mq.addEventListener?.("change", update);
      }
    } catch {}

    // Painting logic
    const paintAt = (x, y) => {
      const lctx = linesRef.current.getContext("2d");
      lctx.strokeStyle = "#ff4102"; // orange
      lctx.lineCap = "round";
      lctx.lineJoin = "round";
      lctx.lineWidth = brushWidth;

      const prev = lastPosRef.current;
      if (!prev) {
        lctx.beginPath();
        lctx.arc(x, y, brushWidth / 2, 0, Math.PI * 2);
        lctx.fillStyle = "#ff4102";
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

    // Trail animation (segmented polyline with sharp corners)
    const tctx = trail.getContext("2d");
    trailCtxRef.current = tctx;
    const animate = () => {
      const width = trail.width / dpr;
      const height = trail.height / dpr;
      tctx.clearRect(0, 0, width, height);

      const maxLen = 320;
      const speed = speedRef.current;
      const factor = Math.min(1, Math.max(0, speed / 1200));
      let targetLen = maxLen * factor;
      if (speed < 20) targetLen = 0;

      const pts = pointsRef.current;
      if (pts.length > 1) {
        let total = 0;
        for (let i = pts.length - 1; i > 0; i--) {
          total += Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y);
        }
        let remove = Math.max(0, total - targetLen);
        while (remove > 0 && pts.length > 1) {
          const a = pts[0], b = pts[1];
          const seg = Math.hypot(b.x - a.x, b.y - a.y);
          if (seg <= remove) { pts.shift(); remove -= seg; }
          else {
            const t = remove / seg;
            a.x = a.x + (b.x - a.x) * t;
            a.y = a.y + (b.y - a.y) * t;
            remove = 0;
          }
        }
      }

      if (pointsRef.current.length > 1) {
        tctx.strokeStyle = "#ff4102";
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
          if (prevAng == null || Math.abs(delta) > 0.35) {
            pointsRef.current.push({ x, y });
            lastAngleRef.current = ang;
          } else {
            lastPt.x = x; lastPt.y = y;
          }
        } else {
          lastPt.x = x; lastPt.y = y;
        }
      }
      lastMoveTimeRef.current = now;
      lastCursorRef.current = { x, y };
      setCursorPos({ x, y });
      paintAt(x, y);
    };
    const onLeave = () => {
      lastPosRef.current = null;
      setCursorPos({ x: -100, y: -100 });
    };
    const onTouch = (e) => {
      if (!e.touches || e.touches.length === 0) return;
      const t = e.touches[0];
      const rect = container.getBoundingClientRect();
      const x = t.clientX - rect.left;
      const y = t.clientY - rect.top;
      onMove({ clientX: t.clientX, clientY: t.clientY });
      e.preventDefault();
    };

    container.addEventListener("mousemove", onMove);
    container.addEventListener("mouseenter", onMove);
    container.addEventListener("mouseleave", onLeave);
    container.addEventListener("touchstart", onTouch, { passive: false });
    container.addEventListener("touchmove", onTouch, { passive: false });
    container.addEventListener("touchend", onLeave);

    return () => {
      window.removeEventListener("resize", resize);
      container.removeEventListener("mousemove", onMove);
      container.removeEventListener("mouseenter", onMove);
      container.removeEventListener("mouseleave", onLeave);
      container.removeEventListener("touchstart", onTouch);
      container.removeEventListener("touchmove", onTouch);
      container.removeEventListener("touchend", onLeave);
      document.body.style.background = prevBodyBg;
    };
  }, [text, brushWidth]);

  return (
    <div ref={containerRef} className="relative" style={{ background: "#000000", width: "100vw", height: "100dvh", cursor: pointerFine ? "none" : "auto" }}>
      <canvas ref={displayCanvasRef} className="absolute inset-0 pointer-events-none" />
      <canvas ref={trailCanvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Instructional overlay */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: "calc(env(safe-area-inset-top, 0px) + 14px)", pointerEvents: "none" }}>
        <div style={{ color: "#e0dfe3", fontFamily: "Roobert, system-ui, sans-serif", letterSpacing: 2, fontSize: 12 }}>SCRATCH AROUND</div>
      </div>

      {/* Custom cursor: orange on black (mouse only) */}
      {pointerFine && (
        <>
          <div style={{ position: "absolute", left: 0, top: 0, transform: `translate(${cursorPos.x - 6}px, ${cursorPos.y - 6}px)`, width: 12, height: 12, borderRadius: "50%", background: "#ff4102", pointerEvents: "none" }} />
          <div style={{ position: "absolute", left: 0, top: 0, transform: `translate(${cursorPos.x - 14}px, ${cursorPos.y - 14}px)`, width: 28, height: 28, borderRadius: "50%", background: "rgba(255,65,2,0.18)", pointerEvents: "none" }} />
        </>
      )}
    </div>
  );
}
