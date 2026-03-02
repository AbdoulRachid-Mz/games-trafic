"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, Shield, Zap, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function PasskeyRecommendation({ onDismiss }: { onDismiss?: () => void }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSetupPasskey = async () => {
        setLoading(true);
        const { data, error } = await authClient.passkey.addPasskey({
            authenticatorAttachment: "platform",
        });

        if (error) {
            toast.error("Échec de la configuration : " + error.message);
        } else {
            toast.success("Passkey configurée avec succès !");
            router.push("/profile");
        }
        setLoading(false);
    };

    return (
        <Card className="border-primary">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <Key className="h-5 w-5 text-primary" />
                        <CardTitle>Sécurisez votre compte</CardTitle>
                    </div>
                    {onDismiss && (
                        <Button variant="ghost" size="icon" onClick={onDismiss}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <CardDescription>
                    Configurez une passkey pour une connexion plus rapide et sécurisée
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-3">
                    <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                            <p className="font-medium">Plus sécurisé</p>
                            <p className="text-sm text-muted-foreground">
                                Authentification biométrique résistante au phishing
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Zap className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                            <p className="font-medium">Plus rapide</p>
                            <p className="text-sm text-muted-foreground">
                                Connectez-vous en un seul geste
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={handleSetupPasskey}
                        disabled={loading}
                        className="flex-1"
                    >
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
    );
}