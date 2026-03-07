"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Eye, Lock, User, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { AutoSyncField } from "@/components/shared/auto-sync-field";
import { setProductCredentials, updateProduct } from "@/actions/products";
import { toast } from "sonner";

interface ProductSettingsFormProps {
  product: any;
  decryptedPassword?: string;
}

export function ProductSettingsForm({ product, decryptedPassword = "" }: ProductSettingsFormProps) {
  const [currentLogin, setCurrentLogin] = useState(product.accountLogin || "");
  const [currentPassword, setCurrentPassword] = useState(decryptedPassword);
  const [isVisible, setIsVisible] = useState(product.isVisible);

  const handleUpdateCredentials = async (login: string, pass: string) => {
    try {
      await setProductCredentials(product.id, login, pass);
      toast.success("Identifiants mis à jour");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
      throw error;
    }
  };

  const handleUpdateVisibility = async (visible: boolean) => {
    try {
      await updateProduct(product.id, { isVisible: visible });
      setIsVisible(visible);
      toast.success("Visibilité mise à jour");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/30 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
        <CardHeader>
          <CardTitle className="font-bold italic uppercase tracking-tighter flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Accès au compte
          </CardTitle>
          <CardDescription>
            Ces informations sont chiffrées et seront transmises à l'acheteur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <AutoSyncField
              label="Nom d'utilisateur / Email"
              value={currentLogin}
              onChange={async (val) => {
                await handleUpdateCredentials(val, currentPassword);
                setCurrentLogin(val);
              }}
              placeholder="Ex: player@gmail.com"
              className="bg-muted/10 p-4 rounded-3xl border border-border/50"
            />
            <AutoSyncField
              label="Mot de passe"
              value={currentPassword}
              onChange={async (val) => {
                await handleUpdateCredentials(currentLogin, val);
                setCurrentPassword(val);
              }}
              placeholder="••••••••"
              type="input"
              className="bg-muted/10 p-4 rounded-3xl border border-border/50"
              renderInput={({ value, onChange, disabled, placeholder }) => (
                <div className="relative">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    placeholder={placeholder}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm"
                  />
                </div>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/30 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
        <CardHeader>
          <CardTitle className="font-bold italic uppercase tracking-tighter flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Visibilité
          </CardTitle>
          <CardDescription>
            Contrôlez si votre produit est visible sur la marketplace.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/10 rounded-3xl border border-border/50">
                <div>
                    <Typography variant="body-base" weight="semibold">
                        Produit Public
                    </Typography>
                    <Typography variant="caption1" theme="muted">
                        Si désactivé, seuls ceux ayant le lien direct pourront voir le produit.
                    </Typography>
                </div>
                <Button 
                    variant={isVisible ? "default" : "outline"}
                    onClick={() => handleUpdateVisibility(!isVisible)}
                    className="rounded-xl"
                >
                    {isVisible ? "Visible" : "Masqué"}
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
