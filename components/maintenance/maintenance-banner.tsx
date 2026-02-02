"use client";

import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/app-context";
import { toast } from "sonner";

interface MaintenanceBannerProps {
  message?: string;
  isAdmin?: boolean;
}

export function MaintenanceBanner({ message, isAdmin = false }: MaintenanceBannerProps) {
  const { setMaintenanceMode } = useApp();
  const [isVisible, setIsVisible] = React.useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleDisableMaintenance = async () => {
    if (isAdmin) {
      try {
        await setMaintenanceMode(false, "Maintenance désactivée par l'administrateur");
        toast.success("Mode maintenance désactivé");
      } catch (error) {
        console.error("Error disabling maintenance mode:", error);
        toast.error("Erreur lors de la désactivation du mode maintenance");
      }
    }
  };

  if (!isVisible) return null;

  return (
    <Alert variant="destructive" className="sticky top-0 z-50 rounded-none border-x-0 border-t-0">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <AlertTitle className="font-semibold">Mode Maintenance Activé</AlertTitle>
            <AlertDescription>
              {message || "Le système est actuellement en maintenance. Certaines fonctionnalités peuvent être temporairement indisponibles."}
            </AlertDescription>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDisableMaintenance}
              className="text-xs hover:bg-destructive hover:text-destructive-foreground"
            >
              Désactiver
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-8 w-8 hover:bg-destructive/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
}