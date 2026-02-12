// @/hooks/use-double-tap.ts
import { useRef, useCallback } from 'react';

export function useDoubleTap(callback: () => void, threshold = 300) {
// @/hooks/use-double-tap.ts
  const timer = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastTap = useRef<number>(0);

  return useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const timeSince = now - lastTap.current;

    if (timeSince < threshold && timeSince > 0) {
      callback();
      clearTimeout(timer.current);
      lastTap.current = 0;
    } else {
      lastTap.current = now;
      timer.current = setTimeout(() => {
        lastTap.current = 0;
      }, threshold);
    }
  }, [callback, threshold]);
}