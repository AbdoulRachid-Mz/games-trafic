import { AutoTracker } from "@/components/tracking/auto-tracker";
import { TracingProvider } from "@/contexts/tracing-context";
import React, { Suspense } from "react";

interface Props {
  children: React.ReactNode;
}

const TrackingProviders = ({ children }: Props) => {
  return (
    <TracingProvider
      options={{
        isActive: true, // Peut être piloté par une config ou env
        enabled: process.env.NODE_ENV === "production",
        showExplanations: true,
        redirectFirstTimeUsers: true,
      }}
    >
      <Suspense fallback={null}>
        <AutoTracker
          trackQueryParams={true}
          trackScrollDepth={false}
          trackClicks={false}
        />
      </Suspense>
      {children}
    </TracingProvider>
  );
};

export default TrackingProviders;
