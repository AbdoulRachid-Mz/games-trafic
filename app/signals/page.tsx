"use client";

import React, { useState } from "react";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bug, Send,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SignalType } from "@/types/api";
import { useCreateSignal } from "@/hooks/use-signals";
import { useAuthContext } from "@/contexts/auth-context";

export default function SignalsPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetType: "BUG",
    severity: "MEDIUM",
  });

  const { user } = useAuthContext();


  const createSignalMutation = useCreateSignal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate title length on client side before sending
      if (!formData.title || formData.title.length < 5) {
        toast.error("Le titre doit contenir au moins 5 caractères");
        setLoading(false);
        return;
      }

      // Get userId from session or auth context - this is a placeholder
      // In a real app, you'd get this from your auth provider
      const userId = user?.id || "anonymous"; // TODO: Replace with actual user ID from auth

      await createSignalMutation.mutateAsync({
        userId,
        title: formData.title,
        description: formData.description,
        targetType: formData.targetType as SignalType,
        type: formData.targetType as SignalType,
        metadata: {
          userAgent: navigator.userAgent,
          url: window.location.href,
        }
      });

      setSuccess(true);
      toast.success("Signalement envoyé avec succès !");
      setFormData({ title: "", description: "", targetType: "BUG", severity: "MEDIUM" });
    } catch (error: any) {
      // Handle specific error messages from the server
      if (error.message === "Titre invalide") {
        toast.error("Le titre doit contenir au moins 5 caractères");
      } else if (error.message === "Trop de signalements, réessayez plus tard") {
        toast.error("Trop de signalements, réessayez plus tard");
      } else {
        toast.error("Erreur lors de l'envoi");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      <div className="space-y-4">
        <Typography variant="h1" className="text-4xl font-black">Signaler un Bug ou Erreur</Typography>
        <Typography variant="body-lg" theme="muted">
          Aidez-nous à améliorer Games-Trafics. Signalez toute anomalie, bug technique ou suggestion d'amélioration.
        </Typography>
      </div>

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center text-center p-12 bg-primary/5 rounded-[2.5rem] border border-primary/20 space-y-6"
          >
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <Typography variant="h3" className="font-bold">Merci pour votre retour !</Typography>
              <Typography variant="body-base" theme="muted">
                Votre signalement a été transmis à notre équipe technique. Nous reviendrons vers vous si nécessaire.
              </Typography>
            </div>
            <Button 
              variant="outline" 
              className="rounded-xl h-12 px-8 font-bold"
              onClick={() => setSuccess(false)}
            >
              Faire un autre signalement
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl overflow-hidden rounded-[2rem]">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b border-border/50 p-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center shadow-lg border border-border/50">
                    <Bug className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">Nouveau Signalement</CardTitle>
                    <CardDescription>Décrivez le problème avec le plus de précision possible.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="targetType">Type de signalement</Label>
                      <Select 
                        value={formData.targetType} 
                        onValueChange={(v) => setFormData(prev => ({ ...prev, targetType: v }))}
                      >
                        <SelectTrigger className="h-12 rounded-xl bg-background/50 border-border/50">
                          <SelectValue placeholder="Sélectionnez un type" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/50 backdrop-blur-xl">
                          <SelectItem value="BUG">Bug Technique</SelectItem>
                          <SelectItem value="ERROR">Message d'erreur</SelectItem>
                          <SelectItem value="UI">Problème d'interface</SelectItem>
                          <SelectItem value="SUGGESTION">Suggestion / Idée</SelectItem>
                          <SelectItem value="OTHER">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="severity">Sévérité</Label>
                      <Select 
                        value={formData.severity} 
                        onValueChange={(v) => setFormData(prev => ({ ...prev, severity: v }))}
                      >
                        <SelectTrigger className="h-12 rounded-xl bg-background/50 border-border/50">
                          <SelectValue placeholder="Sévérité" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/50 backdrop-blur-xl">
                          <SelectItem value="LOW">Basse - Mineur</SelectItem>
                          <SelectItem value="MEDIUM">Moyenne - Gênant</SelectItem>
                          <SelectItem value="HIGH">Haute - Bloquant</SelectItem>
                          <SelectItem value="CRITICAL">Critique - Urgence</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Titre du problème</Label>
                    <Input 
                      id="title"
                      placeholder="Ex: Le bouton de paiement ne répond pas"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                      className="h-12 rounded-xl bg-background/50 border-border/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description détaillée</Label>
                    <Textarea 
                      id="description"
                      placeholder="Décrivez les étapes pour reproduire le bug..."
                      className="min-h-[150px] rounded-xl bg-background/50 border-border/50 resize-none p-4"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-4">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <Typography variant="body-sm" className="text-amber-700/80">
                      Les informations de votre navigateur et la page actuelle seront automatiquement incluses 
                      pour nous aider à diagnostiquer le problème.
                    </Typography>
                  </div>

                  <div className="flex items-center justify-end gap-4 pt-4">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="h-12 px-6 rounded-xl font-bold"
                    >
                      Annuler
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="h-12 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 gap-2"
                    >
                      {loading ? "Envoi en cours..." : "Envoyer le signalement"}
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
