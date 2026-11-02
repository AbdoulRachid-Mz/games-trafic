// @/components/pages/tournaments/edition-detail/edition-rules-tab.tsx
"use client";

import React from "react";
import { Tournament, TournamentEditionWithRelations } from "@/database/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import {
  Shield,
  Clock,
  WifiOff,
  AlertTriangle,
  Award,
  CheckCircle2,
  FileText,
  HelpCircle,
  Scale,
} from "lucide-react";

interface EditionRulesTabProps {
  tournament: Tournament;
  edition: TournamentEditionWithRelations;
}

export function EditionRulesTab({
  tournament,
  edition,
}: EditionRulesTabProps) {
  return (
    <div className="space-y-6">
      {/* Bannière d'introduction */}
      <div className="relative overflow-hidden bg-gradient-to-r from-card/80 via-card to-card/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10" />
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-black italic tracking-tighter">
              Règlement Officiel de la Compétition
            </h3>
            <p className="text-sm text-muted-foreground font-medium">
              Normes d&apos;arbitrage, charte de fair-play et conditions de participation
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1 : Format & Paramètres */}
        <div className="bg-card/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" />
            <h4 className="font-black uppercase tracking-wider text-sm italic">
              1. Format & Paramètres de Jeu
            </h4>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              • <strong>Jeu officiel :</strong> {tournament.game}
            </p>
            <p>
              • <strong>Plateformes autorisées :</strong> Web / PC / Consoles (Crossplay selon le jeu)
            </p>
            <p>
              • <strong>Structure :</strong> Matchs en round robin ou élimination selon les phases actives.
            </p>
            <p>
              • <strong>Hébergement :</strong> Serveurs officiels ou création de salon privé selon entente des capitaines.
            </p>
          </div>
        </div>

        {/* Section 2 : Check-in & Ponctualité */}
        <div className="bg-card/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-blue-400">
            <Clock className="h-5 w-5" />
            <h4 className="font-black uppercase tracking-wider text-sm italic">
              2. Check-in & Délais de présence
            </h4>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              • <strong>Validation du check-in :</strong> Tout participant doit valider son check-in 15 à 30 minutes avant le début de l&apos;édition.
            </p>
            <p>
              • <strong>Délai de grâce :</strong> 10 minutes maximum après l&apos;heure officielle du match. Passé ce délai, un forfait automatique (Walk-over / Forfeit 0-2) sera prononcé.
            </p>
          </div>
        </div>

        {/* Section 3 : Déconnexions & Problèmes techniques */}
        <div className="bg-card/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-amber-400">
            <WifiOff className="h-5 w-5" />
            <h4 className="font-black uppercase tracking-wider text-sm italic">
              3. Déconnexions & Pannes réseau
            </h4>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              • En cas de déconnexion dans les 60 premières secondes du match sans qu&apos;un point n&apos;ait été marqué, la manche est relancée.
            </p>
            <p>
              • Si le match est déjà engagé, le score acquis est conservé et les manches restantes sont rejouées.
            </p>
            <p>
              • Toute capture d&apos;écran ou enregistrement vidéo servira de preuve auprès des arbitres du tournoi.
            </p>
          </div>
        </div>

        {/* Section 4 : Dotations & Récompenses */}
        <div className="bg-card/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-yellow-400">
            <Award className="h-5 w-5" />
            <h4 className="font-black uppercase tracking-wider text-sm italic">
              4. Dotations & Paiement des Prix
            </h4>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              • Les gains sont crédités directement sur le portefeuille du vainqueur ou de l&apos;équipe à la clôture officielle du tournoi.
            </p>
            <p>
              • Les commissions éventuelles de la plateforme sont déduites selon les conditions générales de Games-Trafics.
            </p>
          </div>
        </div>
      </div>

      {/* Règles spécifiques rédigées par l'organisateur */}
      {edition.editionRules && (
        <div className="bg-card/60 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 md:p-8 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <FileText className="h-5 w-5" />
            <h4 className="font-black uppercase tracking-wider text-base italic">
              Directives spécifiques de l&apos;organisateur
            </h4>
          </div>
          <div className="prose dark:prose-invert max-w-none text-muted-foreground text-sm whitespace-pre-line bg-background/50 p-4 rounded-xl border border-white/5">
            {edition.editionRules}
          </div>
        </div>
      )}
    </div>
  );
}
