// @/hooks/use-long-press.ts
import { useCallback, useRef, useState } from "react";

interface LongPressHandlers {
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
}

export function useLongPress(
  onStart: () => void,  // Appelé quand le long press commence
  onEnd: () => void,    // Appelé quand le long press se termine
  threshold = 500       // Durée en ms pour déclencher le long press
): LongPressHandlers {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPressing, setIsPressing] = useState(false);

  const start = useCallback(() => {
    setIsPressing(true);
    timerRef.current = setTimeout(() => {
      onStart();
    }, threshold);
  }, [onStart, threshold]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (isPressing) {
      onEnd();
    }
    setIsPressing(false);
  }, [onEnd, isPressing]);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
  };
}