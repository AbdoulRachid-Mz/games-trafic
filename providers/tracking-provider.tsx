import { AutoTracker } from "@/components/tracking/auto-tracker";
import { TracingProvider } from "@/contexts/tracing-context";
import React from "react";

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
      <AutoTracker
        trackQueryParams={true}
        trackScrollDepth={false}
        trackClicks={false}
      />
      {children}
    </TracingProvider>
  );
};

export default TrackingProviders;
