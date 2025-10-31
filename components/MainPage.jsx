"use client";

import LoadingCursor from "./LoadingCursor";
import ScrambleText from "./ScrambleText";
import FloatingWords from "./FloatingWords";
import TechTicker from "./TechTicker";
import ScrollIndicator from "./ScrollIndicator";
import ScratchWorks from "./ScratchWorks";
import WorksScreen from "./WorksScreen";
import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";

export default function MainPage() {
  const worksRef = useRef(null);
  const [inLight, setInLight] = useState(false);
  const [inWorksPointer, setInWorksPointer] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const node = worksRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      const visible = e && e.isIntersecting;
      setInLight(!!visible);
      document.body.classList.toggle("theme-works", !!visible);
    }, { threshold: 0.25 });
    io.observe(node);
    return () => { io.disconnect(); document.body.classList.remove("theme-works"); };
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
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
      {/* Desktop nav */}
      <nav className="top-right-nav">
        <button className="nav-link" onClick={() => scrollTo("about")}>ABOUT</button>
        <button className="nav-link" onClick={() => scrollTo("works")}>WORKS</button>
        <span className="nav-link">CONTACT</span>
      </nav>

      {/* Mobile hamburger */}
      <button
        aria-label="Open menu"
        className={`hamburger-btn ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`} role="menu">
        <button className="mobile-item" onClick={() => scrollTo("about")}>ABOUT</button>
        <button className="mobile-item" onClick={() => scrollTo("works")}>WORKS</button>
        <button className="mobile-item">CONTACT</button>
      </div>

      {/* left hero name with hover scramble */}
      <div className="hero-wrap">
        <div className="hero-name">
          <ScrambleText text={"NEERAJ.\nBACHWANI"} className="" />
        </div>
        {/* Subtext block under name */}
        <div className="subtext">
          <div className="jp">{"\u3044 \u3089 \u3063 \u3057 \u3083 \u3044 \u307e \u305b"}</div>
          <div className="decor-line">/ / / / / / / / / / / </div>
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
      {/* two-scroll spacer before snap-to full screen */}
      <div id="wsnap" className="wg-snap-spacer" aria-hidden />
      <WorksScreen items={[
        {
          title: "VENTURERS",
          dir: "right",
          cover: "/images/ven.jpg",
          type: "mobile",
          screens: ["/images/ven1.png","/images/ven2.png","/images/ven3.png","/images/ven4.png","/images/ven5.png"],
          desc: "A comprehensive employee management app that centralizes daily operations - including job assignments, attendance tracking, worksite management, and emergency information, all within a simple and secure mobile interface.",
          stack: "React Native | Expo | SQLite | Flask | Python | REST API | SQLAlchemy | Node.js | NGINX",
          mdesc: "An employee management app for job assignments, attendance, worksites, and emergency info.",
        },
        {
          title: "NIGHT CITY",
          dir: "right",
          cover: "/images/cp.jpg",
          type: "desktop",
          screens: [
            "/images/cp1.png",
            "/images/cp2.png",
            "/images/cp3.png",
            "/images/cp4.png",
            "/images/cp5.png",
            "/images/cp6.png"
          ],
          desc: "A cyberpunk-inspired desktop dashboard featuring mini games, a built-in music player, live weather and location data, and interactive animations — designed with a sleek futuristic interface optimized for performance and SEO.",
          stack: "React | Tailwind CSS | JavaScript | Weather API | Geolocation API | SEO Optimization",
          mdesc: "A desktop dashboard with mini games, music player, live weather, and interactive animations.",
        },
        
         {
          title: "BRICK DEV",
          dir: "left",
          cover: "/images/bd.jpg",
          type: "desktop",
          screens: ["/images/bd1.png", "/images/bd2.png", "/images/bd3.png", "/images/bd4.png", "/images/bd5.png", "/images/bd6.png", "/images/bd7.png"],
          desc: "A real estate management platform for realtors to list and sell properties, hire contract workers, and oversee finances from a unified dashboard. Buyers can explore listings and use built-in mortgage calculators to plan their purchases.",
          stack: "Next.js | React | JavaScript | CSS | Supabase | PostgreSQL",
          mdesc: "A real estate management platform for listing and selling properties.",
        },
        {
          title: "RINDER",
          dir: "right",
          cover: "/images/rin.jpg",
          type: "desktop",
          screens: ["/images/rin1.png", "/images/rin2.png", "/images/rin3.png", "/images/rin4.png", "/images/rin5.png", "/images/rin6.png", "/images/rin7.png", "/images/rin8.png"],
          desc: "A mobile app for renters to find roommates, chat with them, and explore shared housing options. Users can post property listings, connect with others, and form groups to search for rental places together.",
          stack: "CSS | Framer Motion | Figma | UI/UX Design",
          mdesc: "A mobile app for renters to find roommates and explore shared housing options.",
        },
         {
          title: "HIDDEN GEMS",
          dir: "left",
          cover: "/images/hg.jpg",
          type: "desktop",
          screens: ["/images/hg1.png", "/images/hg2.png", "/images/hg3.png", "/images/hg4.png", "/images/hg5.png"],
          desc: "A mobile app that allows users to share their favorite locations and explore them on an interactive map. Built with real-time updates and secure data handling to help users discover and bookmark hidden spots within their city.",
          stack: "Expo | React Native | TypeScript | Supabase | Map API",
          mdesc: "A mobile app for sharing favorite locations and exploring them on an interactive map.",
        },
       
      ]} />
    </section>
    </>
  );
}
