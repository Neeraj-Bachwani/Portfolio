"use client";

import { useEffect, useRef } from "react";

export default function ScrollActivity({ hideDelay = 800 }) {
  const timerRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    const show = () => {
      if (!root.classList.contains("scrolling")) root.classList.add("scrolling");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        root.classList.remove("scrolling");
      }, hideDelay);
    };

    const onWheel = () => show();
    const onScroll = () => show();
    const onTouch = () => show();

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchmove", onTouch);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [hideDelay]);

  return null;
}

