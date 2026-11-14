"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bug, 
  Send,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  Monitor,
  Flame,
  Layout,
  HelpCircle,
  ArrowLeft,
  FileCheck2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SignalType } from "@/types/api";
import { useCreateSignal } from "@/hooks/use-signals";
import { useAuthContext } from "@/contexts/auth-context";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SIGNAL_TYPES: {
  type: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge: string;
}[] = [
  {
    type: "BUG",
    label: "Bug Technique",
    desc: "Dysfonctionnement d'un bouton, d'une action ou d'un flux",
    icon: Bug,
    color: "text-rose-500 bg-rose-500/10 border-rose-500/30",
    badge: "Dysfonctionnement",
  },
  {
    type: "ERROR",
    label: "Message d'Erreur",
    desc: "Erreur serveur, pop-up d'erreur inattendue ou écran rouge",
    icon: AlertTriangle,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
    badge: "Erreur Système",
  },
  {
    type: "UI",
    label: "Problème d'Affichage",
    desc: "Chevauchement, texte coupé, glitch visuel ou responsive mobile",
    icon: Layout,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/30",
    badge: "Interface & Design",
  },
  {
    type: "SUGGESTION",
    label: "Idée & Suggestion",
    desc: "Recommandation d'amélioration ou fonctionnalité souhaitée",
    icon: Sparkles,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
    badge: "Évolution",
  },
  {
    type: "OTHER",
    label: "Autre Anomalie",
    desc: "Toute autre observation nécessitant l'intervention de l'équipe",
    icon: HelpCircle,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/30",
    badge: "Général",
  },
];

const SEVERITIES: {
  level: string;
  label: string;
  desc: string;
  color: string;
  activeClass: string;
}[] = [
  {
    level: "LOW",
    label: "Faible",
    desc: "Gêne mineure, contournable sans impact",
    color: "text-emerald-500",
    activeClass: "bg-emerald-500/15 border-emerald-500 text-emerald-500 font-bold",
  },
  {
    level: "MEDIUM",
    label: "Moyenne",
    desc: "Comportement anormal mais non bloquant",
    color: "text-blue-500",
    activeClass: "bg-blue-500/15 border-blue-500 text-blue-500 font-bold",
  },
  {
    level: "HIGH",
    label: "Élevée",
    desc: "Fonctionnalité clé indisponible",
    color: "text-amber-500",
    activeClass: "bg-amber-500/15 border-amber-500 text-amber-500 font-bold",
  },
  {
    level: "CRITICAL",
    label: "Critique",
    desc: "Blocage total ou transaction bloquée",
    color: "text-rose-500",
    activeClass: "bg-rose-500/15 border-rose-500 text-rose-500 font-bold",
  },
];

export default function SignalsPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketId, setTicketId] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetType: "BUG",
    severity: "MEDIUM",
  });

  const [systemMetadata] = useState<{
    browser: string;
    screen: string;
    currentUrl: string;
  }>(() => {
    if (typeof window !== "undefined") {
      return {
        browser: navigator.userAgent.split(" ").slice(-2).join(" ") || navigator.userAgent,
        screen: `${window.innerWidth}x${window.innerHeight} (${window.devicePixelRatio}x)`,
        currentUrl: window.location.href,
      };
    }
    return {
      browser: "Navigateur standard",
      screen: "Détection client",
      currentUrl: "",
    };
  });

  const { user } = useAuthContext();
  const createSignalMutation = useCreateSignal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.title || formData.title.trim().length < 5) {
        toast.error("Le titre doit contenir au moins 5 caractères explicites");
        setLoading(false);
        return;
      }

      if (!formData.description || formData.description.trim().length < 10) {
        toast.error("Veuillez fournir une description d'au moins 10 caractères pour nous aider");
        setLoading(false);
        return;
      }

      const userId = user?.id || "anonymous";

      const result = await createSignalMutation.mutateAsync({
        userId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        targetType: formData.targetType as SignalType,
        type: formData.targetType as SignalType,
        metadata: {
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Client Web",
          url: typeof window !== "undefined" ? window.location.href : "",
          severity: formData.severity,
          screenResolution: systemMetadata.screen,
          timestamp: new Date().toISOString(),
        },
      });

      const responseObj = result as { id?: string } | undefined;
      const generatedId = responseObj?.id || `SIG-${Math.floor(100000 + Math.random() * 900000)}`;
      setTicketId(generatedId);
      setSuccess(true);
      toast.success("Signalement transmis avec succès aux équipes techniques !");
      setFormData({ title: "", description: "", targetType: "BUG", severity: "MEDIUM" });
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message === "Titre invalide") {
        toast.error("Le titre doit contenir au moins 5 caractères");
      } else if (error.message?.includes("Trop de signalements")) {
        toast.error("Limite temporaire atteinte : veuillez patienter quelques minutes avant un nouvel envoi");
      } else {
        toast.error(error.message || "Erreur lors de l'envoi du signalement");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 md:py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation retour rapide */}
        <div className="flex items-center justify-between">
          <Link
            href="/docs"
            className="group inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Retour à la documentation</span>
          </Link>
          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 border-primary/30 text-primary bg-primary/5">
            Centre Qualité GT
          </Badge>
        </div>

        {/* Hero Section Pro */}
        <section className="relative rounded-[2.5rem] bg-gradient-to-br from-card/90 via-card/50 to-card/20 border border-border/60 p-6 sm:p-10 overflow-hidden shadow-2xl text-start">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-black uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Rapport d'Anomalie & Amélioration</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground leading-tight">
              Signaler un Bug ou <br />
              <span className="bg-gradient-to-r from-primary via-purple-400 to-rose-400 bg-clip-text text-transparent italic">
                une Défaillance
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-normal">
              Aidez-nous à garantir l'excellence technique de Games-Trafics. Chaque rapport est directement transmis aux ingénieurs et arbitres de la plateforme pour diagnostic et correction prioritaire.
            </p>
          </div>
        </section>

        {/* Contenu Formulaire ou Succès */}
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-card/60 backdrop-blur-xl rounded-[2.5rem] border border-primary/30 shadow-2xl space-y-6"
            >
              <div className="w-20 h-20 bg-primary/15 border border-primary/30 rounded-3xl flex items-center justify-center shadow-lg shadow-primary/20">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>

              <div className="space-y-2 max-w-md">
                <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  Signalement Enregistré
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
                  Merci pour votre contribution !
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-normal">
                  Votre signalement a été attribué avec la référence technique suivante :
                </p>
                <div className="py-2">
                  <span className="font-mono text-sm font-black px-4 py-2 rounded-xl bg-muted border border-border/80 text-primary inline-block">
                    {ticketId}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Nos développeurs examineront les logs et les détails fournis dans les plus brefs délais.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="rounded-xl h-11 px-6 font-bold text-xs uppercase tracking-wider border-border/60"
                  onClick={() => setSuccess(false)}
                >
                  Déposer un autre signalement
                </Button>
                <Button 
                  asChild
                  className="rounded-xl h-11 px-6 font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/25"
                >
                  <Link href="/docs">Consulter la documentation</Link>
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-card/50 backdrop-blur-xl border-border/60 shadow-2xl overflow-hidden rounded-[2.5rem]">
                <CardHeader className="bg-muted/20 border-b border-border/40 p-6 sm:p-8 text-start space-y-1">
                  <CardTitle className="text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-2.5">
                    <FileCheck2 className="h-5 w-5 text-primary" />
                    <span>Détails du Signalement</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Remplissez les informations ci-dessous avec le plus de précisions possible.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 sm:p-8 space-y-8">
                  <form onSubmit={handleSubmit} className="space-y-8 text-start">
                    {/* Étape 1 : Choix interactif du Type de signalement */}
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-wider text-foreground">
                        1. Type d'anomalie constatée
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {SIGNAL_TYPES.map((st) => {
                          const Icon = st.icon;
                          const isSelected = formData.targetType === st.type;
                          return (
                            <button
                              key={st.type}
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, targetType: st.type }))}
                              className={cn(
                                "flex flex-col text-left p-4 rounded-2xl border transition-all duration-200 space-y-2 relative overflow-hidden",
                                isSelected
                                  ? "bg-card border-primary ring-2 ring-primary/40 shadow-lg shadow-primary/10"
                                  : "bg-card/40 border-border/60 hover:border-border hover:bg-card/70"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center", st.color)}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                {isSelected && (
                                  <Badge className="bg-primary text-primary-foreground text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                                    Sélectionné
                                  </Badge>
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-black uppercase tracking-tight text-foreground">
                                  {st.label}
                                </p>
                                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                                  {st.desc}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Étape 2 : Niveau de Sévérité */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-black uppercase tracking-wider text-foreground">
                          2. Degré de sévérité & impact
                        </Label>
                        <span className="text-[11px] text-muted-foreground">
                          Impact sur votre navigation
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {SEVERITIES.map((sev) => {
                          const isSelected = formData.severity === sev.level;
                          return (
                            <button
                              key={sev.level}
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, severity: sev.level }))}
                              className={cn(
                                "p-3 rounded-2xl border text-left transition-all space-y-1",
                                isSelected
                                  ? sev.activeClass
                                  : "bg-card/40 border-border/60 hover:bg-card text-muted-foreground"
                              )}
                            >
                              <p className="text-xs font-bold leading-tight flex items-center gap-1.5">
                                <Flame className={cn("w-3.5 h-3.5", isSelected ? sev.color : "text-muted-foreground/40")} />
                                <span>{sev.label}</span>
                              </p>
                              <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                                {sev.desc}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Étape 3 : Titre du problème */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="title" className="text-xs font-black uppercase tracking-wider text-foreground">
                          3. Titre concis de l'anomalie
                        </Label>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formData.title.length}/100 caractères
                        </span>
                      </div>
                      <Input
                        id="title"
                        maxLength={100}
                        placeholder="Ex: Le bouton de validation du bracket reste bloqué au clic"
                        value={formData.title}
                        onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                        required
                        className="h-12 rounded-2xl bg-card border-border/60 text-xs font-medium focus:border-primary/50"
                      />
                    </div>

                    {/* Étape 4 : Description & Étapes pour reproduire */}
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-xs font-black uppercase tracking-wider text-foreground">
                        4. Étapes de reproduction & description détaillée
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="1. Je me suis rendu sur la page du tournoi...&#10;2. J'ai cliqué sur l'onglet 'Brackets'...&#10;3. Le message d'erreur '403' est apparu à l'écran..."
                        className="min-h-[140px] rounded-2xl bg-card border-border/60 resize-none p-4 text-xs font-normal leading-relaxed focus:border-primary/50"
                        value={formData.description}
                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        required
                      />
                    </div>

                    {/* Étape 5 : Métadonnées d'environnement automatiquement incluses */}
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                        <Monitor className="w-4 h-4 text-primary" />
                        <span>Environnement technique capturé automatiquement</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Pour permettre à nos équipes de reproduire et résoudre ce bug instantanément, ces données techniques anonymisées sont automatiquement attachées à votre rapport :
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px]">
                        <span className="px-2.5 py-1 rounded-lg bg-background border border-border/60 text-muted-foreground">
                          🖥️ Écran: {systemMetadata.screen}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-background border border-border/60 text-muted-foreground line-clamp-1 max-w-xs">
                          🌐 Navigateur: {systemMetadata.browser}
                        </span>
                      </div>
                    </div>

                    {/* Actions de soumission */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/40">
                      <p className="text-[11px] text-muted-foreground text-center sm:text-left">
                        Traitement confidentiel selon notre charte de sécurité e-sport.
                      </p>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button
                          type="button"
                          variant="ghost"
                          asChild
                          className="h-11 px-5 rounded-xl text-xs font-bold"
                        >
                          <Link href="/docs">Annuler</Link>
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading}
                          className="h-11 px-8 rounded-xl font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 gap-2 flex-1 sm:flex-none"
                        >
                          {loading ? "Transmission en cours..." : "Transmettre le signalement"}
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
