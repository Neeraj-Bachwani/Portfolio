"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

function useInViewStagger(containerRef, itemClass = "wg-item") {
  useEffect(() => {
    const root = containerRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const nodes = Array.from(root.getElementsByClassName(itemClass));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = nodes.indexOf(e.target);
            e.target.style.transitionDelay = `${Math.min(idx * 120, 600)}ms`;
            e.target.classList.add("show");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [containerRef, itemClass]);
}

function FollowPreview({ screens = [], pos }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (screens.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % screens.length), 1400);
    return () => clearInterval(t);
  }, [screens.length]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!pos || !mounted) return null;
  const node = (
    <div className="wg-follow" style={{ left: pos.x, top: pos.y, transform: 'translate(12px, 16px)' }}>
      <div className="wg-preview-chrome">
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
      </div>
      <img src={screens[idx]} alt="preview" />
    </div>
  );
  return createPortal(node, document.body);
}

export default function WorksGallery({
  items = [
    {
      title: "Venturers",
      dir: "right",
      cover: "/images/ven.jpg",
      type: "mobile",
      screens: [
        "/images/ven1.png",
        "/images/ven2.png",
        "/images/ven3.png",
        "/images/ven4.png",
        "/images/ven5.png",
      ],
      desc:
        "Employee operations app: jobs, attendance, worksites, and emergency info in one place.",
      stack: "React Native | SQLite | Flask | Python | REST API",
    },
    /*
    {
      title: "Night City Companion",
      dir: "left",
      cover: "/images/cp.jpg",
      type: "desktop",
      screens: ["/images/cp1.png", "/images/cp2.png", "/images/cp3.png", "/images/cp4.png"],
      desc: "A cyberpunk-themed dashboard for minigames , music, weather and more.",
      stack: "React | Tailwind CSS",
    },
    {
      title: "Project Three",
      dir: "right",
      cover: "/images/rin.jpg",
      type: "desktop",
      screens: ["/images/rin.jpg", "/images/hg.jpg"],
      desc: "Marketing site exploration.",
      stack: "Next.js | CSS | Framer Motion",
    },
    {
      title: "Hologram Lab",
      dir: "left",
      cover: "/images/hg.jpg",
      type: "desktop",
      screens: ["/images/hg.jpg", "/images/rin.jpg"],
      desc: "Experimental UI screens and mockups.",
      stack: "Next.js | CSS",
    },
    */
  ],
}) {
  const wrapRef = useRef(null);
  useInViewStagger(wrapRef, "wg-row");
  const [hovered, setHovered] = useState(null);
  const coverRefs = useRef([]);
  const [hMap, setHMap] = useState({});
  const [mouse, setMouse] = useState(null);

  // Keep opposite-side height synced with cover via ResizeObserver
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        const idx = coverRefs.current.indexOf(el);
        if (idx !== -1) {
          const h = Math.floor(entry.contentRect.height || el.getBoundingClientRect().height);
          if (h && hMap[idx] !== h) {
            setHMap((m) => ({ ...m, [idx]: h }));
          }
        }
      });
    });
    coverRefs.current.forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [items.length]);

  const visibleItems = items.slice(0, 1);

  return (
    <div ref={wrapRef} className="wg-rows">
      {visibleItems.map((it, i) => {
        const right = it.dir !== "left"; // cover sits on right by default
        const isHover = hovered === i;
        return (
          <div
            className={`wg-row ${right ? "from-right" : "from-left"}`}
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => { setHovered((h) => (h === i ? null : h)); setMouse(null); }}
          >
            {/* Opposite side content: info tray only (more space) */}
            <div
              className={`wg-side ${right ? "left" : "right"}`}
              style={{ minHeight: hMap[i] ? `${hMap[i]}px` : undefined }}
            >
              <div
                className={`wg-pop ${right ? "attach-left" : "attach-right"} ${
                  isHover ? "open" : ""
                }`}
              >
                {isHover && (
                  <div className={`wg-tray ${right ? "attach-left" : "attach-right"}`}>
                    <div className="wg-tray-right">
                      <div className="wg-tray-title">{it.title}</div>
                      {it.desc && <div className="wg-tray-desc">{it.desc}</div>}
                      {(it.stack || "").trim() && (
                        <div className="wg-tray-stack">
                          <div className="wg-tray-stacklabel">TECH STACK</div>
                          <div className="wg-tray-chips">
                            {(it.stack || "")
                              .split("|")
                              .map((s) => s.trim())
                              .filter(Boolean)
                              .map((c, k) => (
                                <span className="wg-chip" key={k}>
                                  {c}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cover side */}
            <div className={`wg-side ${right ? "right" : "left"}`}>
              <div
                className="wg-card one-row"
                onMouseEnter={() => {
                  const img = coverRefs.current[i];
                  if (img) {
                    const h = Math.floor(img.getBoundingClientRect().height);
                    setHMap((m) => ({ ...m, [i]: h }));
                  }
                }}
                onMouseMove={(e) => setMouse({ x: e.clientX, y: e.clientY })}
                onMouseLeave={() => { /* keep row hovered while moving to tray */ }}
              >
                <img
                  ref={(el) => (coverRefs.current[i] = el)}
                  className="wg-cover"
                  src={it.cover}
                  alt={it.title}
                  onLoad={(e) => {
                    const h = Math.floor(e.currentTarget.getBoundingClientRect().height);
                    if (h && h !== hMap[i]) setHMap((m) => ({ ...m, [i]: h }));
                  }}
                />
                <div className="wg-meta wg-meta-on">
                  <div className="wg-title">{it.title}</div>
                  <div className="wg-tag wg-tag-strong">
                    {it.type.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
            {/* Cursor-following floating preview */}
            {isHover && (
              <FollowPreview screens={it.screens || [it.cover]} pos={mouse} />
            )}
          </div>
        );
      })}
      {/* Under construction bar */}
      <div className="wg-ucbar">////////// UNDER CONSTRUCTION //////////</div>
    </div>
  );
}
