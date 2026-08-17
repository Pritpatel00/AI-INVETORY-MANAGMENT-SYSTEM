import { useEffect, useRef, useState } from "react";

export interface VoicePosition {
  x: number;
  y: number;
}

export function useVoicePosition() {
  const [position, setPosition] = useState<VoicePosition | null>(() => {
    const saved = window.localStorage.getItem("inventory_worker_voice_position");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as VoicePosition;
        if (Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) {
          return { x: Math.min(Math.max(12, parsed.x), Math.max(12, window.innerWidth - 76)), y: Math.min(Math.max(88, parsed.y), Math.max(88, window.innerHeight - 82)) };
        }
      } catch {
        window.localStorage.removeItem("inventory_worker_voice_position");
      }
    }
    return null;
  });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  function clampPosition(x: number, y: number) {
    return {
      x: Math.min(Math.max(12, x), Math.max(12, window.innerWidth - 76)),
      y: Math.min(Math.max(88, y), Math.max(88, window.innerHeight - 82)),
    };
  }

  useEffect(() => {
    const keepOnScreen = () =>
      setPosition((current) => (current ? clampPosition(current.x, current.y) : current));
    window.addEventListener("resize", keepOnScreen);
    return () => window.removeEventListener("resize", keepOnScreen);
  }, []);

  function beginDrag(x: number, y: number, pointerId: number, bounds: DOMRect) {
    drag.current = {
      pointerId,
      startX: x,
      startY: y,
      originX: bounds.left,
      originY: bounds.top,
      moved: false,
    };
    setPosition({ x: bounds.left, y: bounds.top });
    setDragging(true);
  }

  function moveDrag(x: number, y: number, pointerId: number) {
    if (!drag.current || drag.current.pointerId !== pointerId) return;
    const deltaX = x - drag.current.startX;
    const deltaY = y - drag.current.startY;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 5) drag.current.moved = true;
    setPosition(clampPosition(drag.current.originX + deltaX, drag.current.originY + deltaY));
  }

  function finishDrag(pointerId: number) {
    if (!drag.current || drag.current.pointerId !== pointerId) return { wasMoved: false };
    const wasMoved = drag.current.moved;
    drag.current = null;
    setDragging(false);
    setPosition((current) => {
      if (current) window.localStorage.setItem("inventory_worker_voice_position", JSON.stringify(current));
      return current;
    });
    return { wasMoved };
  }

  function cancelDrag() {
    drag.current = null;
    setDragging(false);
  }

  return { position, dragging, beginDrag, moveDrag, finishDrag, cancelDrag, clampPosition, setPosition };
}