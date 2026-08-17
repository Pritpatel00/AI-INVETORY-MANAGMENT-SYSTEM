"use client";

import { useEffect, useRef, useState } from "react";

interface WarehouseHeroProps {
  variant?: "executive" | "manager" | "admin";
  className?: string;
}

/**
 * Lightweight 3D warehouse illustration using SVG.
 * Reacts gently to mouse movement on desktop.
 * Disabled on touch devices to avoid scroll interference.
 */
export function WarehouseHero({ variant = "executive", className = "" }: WarehouseHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const isTouchDevice = useRef(false);

  useEffect(() => {
    isTouchDevice.current =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice.current) return;

    const container = containerRef.current;
    if (!container) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const x = (e.clientY - centerY) / 20;
      const y = (e.clientX - centerX) / 30;
      setRotateX(Math.max(-8, Math.min(8, x)));
      setRotateY(Math.max(-12, Math.min(12, y)));
    };

    const onMouseLeave = () => {
      setRotateX(0);
      setRotateY(0);
    };

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);

    return () => {
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  const colors = {
    shelf: variant === "admin" ? "#c9bfff" : "#9fc2ff",
    shelfLight: variant === "admin" ? "#a996ff" : "#72a8ff",
    box: "#1c7b4c",
    boxLight: "#2ea86a",
    accent: "#f0a13a",
    bg: "rgba(255,255,255,0.06)",
  };

  const boxColor = variant === "admin" ? "#7257d6" : variant === "manager" ? "#155eef" : "#16865b";

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        perspective: "800px",
        transformStyle: "preserve-3d",
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 200 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: "transform 0.2s ease-out",
          filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.08))",
        }}
      >
        {/* Warehouse floor / perspective */}
        <g opacity="0.15">
          <path
            d="M20 120 L180 120 L160 90 L40 90 Z"
            fill="white"
            opacity="0.3"
          />
        </g>

        {/* Shelving unit - left */}
        <g opacity="0.94">
          <rect x="30" y="40" width="4" height="70" rx="1" fill={colors.shelf} opacity="0.4" />
          <rect x="30" y="40" width="50" height="4" rx="1" fill={colors.shelf} opacity="0.3" />
          <rect x="30" y="60" width="50" height="4" rx="1" fill={colors.shelf} opacity="0.3" />
          <rect x="30" y="80" width="50" height="4" rx="1" fill={colors.shelf} opacity="0.3" />
          <rect x="76" y="40" width="4" height="70" rx="1" fill={colors.shelf} opacity="0.4" />
        </g>

        {/* Boxes on shelves */}
        <g opacity="0.92">
          <rect x="36" y="44" width="14" height="12" rx="2" fill={boxColor} opacity="0.5" />
          <rect x="54" y="44" width="14" height="12" rx="2" fill={boxColor} opacity="0.35" />
          <rect x="36" y="64" width="18" height="12" rx="2" fill={boxColor} opacity="0.45" />
          <rect x="58" y="64" width="14" height="12" rx="2" fill={boxColor} opacity="0.3" />
          <rect x="36" y="84" width="32" height="12" rx="2" fill={boxColor} opacity="0.4" />
        </g>

        {/* Shelving unit - right */}
        <g opacity="0.94">
          <rect x="120" y="30" width="4" height="80" rx="1" fill={colors.shelf} opacity="0.4" />
          <rect x="120" y="30" width="50" height="4" rx="1" fill={colors.shelf} opacity="0.3" />
          <rect x="120" y="50" width="50" height="4" rx="1" fill={colors.shelf} opacity="0.3" />
          <rect x="120" y="70" width="50" height="4" rx="1" fill={colors.shelf} opacity="0.3" />
          <rect x="120" y="90" width="50" height="4" rx="1" fill={colors.shelf} opacity="0.3" />
          <rect x="166" y="30" width="4" height="80" rx="1" fill={colors.shelf} opacity="0.4" />
        </g>

        {/* Boxes on right shelves */}
        <g opacity="0.92">
          <rect x="126" y="34" width="16" height="12" rx="2" fill={boxColor} opacity="0.4" />
          <rect x="146" y="34" width="16" height="12" rx="2" fill={boxColor} opacity="0.3" />
          <rect x="126" y="54" width="20" height="12" rx="2" fill={boxColor} opacity="0.35" />
          <rect x="150" y="54" width="12" height="12" rx="2" fill={boxColor} opacity="0.25" />
          <rect x="126" y="74" width="36" height="12" rx="2" fill={boxColor} opacity="0.3" />
        </g>

        {/* Floating boxes - animated */}
        <g opacity="0.5">
          <rect x="90" y="20" width="12" height="10" rx="2" fill={boxColor} opacity="0.3">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 0,-4; 0,0"
              dur="4s"
              repeatCount="indefinite"
            />
          </rect>
          <rect x="94" y="24" width="4" height="3" rx="1" fill={colors.boxLight} opacity="0.3">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 0,-4; 0,0"
              dur="4s"
              repeatCount="indefinite"
            />
          </rect>
        </g>

        {/* Inventory movement arrows */}
        <g opacity="0.5">
          <path
            d="M82 70 L82 50 L90 50"
            stroke={colors.accent}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <animate
              attributeName="opacity"
              values="0.3;0.8;0.3"
              dur="3s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M84 48 L90 50 L84 52"
            fill={colors.accent}
            opacity="0.6"
          >
            <animate
              attributeName="opacity"
              values="0.3;0.8;0.3"
              dur="3s"
              repeatCount="indefinite"
            />
          </path>
        </g>

        {/* Voice waveform */}
        {variant === "executive" && (
          <g opacity="0.4" transform="translate(88, 105)">
            <rect x="0" y="0" width="3" height="10" rx="1.5" fill={colors.shelfLight}>
              <animate attributeName="height" values="10;18;10" dur="1s" repeatCount="indefinite" />
              <animate attributeName="y" values="0;-4;0" dur="1s" repeatCount="indefinite" />
            </rect>
            <rect x="6" y="-2" width="3" height="14" rx="1.5" fill={colors.shelfLight}>
              <animate attributeName="height" values="14;8;14" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="y" values="-2;2;-2" dur="1.2s" repeatCount="indefinite" />
            </rect>
            <rect x="12" y="1" width="3" height="8" rx="1.5" fill={colors.shelfLight}>
              <animate attributeName="height" values="8;16;8" dur="0.9s" repeatCount="indefinite" />
              <animate attributeName="y" values="1;-4;1" dur="0.9s" repeatCount="indefinite" />
            </rect>
            <rect x="18" y="-3" width="3" height="16" rx="1.5" fill={colors.shelfLight}>
              <animate attributeName="height" values="16;10;16" dur="1.1s" repeatCount="indefinite" />
              <animate attributeName="y" values="-3;1;-3" dur="1.1s" repeatCount="indefinite" />
            </rect>
            <rect x="24" y="0" width="3" height="10" rx="1.5" fill={colors.shelfLight}>
              <animate attributeName="height" values="10;6;10" dur="0.8s" repeatCount="indefinite" />
              <animate attributeName="y" values="0;2;0" dur="0.8s" repeatCount="indefinite" />
            </rect>
          </g>
        )}

        {/* Database node for admin */}
        {variant === "admin" && (
          <g opacity="0.5" transform="translate(150, 20)">
            <ellipse cx="10" cy="5" rx="10" ry="5" fill={colors.shelfLight} opacity="0.4" />
            <rect x="0" y="5" width="20" height="8" rx="1" fill={colors.shelfLight} opacity="0.3" />
            <ellipse cx="10" cy="13" rx="10" ry="5" fill={colors.shelfLight} opacity="0.4" />
            <rect x="0" y="-3" width="20" height="8" rx="1" fill={colors.shelfLight} opacity="0.25" />
            <ellipse cx="10" cy="-3" rx="10" ry="5" fill={colors.shelfLight} opacity="0.35" />
          </g>
        )}

        {/* Data flow lines for manager */}
        {variant === "manager" && (
          <g opacity="0.4">
            <path
              d="M170 20 Q180 30 170 40 Q160 50 170 60"
              stroke={colors.shelfLight}
              strokeWidth="1"
              fill="none"
              strokeDasharray="3 3"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="0;-30"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
          </g>
        )}

        {/* Floating particles */}
        <g opacity="0.3">
          <circle cx="40" cy="25" r="1.5" fill={colors.shelfLight}>
            <animate attributeName="cy" values="25;15;25" dur="5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="5s" repeatCount="indefinite" />
          </circle>
          <circle cx="110" cy="18" r="1" fill={colors.boxLight}>
            <animate attributeName="cy" values="18;10;18" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.2;0.6;0.2" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle cx="160" cy="22" r="1.5" fill={colors.boxLight}>
            <animate attributeName="cy" values="22;12;22" dur="6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.2;0.5;0.2" dur="6s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    </div>
  );
}
