"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Key, Shield, Zap, X, Fingerprint } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export function PasskeyRecommendation({ onDismiss }: { onDismiss?: () => void }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSetupPasskey = async () => {
    setLoading(true);
    const { error } = await authClient.passkey.addPasskey({
      authenticatorAttachment: "platform",
    });

    if (error) {
      toast.error("Échec de la configuration de la passkey");
    } else {
      toast.success("Passkey configurée avec succès !");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-purple-600/5">
        <div className="absolute inset-0 bg-grid-primary/10 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
        
        <CardContent className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Fingerprint className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Sécurisez votre compte</h3>
                <p className="text-sm text-muted-foreground">
                  Ajoutez une passkey pour une connexion plus rapide et sécurisée
                </p>
              </div>
            </div>
            {onDismiss && (
              <Button variant="ghost" size="icon" onClick={onDismiss} className="shrink-0">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <div className="flex items-start gap-2 p-3 bg-background/50 rounded-lg">
              <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Plus sécurisé</p>
                <p className="text-xs text-muted-foreground">
                  Résistant au phishing
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-background/50 rounded-lg">
              <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Plus rapide</p>
                <p className="text-xs text-muted-foreground">
                  Connexion en un geste
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSetupPasskey}
              disabled={loading}
              className="flex-1 gap-2"
            >
              <Key className="h-4 w-4" />
              {loading ? "Configuration..." : "Configurer maintenant"}
            </Button>
            {onDismiss && (
              <Button variant="outline" onClick={onDismiss}>
                Plus tard
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}