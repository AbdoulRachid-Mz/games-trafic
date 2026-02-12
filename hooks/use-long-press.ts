// @/hooks/use-long-press.ts
import { useRef, useCallback } from 'react';

export function useLongPress(callback: () => void, threshold = 500) {
  const timer = useRef<NodeJS.Timeout | undefined>(undefined);
  const isLongPress = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    isLongPress.current = false;
    timer.current = setTimeout(() => {
      isLongPress.current = true;
      callback();
    }, threshold);
  }, [callback, threshold]);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    clearTimeout(timer.current);
  }, []);

  const onMouseLeave = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    clearTimeout(timer.current);
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    isLongPress.current = false;
    timer.current = setTimeout(() => {
      isLongPress.current = true;
      callback();
    }, threshold);
  }, [callback, threshold]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    clearTimeout(timer.current);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    clearTimeout(timer.current);
  }, []);

  return {
    onMouseDown,
    onMouseUp,
    onMouseLeave,
    onTouchStart,
    onTouchEnd,
    onTouchMove,
  };
}