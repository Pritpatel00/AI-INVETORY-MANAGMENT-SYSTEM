"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animated counter that counts up to the target value on mount/change.
 */
export function AnimatedCounter({
  value,
  duration = 600,
  decimals = 0,
}: {
  value: number;
  duration?: number;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    if (start === end) return;

    // Respect reduced-motion preference: jump straight to the target value.
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      prevRef.current = end;
      const jumpFrame = requestAnimationFrame(() => setDisplay(end));
      return () => cancelAnimationFrame(jumpFrame);
    }

    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    prevRef.current = end;
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [value, duration]);

  return <>{display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
}

/**
 * Fade-in-up entrance animation wrapper.
 */
export function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={`animate-fade-in-up ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/**
 * Scale-in entrance animation for dialogs/modals.
 */
export function ScaleIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={`animate-scale-in ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/**
 * Animated status indicator with glow.
 */
export function StatusPulse({
  status,
  size = 7,
}: {
  status: "online" | "offline" | "warning" | "processing";
  size?: number;
}) {
  const colors = {
    online: { bg: "#20ad76", shadow: "rgba(32,173,118,0.5)" },
    offline: { bg: "#e08a1d", shadow: "rgba(224,138,29,0.5)" },
    warning: { bg: "#d47b08", shadow: "rgba(212,123,8,0.5)" },
    processing: { bg: "#155eef", shadow: "rgba(21,94,239,0.5)" },
  };

  const color = colors[status];

  return (
    <span
      className="inline-block rounded-full"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        background: color.bg,
        boxShadow: `0 0 0 0 ${color.shadow}`,
        animation:
          status === "online"
            ? "live-pulse 2s infinite"
            : status === "offline"
              ? "offline-pulse 1.6s infinite"
              : status === "processing"
                ? "processing-pulse 1.2s ease-in-out infinite"
                : "warning-blink 1.2s ease-in-out infinite",
      }}
    />
  );
}