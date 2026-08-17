"use client";

import { useEffect, useRef } from "react";

/**
 * Subtle animated background mesh/gradient that adds depth without distraction.
 * Uses CSS transforms for performance - no canvas or heavy rendering.
 * Automatically pauses when the page is hidden.
 */
export function AnimatedBackground() {
  const meshRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    let animationId: number;
    let startTime = Date.now();
    let isVisible = true;

    const animate = () => {
      if (!isVisible || !mesh) return;
      const elapsed = (Date.now() - startTime) / 1000;
      const x = Math.sin(elapsed * 0.03) * 15;
      const y = Math.cos(elapsed * 0.025) * 10;
      const s = 1 + Math.sin(elapsed * 0.015) * 0.02;
      mesh.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
      animationId = requestAnimationFrame(animate);
    };

    const onVisibility = () => {
      isVisible = document.visibilityState === "visible";
      if (isVisible) {
        startTime = Date.now();
        animationId = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(animationId);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="animated-mesh fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Primary mesh gradient blob */}
      <div
        ref={meshRef}
        className="absolute -right-[200px] -top-[100px] h-[600px] w-[600px] rounded-full opacity-[0.08]"
        style={{
          background:
            "radial-gradient(circle, rgba(70, 130, 255, 0.6), transparent 70%)",
          willChange: "transform",
        }}
      />
      {/* Secondary mesh */}
      <div
        className="absolute -bottom-[150px] -left-[200px] h-[500px] w-[500px] rounded-full opacity-[0.06]"
        style={{
          background:
            "radial-gradient(circle, rgba(28, 184, 131, 0.5), transparent 70%)",
          animation: "mesh-move-2 12s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      {/* Small geometric dots pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(21, 94, 239, 0.5) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
        }}
      />
    </div>
  );
}