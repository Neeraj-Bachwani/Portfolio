"use client";

import LoadingCursor from "./LoadingCursor";
import ScrambleText from "./ScrambleText";
import FloatingWords from "./FloatingWords";
import TechTicker from "./TechTicker";
import ScrollIndicator from "./ScrollIndicator";
import ScratchWorks from "./ScratchWorks";
import WorksGallery from "./WorksGallery";
import { useEffect, useRef, useState } from "react";

export default function MainPage() {
  const worksRef = useRef(null);
  const [inLight, setInLight] = useState(false);
  const [inWorksPointer, setInWorksPointer] = useState(false);

  useEffect(() => {
    const node = worksRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      const visible = e && e.isIntersecting;
      setInLight(!!visible);
      document.body.classList.toggle("theme-light", !!visible);
    }, { threshold: 0.25 });
    io.observe(node);
    return () => { io.disconnect(); document.body.classList.remove("theme-light"); };
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const startY = window.scrollY || document.documentElement.scrollTop || 0;
    const targetY = startY + el.getBoundingClientRect().top;
    const duration = 900;
    const ease = (t) => (t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2); // easeInOutCubic
    let start;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      const y = startY + (targetY - startY) * ease(p);
      window.scrollTo(0, y);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // Fade/slide in sections when they enter view
  useEffect(() => {
    const ids = ["about", "works"];
    const els = ids.map((i) => document.getElementById(i)).filter(Boolean);
    if (els.length === 0 || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("section-active");
      });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
    <ScrollIndicator />
    <div className="main-bg">
      {/* Global cursor (white/purple) except when pointer is inside WORKS */}
      {!inWorksPointer && (
        <LoadingCursor colorDark="#ffffff" colorLight="#b6a9c7" />
      )}

      {/* background video, starts below nav space */}
      <div className="bg-video-wrap" aria-hidden>
        <video className="bg-video" src="/video/bg.mp4" autoPlay muted loop playsInline />
        <div className="bg-video-overlay" />`r`n        <TechTicker />
      </div>

      {/* subtle noise overlay */}
      <div className="noise-overlay" />

      {/* top-right nav */}
      <nav className="top-right-nav">
        <button className="nav-link" onClick={() => scrollTo("about")}>ABOUT</button>
        <button className="nav-link" onClick={() => scrollTo("works")}>WORKS</button>
        <span className="nav-link">CONTACT</span>
      </nav>

      {/* left hero name with hover scramble */}
      <div className="hero-wrap">
        <div className="hero-name">
          <ScrambleText text={"NEERAJ.\nBACHWANI"} className="" />
        </div>
        {/* Subtext block under name */}
        <div className="subtext">
          <div className="jp">{"\u3044 \u3089 \u3063 \u3057 \u3083 \u3044 \u307e \u305b"}</div>
          <div className="decor-line">/ / / / / / / / / / / / /</div>
          <div className="tagline-full">WELCOME TO MY  //  PORTFOLIO.</div>
        </div>
      </div>

      {/* bottom sticky line bar */}
      <div className="bottom-bar" aria-hidden>
        <div className="bottom-content">
          <div className="bottom-left">
            <div className="version-left">V.</div>
            <div className="version-right">01</div>
          </div>
          <div className="bottom-center">
            <span className="name-left">NEERAJ.</span>
            <span className="name-gap"> </span>
            <span className="name-right">BACHWANI</span>
          </div>
          <div className="bottom-right">&copy; 2025</div>
        </div>
        <div className="bottom-line" />
      </div>
    </div>
    {/* Scroll section with floating words */}
    <FloatingWords
      id="about"
      text={`I BUILD ACROSS STACKS,
STYLES AND STORIES,
WHATEVER THE IDEA NEEDS,
I MAKE IT HAPPEN`}
    />
    <div className="section-divider" />
    <section
      className="works-section section-animate"
      id="works"
      ref={worksRef}
    >
      <div
        onMouseEnter={() => setInWorksPointer(true)}
        onMouseLeave={() => setInWorksPointer(false)}
        onTouchStart={() => setInWorksPointer(true)}
        onTouchEnd={() => setInWorksPointer(false)}
      >
        <ScratchWorks text="WORKS" />
      </div>
      <div className="works-info">
        A COLLECTION OF THINGS I'VE BUILT, LEARNED FROM, AND POURED CREATIVITY INTO. EACH ONE TELLS A SMALL PART OF MY JOURNEY.
      </div>
      <WorksGallery />
    </section>
    </>
  );
}
