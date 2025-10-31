"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    try {
      const isTouch =
        typeof window !== 'undefined' && (
          window.matchMedia && window.matchMedia('(pointer: coarse)').matches ||
          'ontouchstart' in window ||
          (navigator && (navigator.maxTouchPoints || 0) > 0)
        );
      if (!isTouch) setEnabled(true);
    } catch {
      setEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // Hide default cursor
    document.body.style.cursor = 'none';

    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', updateMousePosition);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      document.body.style.cursor = 'auto';
      window.removeEventListener('mousemove', updateMousePosition);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible, enabled]);

  if (!enabled || !isVisible) return null;

  return (
    <>
      {/* Horizontal Line - Left */}
      <motion.div
        className="fixed top-0 left-0 h-[1px] bg-gainsboro pointer-events-none z-[9999]"
        style={{
          width: mousePosition.x,
          top: mousePosition.y,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 0.1 }}
      />

      {/* Horizontal Line - Right */}
      <motion.div
        className="fixed top-0 right-0 h-[1px] bg-gainsboro pointer-events-none z-[9999]"
        style={{
          width: `calc(100vw - ${mousePosition.x}px)`,
          top: mousePosition.y,
          left: mousePosition.x,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 0.1 }}
      />

      {/* Vertical Line - Top */}
      <motion.div
        className="fixed top-0 left-0 w-[1px] bg-gainsboro pointer-events-none z-[9999]"
        style={{
          height: mousePosition.y,
          left: mousePosition.x,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 0.1 }}
      />

      {/* Vertical Line - Bottom */}
      <motion.div
        className="fixed bottom-0 left-0 w-[1px] bg-gainsboro pointer-events-none z-[9999]"
        style={{
          height: `calc(100vh - ${mousePosition.y}px)`,
          top: mousePosition.y,
          left: mousePosition.x,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 0.1 }}
      />

      {/* Center Crosshair */}
      <motion.div
        className="fixed pointer-events-none z-[9999]"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.15 }}
      >
        {/* Horizontal bar of + */}
        <div className="absolute w-4 h-[1px] bg-gainsboro -translate-x-1/2 -translate-y-1/2" />
        
        {/* Vertical bar of + */}
        <div className="absolute w-[1px] h-4 bg-gainsboro -translate-x-1/2 -translate-y-1/2" />
        
        {/* Center dot */}
        <div className="absolute w-1 h-1 bg-gainsboro rounded-full -translate-x-1/2 -translate-y-1/2" />
      </motion.div>
    </>
  );
}
