"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

type Placement = "top" | "bottom" | "left" | "right" | "center";

interface Props {
  selector: string;
  placement?: Placement;
  title: string;
  content: string;
  onNext: () => void;
  onPrevious?: () => void;
  onSkip: () => void;
  hasPrevious: boolean;
  isLast: boolean;
}

export function StepTooltip({
  selector,
  placement = "bottom",
  title,
  content,
  onNext,
  onPrevious,
  onSkip,
  hasPrevious,
  isLast,
}: Props) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const targetRef = useRef<HTMLElement | null>(null);

  const computeRect = () => {
    const el = document.querySelector(selector) as HTMLElement | null;
    targetRef.current = el;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect(r);
  };

  useLayoutEffect(() => {
    setMounted(true);
    computeRect();
  }, [selector]);

  useEffect(() => {
    const onScroll = () => computeRect();
    const onResize = () => computeRect();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    const interval = setInterval(computeRect, 300);
    return () => {
      window.removeEventListener("scroll", onScroll as any);
      window.removeEventListener("resize", onResize as any);
      clearInterval(interval);
    };
  }, [selector]);

  const style = useMemo(() => {
    if (!rect) return { top: 0, left: 0 };
    const padding = 8;
    const tooltipWidth = Math.min(360, Math.max(260, Math.floor(window.innerWidth * 0.3)));
    let top = rect.bottom + padding;
    let left = rect.left;
    if (placement === "top") {
      top = Math.max(0, rect.top - padding);
      left = rect.left;
    } else if (placement === "left") {
      top = rect.top;
      left = Math.max(0, rect.left - tooltipWidth - padding);
    } else if (placement === "right") {
      top = rect.top;
      left = Math.min(window.innerWidth - tooltipWidth, rect.right + padding);
    } else if (placement === "center") {
      top = Math.max(20, rect.top + rect.height / 2 - 100);
      left = Math.max(20, rect.left + rect.width / 2 - tooltipWidth / 2);
    }
    left = Math.min(left, window.innerWidth - tooltipWidth - 12);
    left = Math.max(left, 12);
    return { top: Math.max(12, top + window.scrollY), left: left + window.scrollX, width: tooltipWidth };
  }, [rect, placement]);

  if (!mounted) return null;
  return createPortal(
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          zIndex: 60,
        }}
        onClick={onSkip}
      />
      {rect && (
        <div
          style={{
            position: "absolute",
            top: rect.top + window.scrollY - 6,
            left: rect.left + window.scrollX - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            borderRadius: 8,
            border: "2px solid rgba(59,130,246,0.9)",
            boxShadow: "0 0 0 20000px rgba(0,0,0,0.35)",
            pointerEvents: "none",
            zIndex: 61,
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          top: style.top as number,
          left: style.left as number,
          width: style.width as number,
          zIndex: 62,
        }}
        className="rounded-lg border bg-background shadow-lg p-4"
      >
        <div className="space-y-2">
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-sm text-muted-foreground">{content}</div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-3">
          {hasPrevious && onPrevious ? (
            <Button variant="outline" onClick={onPrevious}>
              Précédent
            </Button>
          ) : null}
          <Button variant="outline" onClick={onSkip}>
            Ignorer
          </Button>
          <Button onClick={onNext}>{isLast ? "Compris" : "Suivant"}</Button>
        </div>
      </div>
    </>,
    document.body
  );
}

