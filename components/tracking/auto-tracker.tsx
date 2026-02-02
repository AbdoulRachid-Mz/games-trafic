// components/tracking/auto-tracker.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTracingContext } from "@/contexts/tracing-context";

interface AutoTrackerProps {
  trackQueryParams?: boolean;
  trackScrollDepth?: boolean;
  scrollDepthThresholds?: number[];
  trackClicks?: boolean;
  clickSelectors?: string[];
}

export function AutoTracker({
  trackQueryParams = false,
  trackScrollDepth = false,
  scrollDepthThresholds = [50, 100],
  trackClicks = false,
  clickSelectors = ["[data-track-click]"],
}: AutoTrackerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { trackPageView, trackAction } = useTracingContext();

  // Tracking automatique des pages
  useEffect(() => {
    if (!pathname) return;

    const metadata: Record<string, any> = {};

    if (trackQueryParams && searchParams) {
      const params: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
      metadata.queryParams = params;
    }

    trackPageView(pathname, metadata);
  }, [pathname, searchParams, trackPageView, trackQueryParams]);

  // Tracking du défilement
  useEffect(() => {
    if (!trackScrollDepth) return;

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollTop =
        document.documentElement.scrollTop || document.body.scrollTop;
      const scrollPercentage = Math.round(
        (scrollTop / (scrollHeight - clientHeight)) * 100
      );

      if (scrollDepthThresholds.includes(scrollPercentage)) {
        trackAction("VIEW", "SCROLL_DEPTH", {
          percentage: scrollPercentage,
          page: pathname,
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [trackScrollDepth, scrollDepthThresholds, pathname, trackAction]);

  // Tracking des clics
  useEffect(() => {
    if (!trackClicks) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Vérifier si l'élément correspond aux sélecteurs
      const matchesSelector = clickSelectors.some(
        (selector) => target.matches?.(selector) || target.closest?.(selector)
      );

      if (matchesSelector) {
        const element = target.closest?.(clickSelectors.join(",")) || target;
        const text = element.textContent?.trim() || "";
        const id = element.id || element.getAttribute("data-id") || "";

        trackAction("VIEW", "CLICK", {
          element: {
            tagName: element.tagName,
            id,
            className: element.className,
            text: text.substring(0, 100),
          },
          page: pathname,
          coordinates: {
            x: event.clientX,
            y: event.clientY,
          },
        });
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [trackClicks, clickSelectors, pathname, trackAction]);

  // Tracking du temps sur la page
  useEffect(() => {
    if (!pathname) return;

    const startTime = Date.now();

    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (duration > 1000) {
        // Ne pas tracker les visites trop courtes
        trackAction("VIEW", "PAGE_DURATION", {
          page: pathname,
          duration,
          isExit: true,
        });
      }
    };
  }, [pathname, trackAction]);

  return null; // Ce composant ne rend rien
}
