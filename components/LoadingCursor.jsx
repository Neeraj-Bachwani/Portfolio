"use client";

import { useEffect, useRef, useState } from "react";

export default function LoadingCursor({ colorDark = "#ffffff", colorLight = "#1a1b1d" }) {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const canvasRef = useRef(null);
  const pointsRef = useRef([]); // trailing polyline (oldest -> newest)
  const lastCursorRef = useRef({ x: 0, y: 0 });
  const lastMoveTimeRef = useRef(performance.now());
  const lastAngleRef = useRef(null);
  const speedRef = useRef(0);
  useEffect(() => {
    const onMove = (e) => {
      const x = e.clientX; const y = e.clientY;
      const now = performance.now();
      const dt = Math.max(1, now - lastMoveTimeRef.current);
      const prev = lastCursorRef.current;
      const dx = x - prev.x; const dy = y - prev.y;
      const dist = Math.hypot(dx, dy);
      speedRef.current = dist / (dt / 1000);
      const ang = Math.atan2(dy, dx);
      // Maintain polyline with sharp corners (angle threshold)
      if (pointsRef.current.length === 0) {
        pointsRef.current.push({ x, y });
      } else {
        const lastPt = pointsRef.current[pointsRef.current.length - 1];
        const stepMin = 6; // add points every few px to keep it crisp
        if (Math.hypot(x - lastPt.x, y - lastPt.y) >= stepMin) {
          // Start a new segment if angle change is noticeable
          const prevAng = lastAngleRef.current;
          if (prevAng == null || Math.abs(Math.atan2(Math.sin(ang - prevAng), Math.cos(ang - prevAng))) > 0.35) {
            pointsRef.current.push({ x, y });
            lastAngleRef.current = ang;
          } else {
            // Continue the current segment by updating the last point
            lastPt.x = x; lastPt.y = y;
          }
        } else {
          // Small move: update last point so the head tracks cursor
          lastPt.x = x; lastPt.y = y;
        }
      }
      lastMoveTimeRef.current = now;
      lastCursorRef.current = { x, y };
      setPos({ x, y });
    };
    const onLeave = () => setPos({ x: -100, y: -100 });
    // Hide system cursor during loading
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

  // Jagged polyline trail drawing (sharp segments, retracts when stationary)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      const isLight = document.body.classList.contains("theme-light");
      const stroke = isLight ? colorLight : colorDark;
      const w = canvas.width / dpr; const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      // Determine dynamic length target based on speed
      const maxLen = 380; // ~10cm
      const speed = speedRef.current;
      const factor = Math.min(1, Math.max(0, speed / 1200)); // 0..1
      let targetLen = maxLen * factor;
      if (speed < 20) targetLen = 0; // retract when nearly stationary

      // Trim from the tail to maintain target length
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
          if (seg <= remove) {
            pts.shift();
            remove -= seg;
          } else {
            // move tail point along the segment
            const t = remove / seg;
            a.x = a.x + (b.x - a.x) * t;
            a.y = a.y + (b.y - a.y) * t;
            remove = 0;
          }
        }
      }

      // Draw polyline with slight angular wiggle on intermediate points
      if (pointsRef.current.length > 1) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 8;
        ctx.lineJoin = "miter";
        ctx.lineCap = "round";
        ctx.beginPath();
        const time = performance.now() * 0.003;
        for (let i = 0; i < pointsRef.current.length; i++) {
          let px = pointsRef.current[i].x;
          let py = pointsRef.current[i].y;
          if (i > 0 && i < pointsRef.current.length - 1) {
            // small perpendicular jitter for a lively feel
            const ax = pointsRef.current[i+1].x - pointsRef.current[i-1].x;
            const ay = pointsRef.current[i+1].y - pointsRef.current[i-1].y;
            const len = Math.hypot(ax, ay) || 1;
            const nx = -ay / len, ny = ax / len;
            const amp = 0.6; // subtle
            const jitter = Math.sin(time + i) * amp;
            px += nx * jitter; py += ny * jitter;
          }
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      requestAnimationFrame(animate);
    };
    const id = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", resize); };
  }, [pos.x, pos.y]);

  return (
    <>
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 99990 }} />
      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          transform: `translate(${pos.x - 6}px, ${pos.y - 6}px)`,
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: document.body && document.body.classList.contains('theme-light') ? colorLight : colorDark,
          pointerEvents: "none",
          zIndex: 99999,
        }}
      />
      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          transform: `translate(${pos.x - 12}px, ${pos.y - 12}px)`,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: document.body && document.body.classList.contains('theme-light') ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.18)",
          pointerEvents: "none",
          zIndex: 99998,
        }}
      />
    </>
  );
}
