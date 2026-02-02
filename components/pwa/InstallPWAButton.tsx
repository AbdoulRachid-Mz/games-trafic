"use client";

import { Button } from "@/components/ui/button"; // shadcn
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Download } from "lucide-react";

export default function InstallPWAButton() {
  const { isInstallable, install } = usePWAInstall();

  if (!isInstallable) return null; // cache le bouton si non dispo

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={install}
        className="rounded-2xl shadow-lg px-4 py-2 flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Installer l’app
      </Button>
    </div>
  );
}
