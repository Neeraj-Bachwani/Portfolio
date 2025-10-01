"use client";

import Loading from '@/components/Loading';
import { useEffect, useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(true);

  return (
    <div>
      {loading ? (
        <Loading onComplete={() => setLoading(false)} /> 
      ) : (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
          <h1 className="text-4xl font-bold mb-8">Welcome to My Portfolio</h1>
          {/* Other content */}
        </div>
      )}
    </div>
  );
}
