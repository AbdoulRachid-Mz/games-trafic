"use client";

import React, { useState } from "react";
import { VipPricing } from "./vip-pricing";
import { VipAssistant } from "./vip-assistant";

interface VipPageContentProps {
  prices: {
    monthly: number;
    yearly: number;
    lifetime: number;
  };
}

export function VipPageContent({ prices }: VipPageContentProps) {
  const [recommendedPlan, setRecommendedPlan] = useState<string | null>(null);

  return (
    <>
      <VipPricing prices={prices} highlightedPlan={recommendedPlan} />
      <VipAssistant onRecommendation={setRecommendedPlan} />
    </>
  );
}
