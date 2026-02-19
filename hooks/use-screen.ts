"use client"

import { useState, useEffect, useRef } from 'react'

export function useScreenSize() {
  // Start with null to avoid hydration mismatch
  const [screenSize, setScreenSize] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    const update = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Safe fallback to 0x0 when SSR/hydrating
  const { width = 0, height = 0 } = screenSize ?? {}

  // Tailwind breakpoints (aligned with v3 defaults)
  const isSmallScreen = width < 640
  const isMediumScreen = width >= 640 && width < 768
  const isLargeScreen = width >= 768 && width < 1024
  const isXLargeScreen = width >= 1024 && width < 1280
  const is2XLargeScreen = width >= 1280 && width < 1536
  const is3XLargeScreen = width >= 1536

  // Device detection
  const isMobile = width < 768
  const isTablet = width >= 768 && width < 1024
  const isDesktop = width >= 1024

  // Orientation
  const isPortrait = height > width
  const isLandscape = width > height

  return {
    screenSize: { width, height },
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isXLargeScreen,
    is2XLargeScreen,
    is3XLargeScreen,
    isMobile,
    isTablet,
    isDesktop,
    isPortrait,
    isLandscape,
    isLargerThan: (size: number) => width > size,
    isSmallerThan: (size: number) => width < size,
    matchesBreakpoint: (breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl') => {
      switch (breakpoint) {
        case 'sm': return width >= 640
        case 'md': return width >= 768
        case 'lg': return width >= 1024
        case 'xl': return width >= 1280
        case '2xl': return width >= 1536
        case '3xl': return width >= 1920
        default: return false
      }
    },
  }
}

export function useParentSize(threshold: number) {
  const [isSmaller, setIsSmaller] = useState(false)
  const parentRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = parentRef.current
    if (!element) return

    // Guard for environments without ResizeObserver
    if (typeof ResizeObserver === 'undefined') return

    let rafId: number | null = null

    const handleResize = (entries: ResizeObserverEntry[]) => {
      // Throttle with requestAnimationFrame
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        for (const entry of entries) {
          const width = entry.contentRect.width
          setIsSmaller(width < threshold)
        }
      })
    }

    const observer = new ResizeObserver(handleResize)
    observer.observe(element)

    return () => {
      observer.disconnect()
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [threshold])

  return { isSmaller, parentRef }
}