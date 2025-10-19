"use client";

import React, { useEffect, useRef, useState } from "react";

// Interactive scratch-fill for the word "NEERAJ"
// - White background
// - Custom small white cursor + purple trail
// - Letters start blank; moving over them paints purple scratch lines
export default function ScratchTextNEERAJ({ text = "KEQ", brushWidth = 8 }) {
  const containerRef = useRef(null);
  const displayCanvasRef = useRef(null); // masked lines only
  const trailCanvasRef = useRef(null);   // trail

  // Offscreen buffers
  const linesRef = useRef(null); // accumulates strokes
  const maskRef = useRef(null);  // text mask + hit test
  const fontRef = useRef("");
  const lastPosRef = useRef(null);
  const trailCtxRef = useRef(null);

  const posRef = useRef({ x: 0, y: 0 });
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const tailRef = useRef({ x: 0, y: 0 });
  const lastCursorRef = useRef({ x: 0, y: 0 });
  const lastDirRef = useRef({ x: 1, y: 0 });
  const lastMoveTimeRef = useRef(performance.now());
  const speedRef = useRef(0);
  const pointsRef = useRef([]); // polyline points for trail
  const lastAngleRef = useRef(null);

  const [pointerFine, setPointerFine] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const display = displayCanvasRef.current;
    const trail = trailCanvasRef.current;
    if (!container || !display || !trail) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    // Force white background while this component is mounted
    const prevBodyBg = document.body.style.background;
    document.body.style.background = "#ffffff";

    // Prepare offscreen canvases
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

      // Draw the text mask (solid shape)
      const mctx = maskRef.current.getContext("2d");
      const padX = width * 0.08;
      const padY = height * 0.18;

      const fitFont = (base = 120) => {
        mctx.save();
        mctx.font = `bold ${base}px NK57, system-ui, sans-serif`;
        const targetW = width - padX * 2;
        const w = Math.max(1, mctx.measureText(text).width);
        let size = (base * targetW) / w;
        mctx.font = `bold ${size}px NK57, system-ui, sans-serif`;
        const m2 = mctx.measureText(text);
        const h = (m2.actualBoundingBoxAscent || size * 0.7) + (m2.actualBoundingBoxDescent || size * 0.2);
        const targetH = height - padY * 2;
        if (h > targetH) size *= targetH / h;
        mctx.restore();
        return Math.floor(size);
      };

      const fontSize = fitFont();
      fontRef.current = `bold ${fontSize}px NK57, system-ui, sans-serif`;
      mctx.font = fontRef.current;
      mctx.textAlign = "center";
      mctx.textBaseline = "middle";
      // Use white for the mask fill
      mctx.fillStyle = "#ffffff";
      mctx.fillText(text, width / 2, height / 2);

      // Clear user lines on resize
      linesRef.current.getContext("2d").clearRect(0, 0, width, height);
    };

    resize();
    window.addEventListener("resize", resize);

    // Detect fine pointer for cursor visibility
    try {
      const mq = window.matchMedia && window.matchMedia("(pointer: fine)");
      if (mq) {
        const update = () => setPointerFine(!!mq.matches);
        update();
        mq.addEventListener?.("change", update);
      }
    } catch {}

    // Colors
    const styles = getComputedStyle(document.documentElement);
    const purpleHex = (styles.getPropertyValue("--purpie") || "#b6a9c7").trim();

    // Paint a batch of scratch lines at pos if inside the text mask
    const paintAt = (x, y) => {
      // Draw a solid stroke segment from previous to current point
      const lctx = linesRef.current.getContext("2d");
      lctx.strokeStyle = purpleHex;
      lctx.lineCap = "round";
      lctx.lineJoin = "round";
      lctx.lineWidth = brushWidth;

      const prev = lastPosRef.current;
      if (!prev) {
        // First point: draw a dot
        lctx.beginPath();
        lctx.arc(x, y, brushWidth / 2, 0, Math.PI * 2);
        lctx.fillStyle = purpleHex;
        lctx.fill();
        lastPosRef.current = { x, y };
      } else {
        lctx.beginPath();
        lctx.moveTo(prev.x, prev.y);
        lctx.lineTo(x, y);
        lctx.stroke();
        lastPosRef.current = { x, y };
      }

      // Composite onto display (lines masked to text only)
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

      // Dynamic length based on speed; retract when slow
      const maxLen = 380;
      const speed = speedRef.current;
      const factor = Math.min(1, Math.max(0, speed / 1200));
      let targetLen = maxLen * factor;
      if (speed < 20) targetLen = 0;

      // Trim from tail to maintain target length
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

      // Draw with subtle perpendicular jitter for life
      if (pointsRef.current.length > 1) {
        tctx.strokeStyle = "#b6a9c7";
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

    // Pointer handling (mouse)
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
      // Maintain segmented polyline
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
      posRef.current = { x, y };
      setCursorPos({ x, y });
      paintAt(x, y);
    };
    // Touch handling
    const onTouch = (e) => {
      if (!e.touches || e.touches.length === 0) return;
      const t = e.touches[0];
      const rect = container.getBoundingClientRect();
      const x = t.clientX - rect.left;
      const y = t.clientY - rect.top;
      setCursorPos({ x, y });
      paintAt(x, y);
      // prevent page scroll while drawing
      e.preventDefault();
    };
    const onLeave = () => {
      lastPosRef.current = null;
      setCursorPos({ x: -100, y: -100 });
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
  }, [text]);

  return (
    <div ref={containerRef} className="relative" style={{ background: "#ffffff", width: "100vw", height: "100dvh", cursor: pointerFine ? "none" : "auto" }}>
      <canvas ref={displayCanvasRef} className="absolute inset-0 pointer-events-none" />
      <canvas ref={trailCanvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Custom cursor: purple on white bg */}
      {pointerFine && <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transform: `translate(${cursorPos.x - 6}px, ${cursorPos.y - 6}px)`,
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "#b6a9c7",
          pointerEvents: "none",
        }}
      />}
      {pointerFine && <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transform: `translate(${cursorPos.x - 14}px, ${cursorPos.y - 14}px)`,
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "rgba(182,169,199,0.18)",
          pointerEvents: "none",
        }}
      />}
    </div>
  );
}
