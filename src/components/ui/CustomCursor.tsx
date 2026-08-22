"use client";

import React, { useEffect, useState } from "react";

export function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [trailing, setTrailing] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      const target = e.target as HTMLElement;
      if (target) {
        const isClickable =
          target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.onclick !== null ||
          target.getAttribute("role") === "button" ||
          target.closest("button") !== null ||
          target.closest("a") !== null;
        setIsPointer(isClickable);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    const follow = () => {
      setTrailing((prev) => ({
        x: prev.x + (position.x - prev.x) * 0.18,
        y: prev.y + (position.y - prev.y) * 0.18,
      }));
      animationFrameId = requestAnimationFrame(follow);
    };
    animationFrameId = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(animationFrameId);
  }, [position]);

  return (
    <div className="hidden lg:block pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Primary Dot */}
      <div
        className="fixed w-2 h-2 rounded-full bg-cyan-400 -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 shadow-[0_0_10px_#00f0ff]"
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      />
      {/* Trailing Aura Ring */}
      <div
        className={`fixed rounded-full border border-cyan-400/50 -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ${
          isPointer ? "w-10 h-10 border-cyan-300 bg-cyan-400/10 scale-110" : "w-6 h-6 bg-transparent scale-100"
        }`}
        style={{ left: `${trailing.x}px`, top: `${trailing.y}px` }}
      />
    </div>
  );
}
