"use client";

import Loading from '@/components/loading/Loading';
import IntroGate from '@/components/IntroGate';
import ScratchTextNEERAJ from '@/components/ScratchTextNEERAJ';
// import Navbar from '@/components/navbar';
// import CompassNav from '@/components/compassNav';
// import HeroModel from '@/components/heroModel';
// import CustomCursor from '@/components/customCursor';
import { useState } from 'react';
import './page.css';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [introDone, setIntroDone] = useState(false);

  return (
    <div className="relative min-h-screen w-screen overflow-hidden" style={{ background: "#ffffff" }}>
  {loading ? (
    <Loading onComplete={() => setLoading(false)} />
  ) : !introDone ? (
    <IntroGate onEnter={() => setIntroDone(true)} />
  ) : (
    <>
      {<div>
        <ScratchTextNEERAJ brushWidth={8} />
        {/* <Navbar />
        <CompassNav />  */}
      </div>}
    </>
  )}
</div>
  );
}
