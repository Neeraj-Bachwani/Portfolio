"use client";

import { useState } from 'react';
import Loading from '@/components/loading/Loading';
import MainPage from '@/components/MainPage';
import '@/src/app/page.css';

export default function Home() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative min-h-screen w-screen overflow-hidden">
      {loading ? (
        <Loading onComplete={() => setLoading(false)} />
      ) : (
        <MainPage />
      )}
    </div>
  );
}
