"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Wifi, WifiOff, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  useEffect(() => {
    // Vérifier la connexion
    setIsOnline(navigator.onLine);
    setLastUpdate(new Date().toLocaleTimeString());

    const handleOnline = () => {
      setIsOnline(true);
      setLastUpdate(new Date().toLocaleTimeString());
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setLastUpdate(new Date().toLocaleTimeString());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Status Card */}
        <Card className="mb-6 backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-4 rounded-full bg-gray-100 dark:bg-gray-700 w-fit">
              {isOnline ? (
                <Wifi className="h-8 w-8 text-green-500" />
              ) : (
                <WifiOff className="h-8 w-8 text-red-500" />
              )}
            </div>
            
            <CardTitle className="text-xl font-bold">
              {isOnline ? "Connexion rétablie !" : "Vous êtes hors connexion"}
            </CardTitle>
            
            <CardDescription>
              {isOnline 
                ? "Votre connexion internet est maintenant active"
                : "Vérifiez votre connexion internet pour continuer"
              }
            </CardDescription>

            <Badge 
              variant={isOnline ? "default" : "destructive"} 
              className="w-fit mx-auto mt-2"
            >
              {isOnline ? "En ligne" : "Hors ligne"}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Informations sur le cache */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                📦 Certains contenus sont disponibles en mode hors ligne
              </p>
              
              <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p>⏰ Dernière vérification : {lastUpdate}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                onClick={handleRetry}
                className="w-full gap-2"
                disabled={!isOnline}
              >
                <RefreshCw className="h-4 w-4" />
                {isOnline ? "Recharger la page" : "Réessayer"}
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/" className="gap-2">
                    <Home className="h-4 w-4" />
                    Accueil
                  </Link>
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.history.back()}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </Button>
              </div>
            </div>

            {/* Conseils */}
            <div className="border-t pt-4 space-y-2">
              <h3 className="font-semibold text-sm">💡 Conseils :</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Vérifiez votre connexion WiFi ou données mobiles</li>
                <li>• Redémarrez votre routeur si nécessaire</li>
                <li>• Certaines pages restent accessibles hors ligne</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <div className="text-center">
          <h2 className="text-lg font-bold text-primary mb-2">Games Trafics</h2>
          <p className="text-sm text-muted-foreground">
            Marketplace & Tournois Gaming 🎮
          </p>
        </div>
      </div>
    </div>
  );
}