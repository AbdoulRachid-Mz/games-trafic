import React from "react";
import { WelcomeView } from "./Welcome-view";

type Props = {};

export function WelcomeContainer() {
  return (
    <div className="overflow-hidden">
      <WelcomeView />
    </div>
  );
}
