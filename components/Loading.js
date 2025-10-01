"use client";

import { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import "./Loading.css";
import Butterfly from "./butterfly";

const Loading = ({ onComplete }) => {
  const [count, setCount] = useState(0);
  const [isBarAnimating, setIsBarAnimating] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Counter animation
  useEffect(() => {
    const start = Math.floor(Math.random() * 300) + 400;
    setCount(start);

    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev >= 777) {
          clearInterval(interval);
          setTimeout(() => setIsBarAnimating(true), 300);
          return 777;
        }
        return prev + Math.floor(Math.random() * (prev > 750 ? 2 : 15));
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  // Trigger fade out after bars animate
  useEffect(() => {
    if (isBarAnimating) {
      setTimeout(() => setIsFadingOut(true), 800);
    }
  }, [isBarAnimating]);

  // Complete callback
  useEffect(() => {
    if (isFadingOut && onComplete) {
      setTimeout(() => onComplete(), 300);
    }
  }, [isFadingOut, onComplete]);

  return (
    <AnimatePresence>
      {!isFadingOut && (
        <motion.div
          className="loading-container"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {/* ✅ 3D Butterfly */}
          <Suspense fallback={null}>
            <Butterfly />
          </Suspense>

          {/* ✅ Top Bar */}
          <motion.div
            className="top-bar"
            initial={{ width: "0%" }}
            animate={{ width: ["0%", "20%", "50%", "45%", "100%"] }}
            exit={isBarAnimating ? { y: "-100%" } : {}}
            transition={{
              times: [0, 0.3, 0.5, 0.7, 1],
              duration: 2.5,
              ease: "easeInOut",
            }}
          />

          {/* ✅ Top Content */}
          <div className="top-content">
            <div className="top-img">
              <img src="/images/top-arrow.png" alt="design" />
            </div>
            <p className="title">
              NEERAJ
              <br />
              BACHWANI
            </p>
            <div className="top-right">
              COMING
              <br />
              SOON.
            </div>
          </div>

          {/* ✅ Bottom Bar */}
          <motion.div
            className="bottom-bar"
            initial={{ y: 0 }}
            animate={{ y: 0 }}
            exit={isBarAnimating ? { y: "100%" } : {}}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <div className="bottom-img">
              <img src="/images/bot-icons.png" alt="design" />
            </div>
            <div className="number-box">
              <span className="number-glitch">{count}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default dynamic(() => Promise.resolve(Loading), { ssr: false });
