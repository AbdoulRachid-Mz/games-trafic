"use client"

import { useState, useEffect, useRef } from 'react'

export function useScreenSize() {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Use requestAnimationFrame for smoother resizing
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Tailwind breakpoints
  const isSmallScreen = screenSize.width < 640;     // sm
  const isMediumScreen = screenSize.width >= 640 && screenSize.width < 768;  // md
  const isLargeScreen = screenSize.width >= 768 && screenSize.width < 1024;  // lg
  const isXLargeScreen = screenSize.width >= 1024 && screenSize.width < 1280; // xl
  const is2XLargeScreen = screenSize.width >= 1280; // 2xl

  // Device detection
  const isMobile = screenSize.width < 768;
  const isTablet = screenSize.width >= 768 && screenSize.width < 1024;
  const isDesktop = screenSize.width >= 1024;

  // Orientation
  const isPortrait = screenSize.height > screenSize.width;
  const isLandscape = screenSize.width > screenSize.height;

  return {
    screenSize,
    
    // Breakpoints
    isSmallScreen,
    isMediumScreen, 
    isLargeScreen,
    isXLargeScreen,
    is2XLargeScreen,
    
    // Device types
    isMobile,
    isTablet,
    isDesktop,
    
    // Orientation
    isPortrait,
    isLandscape,
    
    // Helper functions
    isLargerThan: (size: number) => screenSize.width > size,
    isSmallerThan: (size: number) => screenSize.width < size,
    matchesBreakpoint: (breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl') => {
      switch (breakpoint) {
        case 'sm': return screenSize.width >= 640;
        case 'md': return screenSize.width >= 768;
        case 'lg': return screenSize.width >= 1024;
        case 'xl': return screenSize.width >= 1280;
        case '2xl': return screenSize.width >= 1536;
        default: return false;
      }
    }
  };
}

export function useParentSize(threshold: number) {
  const [isSmaller, setIsSmaller] = useState(false)
  const parentRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!parentRef.current) return

    const handleResize = (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        setIsSmaller(width < threshold)
      }
    }

    const observer = new ResizeObserver(handleResize)
    observer.observe(parentRef.current)

    return () => {
      observer.disconnect()
    }
  }, [threshold])

  return { isSmaller, parentRef }
}