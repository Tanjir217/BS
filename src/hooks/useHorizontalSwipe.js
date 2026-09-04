import { useRef } from "react";

/**
 * Pointer-based swipe handling works for touch, pen, and mouse without
 * preventing vertical page scroll. Attach the returned handlers to a slider.
 */
function useHorizontalSwipe({ onSwipeLeft, onSwipeRight, threshold = 48 }) {
  const startPoint = useRef(null);

  const onPointerDown = (event) => {
    startPoint.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerUp = (event) => {
    if (!startPoint.current) return;

    const deltaX = event.clientX - startPoint.current.x;
    const deltaY = event.clientY - startPoint.current.y;
    startPoint.current = null;

    if (Math.abs(deltaX) < threshold || Math.abs(deltaX) < Math.abs(deltaY)) return;
    if (deltaX < 0) onSwipeLeft?.();
    else onSwipeRight?.();
  };

  const onPointerCancel = () => {
    startPoint.current = null;
  };

  return { onPointerDown, onPointerUp, onPointerCancel };
}

export default useHorizontalSwipe;
