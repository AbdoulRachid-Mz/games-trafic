// app/maintenance/page.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { useApp } from "@/contexts/app-context";
import { useAuthContext } from "@/contexts/auth-context";

export default function MaintenancePage() {
  const router = useRouter();
  const { maintenanceMode, maintenanceMessage } = useApp();
  const { isAuthenticated, isAdmin } = useAuthContext();

  // Si le mode maintenance est désactivé, rediriger vers l'accueil
  React.useEffect(() => {
    if (!maintenanceMode) {
      router.push("/");
    }
  }, [maintenanceMode, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Maintenance en cours</CardTitle>
          <CardDescription className="text-lg">
            Nous améliorons votre expérience
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-600">
            {maintenanceMessage || "Le système est actuellement en maintenance. Nous travaillons pour améliorer votre expérience."}
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
            <p className="font-semibold mb-1">Informations importantes :</p>
            <ul className="list-disc list-inside space-y-1 text-left">
              <li>Les transactions sont temporairement suspendues</li>
              <li>Les tournois en cours sont préservés</li>
              <li>Vos données sont sécurisées</li>
              <li>Temps estimé : 1-2 heures</li>
            </ul>
          </div>

          {isAdmin && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-semibold">Vous êtes administrateur</p>
              <p>Vous avez accès à certaines fonctionnalités administratives pendant la maintenance.</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button 
            onClick={() => router.push("/")}
            className="w-full"
            variant="default"
          >
            <Home className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Button>
          
          <Button 
            onClick={() => window.location.reload()}
            className="w-full"
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser la page
          </Button>

          <div className="text-xs text-gray-500 text-center mt-4">
            <p>Contact support : support@games-trafics.com</p>
            <p className="mt-1">Heure de maintenance : {new Date().toLocaleTimeString()}</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}