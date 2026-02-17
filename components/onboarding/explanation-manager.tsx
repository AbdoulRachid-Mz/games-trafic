"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useJourneyRecommendations } from "@/hooks/use-journey-recommendations";
import { useExplanationTracking, useTracingContext } from "@/contexts/tracing-context";
import { PAGE_EXPLANATIONS } from "@/config/page-explanations";
import type { PageExplanation } from "@/types/explanation";
import { ExplanationRenderer } from "./explanation-renderer";

type EngineState = "idle" | "showing";

function matchExplanationForPath(pathname: string): PageExplanation | null {
  const e = PAGE_EXPLANATIONS.find((e) => {
    if (e.page === pathname) return true;
    if (e.page.includes("[") || e.page.includes("*")) {
      const pattern = e.page.replace(/\[[^\]]+\]/g, "[^/]+").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*");
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(pathname);
    }
    return false;
  });
  return e || null;
}

export function ExplanationManager() {
  const pathname = usePathname();
  const router = useRouter();
  const { config } = useTracingContext();
  const { shouldShowExplanation, completeExplanation, skipExplanation, showExplanation } = useExplanationTracking();
  const { topRecommendation, analysis, refresh } = useJourneyRecommendations({ minIntervalMs: 20000 });

  const [state, setState] = useState<EngineState>("idle");
  const [current, setCurrent] = useState<PageExplanation | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const disabledAll =
    typeof window !== "undefined" &&
    (localStorage.getItem("gt_explanations_disabled") === "true" ||
      config.showExplanations === false ||
      !config.enabled ||
      !config.isActive);

  const fallbackExplanation = useMemo(() => {
    return matchExplanationForPath(pathname);
  }, [pathname]);

  const selectCandidate = useCallback((): PageExplanation | null => {
    if (disabledAll) return null;
    if (topRecommendation) {
      if (topRecommendation.type === "REDIRECT" && config.redirectFirstTimeUsers) {
        if (topRecommendation.page && pathname !== topRecommendation.page) {
          router.push(topRecommendation.page);
          return null;
        }
      }
      if (topRecommendation.page && topRecommendation.page === pathname) {
        const base = fallbackExplanation;
        if (base) {
          return base;
        }
        return {
          page: topRecommendation.page,
          title: "Guide",
          description: topRecommendation.message || "",
          steps: [
            {
              id: "step-1",
              title: "Information",
              content: topRecommendation.message || "",
              position: { placement: "center" },
            },
          ],
          required: false,
          version: 1,
        };
      }
    }
    if (fallbackExplanation) {
      return fallbackExplanation;
    }
    return null;
  }, [topRecommendation, fallbackExplanation, pathname, router, config.redirectFirstTimeUsers, disabledAll]);

  useEffect(() => {
    if (!config.showExplanations || disabledAll) return;
    const candidate = selectCandidate();
    if (!candidate) {
      setCurrent(null);
      setOpen(false);
      setState("idle");
      return;
    }
    const key = `${candidate.page}@v${candidate.version}`;
    const canShow = shouldShowExplanation(key);
    if (!canShow) {
      setCurrent(null);
      setOpen(false);
      setState("idle");
      return;
    }
    setCurrent(candidate);
    setStepIndex(0);
    setOpen(true);
    setState("showing");
    showExplanation(key);
  }, [pathname, analysis, selectCandidate, shouldShowExplanation, showExplanation, config.showExplanations, disabledAll]);

  const onNext = useCallback(() => {
    if (!current) return;
    const last = stepIndex >= current.steps.length - 1;
    if (last) {
      onComplete();
    } else {
      setStepIndex((s) => s + 1);
    }
  }, [current, stepIndex]);

  const onPrevious = useCallback(() => {
    if (stepIndex > 0) setStepIndex((s) => s - 1);
  }, [stepIndex]);

  const onComplete = useCallback(() => {
    if (!current) return;
    const key = `${current.page}@v${current.version}`;
    completeExplanation(key);
    setOpen(false);
    setCurrent(null);
    setState("idle");
  }, [current, completeExplanation]);

  const onSkip = useCallback(() => {
    if (!current) return;
    const key = `${current.page}@v${current.version}`;
    skipExplanation(key);
    setOpen(false);
    setCurrent(null);
    setState("idle");
  }, [current, skipExplanation]);

  const onClose = useCallback(() => {
    if (current) {
      const key = `${current.page}@v${current.version}`;
      skipExplanation(key);
    }
    setOpen(false);
    setState("idle");
  }, [current, skipExplanation]);

  if (!current || state !== "showing" || !open) return null;
  return (
    <ExplanationRenderer
      explanation={current}
      open={open}
      stepIndex={stepIndex}
      onNext={onNext}
      onPrevious={onPrevious}
      onComplete={onComplete}
      onSkip={onSkip}
      onClose={onClose}
    />
  );
}
