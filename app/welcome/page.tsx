import { Suspense } from "react";
import { WelcomeContainer } from "@/components/welcome/Welcome-container";

function WelcomeFallback() {
  return (
    <div
      className="flex h-screen items-center justify-center overflow-hidden bg-background"
      aria-busy="true"
    >
      <div className="h-40 w-40 animate-pulse rounded-full bg-primary/10" />
    </div>
  );
}

const WelcomePage = () => {
  return (
    <Suspense fallback={<WelcomeFallback />}>
      <WelcomeContainer />
    </Suspense>
  );
};

export default WelcomePage;
