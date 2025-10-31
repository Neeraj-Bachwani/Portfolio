"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ScrambleText from "./ScrambleText";

function FollowPreview({ screens = [], pos }) {
  const [idx, setIdx] = useState(0);
  const boxRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [dims, setDims] = useState({ w: 260, h: 180 });
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!boxRef.current || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect; if (r) setDims({ w: r.width, h: r.height });
    });
    ro.observe(boxRef.current); return () => ro.disconnect();
  }, [boxRef.current]);
  useEffect(() => { if (screens.length>1) { const t=setInterval(()=>setIdx(i=>(i+1)%screens.length),1400); return ()=>clearInterval(t);} }, [screens.length]);
  if (!mounted || !pos) return null;
  const vw = typeof window!=='undefined'?window.innerWidth:1000; const vh = typeof window!=='undefined'?window.innerHeight:800;
  const margin=10; const off={x:12,y:16};
  let x=(pos.x||0)+off.x, y=(pos.y||0)+off.y; x=Math.min(Math.max(x,margin), vw-(dims.w+margin)); y=Math.min(Math.max(y,margin), vh-(dims.h+margin));
  const node = (
    <div ref={boxRef} className="wg-follow" style={{ left:x, top:y }}>
      <div className="wg-preview-chrome"><div className="dot"/><div className="dot"/><div className="dot"/></div>
      <img src={screens[idx]} alt="preview" />
    </div>
  );
  return createPortal(node, document.body);
}

export default function WorksScreen({ items }) {
  const containerRef = useRef(null);
  const [index, setIndex] = useState(0);
  const prevIndexRef = useRef(0);
  const [hover, setHover] = useState(false);
  const [mouse, setMouse] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isFull, setIsFull] = useState(false); // fully snapped into view
  const scrollStepRef = useRef(0);
  const touchStartRef = useRef(null);
  const [flipKey, setFlipKey] = useState(0);
  const [swapDisc, setSwapDisc] = useState(false);
  const [prevCover, setPrevCover] = useState(null);
  const [chips, setChips] = useState([]); // {name, status}
  const [descKey, setDescKey] = useState(0);
  const rollFlipRef = useRef(false);
  const [rollTick, setRollTick] = useState(false);

  useEffect(()=>{
    const upd=()=>{ try{ const coarse=window.matchMedia && window.matchMedia('(pointer: coarse)').matches; const narrow=window.matchMedia && window.matchMedia('(max-width: 768px)').matches; setIsMobile(!!(coarse||narrow)); }catch{ setIsMobile(false);} };
    upd(); window.addEventListener('resize',upd); return()=>window.removeEventListener('resize',upd);
  },[]);

  // Enable project switching only when the purple screen is mostly in view
  useEffect(() => {
    const el = containerRef.current; if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (!e) return;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 1000;
      const ratio = e.intersectionRatio || 0;
      const height = e.intersectionRect?.height || 0;
      setIsFull(!!(ratio > 0.85 || height > vh * 0.85));
    }, { threshold: [0, 0.5, 0.85, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!isFull) return;
    const onWheel = (e) => {
      const dir = Math.sign(e.deltaY || 0); if (!dir) return;
      const el = containerRef.current; const rect = el?.getBoundingClientRect(); if (!rect) return;
      const topSnap = Math.abs(rect.top) <= 24; // looser snap on mobile
      // If not snapped to top yet, don't intercept; let natural scrolling finalize
      if (!topSnap) {
        if (dir > 0) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        return;
      }
      // Allow exiting upward from first project
      if (dir < 0 && topSnap && index === 0) {
        const anchor = document.getElementById('wsnap') || document.getElementById('works');
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'end' });
        return; // don't prevent default
      }
      e.preventDefault();
      scrollStepRef.current += dir;
      if (Math.abs(scrollStepRef.current) >= 2) {
        const next = Math.min(items.length - 1, Math.max(0, index + Math.sign(scrollStepRef.current)));
        if (next !== index) setIndex(next);
        scrollStepRef.current = 0;
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [isFull, index, items?.length]);

  useEffect(() => {
    if (!isFull) return;
    const onStart = (e) => { const t = e.touches?.[0]; if (t) touchStartRef.current = t.clientY; };
    const onMove = (e) => {
      if (touchStartRef.current == null) return;
      const t = e.touches?.[0]; if (!t) return;
      const dy = t.clientY - touchStartRef.current;
      if (Math.abs(dy) > 80) {
        const dir = dy > 0 ? -1 : 1; // swipe up -> next
        const el = containerRef.current; const rect = el?.getBoundingClientRect(); if (!rect) return;
        const topSnap = Math.abs(rect.top) <= 24; // looser snap on mobile
        if (!topSnap) { if (dir > 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
        if (dir < 0 && topSnap && index === 0) {
          const anchor = document.getElementById('wsnap') || document.getElementById('works');
          if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'end' });
          touchStartRef.current = null;
          return;
        }
        scrollStepRef.current += dir;
        touchStartRef.current = t.clientY;
        if (Math.abs(scrollStepRef.current) >= 2) {
          const next = Math.min(items.length - 1, Math.max(0, index + Math.sign(scrollStepRef.current)));
          if (next !== index) setIndex(next);
          scrollStepRef.current = 0;
        }
      }
    };
    const onEnd = () => { touchStartRef.current = null; };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd); };
  }, [isFull, index, items?.length]);

  const it = items?.[index]; if(!it) return null;
  const total = items?.length || 1;
  const prevIdx = prevIndexRef.current || 0;
  const currDigit = String((index+1) % 10);
  const prevDigit = String(((prevIdx)+1) % 10);
  useEffect(()=>{
    if(prevIndexRef.current!==index){
      const prev = items?.[prevIndexRef.current];
      setPrevCover(prev?.cover || null);
      setSwapDisc(true);
      setTimeout(()=> setSwapDisc(false), 800);
      // stack transitions staged: show stay+outs first, then swap in new ones
      const prevStack = (prev?.stack||"").split('|').map(s=>s.trim()).filter(Boolean);
      const nextStack = (it.stack||"").split('|').map(s=>s.trim()).filter(Boolean);
      const stay = nextStack.filter(s=> prevStack.includes(s));
      const outs = prevStack.filter(s=> !nextStack.includes(s));
      const ins  = nextStack.filter(s=> !prevStack.includes(s));
      // phase 1: show stay + out
      setChips([...stay.map(n=>({ name:n, status:'stay' })), ...outs.map(n=>({ name:n, status:'out' }))]);
      // phase 2: after outs animate out, show ins animating in
      setTimeout(()=>{
        setChips([...stay.map(n=>({ name:n, status:'stay' })), ...ins.map(n=>({ name:n, status:'in' }))]);
      }, 360);
      // title/desc retrigger keys
      setDescKey(k=>k+1);
      setFlipKey(k=>k+1);
      // retrigger digit roll each change (toggle t0/t1 class)
      rollFlipRef.current = !rollFlipRef.current; setRollTick(rollFlipRef.current);
      prevIndexRef.current=index;
    } else {
      const nextStack = (it.stack||"").split('|').map(s=>s.trim()).filter(Boolean);
      setChips(nextStack.map(n=>({ name:n, status:'stay' })));
    }
  }, [index]);

  // Auto-snap to the screen when it first becomes visible scrolling down
  useEffect(()=>{
    const el = containerRef.current; if(!el || typeof IntersectionObserver==='undefined') return;
    let lastY = window.scrollY;
    let snapped = false;
    const io = new IntersectionObserver((entries)=>{
      const e = entries[0]; if(!e) return;
      const nowY = window.scrollY; const dirDown = nowY > lastY; lastY = nowY;
      if (dirDown && e.isIntersecting && !snapped) {
        const top = el.getBoundingClientRect().top;
        if (Math.abs(top) > 2) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); snapped = true; setTimeout(()=>{ snapped=false; }, 600); }
      } else if (!dirDown && e.isIntersecting && !snapped) {
        // Snap back up to the spacer anchor when scrolling up
        const anchor = document.getElementById('wsnap') || document.getElementById('works');
        if (anchor) {
          const top = el.getBoundingClientRect().top;
          // make the paragraph area reappear quickly when scrolling up
          if (top > window.innerHeight * 0.25) { anchor.scrollIntoView({ behavior: 'smooth', block: 'end' }); snapped = true; setTimeout(()=>{ snapped=false; }, 600); }
        }
      }
    }, { threshold: 0.05 });
    io.observe(el);
    return ()=> io.disconnect();
  }, []);

  // Number roll temporarily disabled per request; render plain number

  return (
    <div ref={containerRef} className="wg-screen" role="region" aria-label="Works">
      <div className="wg-screen-inner">
        <div className="wg-s-center">
          <div
            className={`wg-s-card ${flipKey ? 'flip' : ''}`}
            onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onMouseMove={(e)=>setMouse({x:e.clientX,y:e.clientY})}
            onTouchStart={(e)=>{ const t=e.touches?.[0]; if(t) setMouse({x:t.clientX,y:t.clientY}); setHover(true); }}
            onTouchMove={(e)=>{ const t=e.touches?.[0]; if(t) setMouse({x:t.clientX,y:t.clientY}); }}
            onTouchEnd={()=>setHover(false)}
          >
            {/* Spinning circular disc using the cover image */}
            <div className={`wg-disc ${swapDisc ? 'swap' : ''}`}>
              {swapDisc && prevCover && (
                <img className="wg-disc-img disc-old" src={prevCover} alt="previous" />
              )}
              <img key={index} className={`wg-disc-img ${swapDisc ? 'disc-new' : 'disc-current'}`} src={it.cover} alt={it.title} />
              <div className="wg-disc-ring" />
            </div>
            {/* Mobile marquee over the disc removed per request */}
          </div>
        </div>
        <div className="wg-s-right" />
      </div>
      {hover && (<FollowPreview screens={it.screens || [it.cover]} pos={mouse} />)}
      <div className="wg-s-line" />
      {/* Overlay number and title aligned to the line */}
      <div className="wg-s-overlay">
        {/* 00 fixed, last digit rolls */}
        <div className="wg-num-abs">
          <span className="num-prefix">00</span>
          <span className={`digit-roll ${index >= prevIdx ? 'down':'up'} ${rollTick ? 't1':'t0'}`}>
            <span className="d-prev">{prevDigit}</span>
            <span className="d-next">{currDigit}</span>
          </span>
          <span className="num-dot">.</span>
        </div>
        <div className="wg-title-abs"><ScrambleText text={(it.title||'').toUpperCase()} autoStartKey={index} /></div>
        {chips.length>0 && (
          <div className="wg-stack-abs">
            {isMobile ? (
              <div className="wg-stack-track">
                {[...chips, ...chips].map((c, i)=> (
                  <span key={`${c.name}-${i}`} className="wg-chip">{c.name}</span>
                ))}
              </div>
            ) : (
              chips.map((c)=> (<span key={c.name} className={`wg-chip chip-${c.status}`}>{c.name}</span>))
            )}
          </div>
        )}
        {(() => { const d = (isMobile && it.mdesc) ? it.mdesc : it.desc; return d ? (<div key={descKey} className="wg-desc-abs slide-in">{(d||'').toUpperCase()}</div>) : null; })()}
      </div>
      <div className="wg-s-pager" aria-label="Project navigation">
        <span className="wg-s-count">{String(index+1).padStart(3,'0')}</span>
        <button className="wg-s-nav" onClick={()=> setIndex(i=> Math.max(0, i-1))}>PREV</button>
        <button className="wg-s-nav" onClick={()=> setIndex(i=> Math.min(total-1, i+1))}>NEXT</button>
        <span className="wg-s-count">{String(total).padStart(3,'0')}</span>
      </div>
    </div>
  );
}
