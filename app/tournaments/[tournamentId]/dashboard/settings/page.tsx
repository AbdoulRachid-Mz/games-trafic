"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { getTournamentById, updateTournament } from "@/actions/tournaments";
import { AutoSyncField } from "@/components/shared/auto-sync-field";
import { toast } from "sonner";
import { Globe, Lock, Mail, Phone, MessageSquare } from "lucide-react";

export default function TournamentDashboardSettingsPage() {
  const params = useParams();
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [params.tournamentId]);

  const load = async () => {
    try {
      setLoading(true);
      const t = await getTournamentById(params.tournamentId as string);
      setTournament(t);
    } catch (error) {
      toast.error("Erreur lors du chargement du tournoi");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      await updateTournament(params.tournamentId as string, data);
      // Optionnel: recharger pour être sûr d'être à jour
      // await load();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
      throw error;
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Chargement des paramètres...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <Typography variant="h2" weight="bold" className="italic uppercase tracking-tighter">
          Paramètres du Tournoi
        </Typography>
        <Typography variant="body-sm" theme="muted">
          Gérez la visibilité, l'accès et les informations de contact.
        </Typography>
      </div>

      <div className="grid gap-6">
        {/* Visibilité et Accès */}
        <Card className="border-border/50 bg-card/30 backdrop-blur-sm rounded-[2rem] overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Visibilité et Accès
            </CardTitle>
            <CardDescription>Configurez comment les joueurs peuvent trouver et rejoindre votre tournoi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AutoSyncField
                label="Visibilité"
                value={tournament?.visibility || "PUBLIC"}
                type="select"
                options={[
                  { label: "Public", value: "PUBLIC" },
                  { label: "Privé", value: "PRIVATE" },
                  { label: "Non listé", value: "UNLISTED" },
                ]}
                onChange={(val) => handleUpdate({ visibility: val })}
                editMode="auto"
              />
              <AutoSyncField
                label="Code d'accès"
                value={tournament?.accessCode || ""}
                onChange={(val) => handleUpdate({ accessCode: val || null })}
                placeholder="Ex: TOURNOI2024"
                editMode="auto"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/10 rounded-2xl border border-border/50">
                <AutoSyncField
                  label="Accès sur invitation"
                  value={tournament?.inviteOnly || false}
                  type="switch"
                  onChange={(val) => handleUpdate({ inviteOnly: val })}
                  editMode="auto"
                  className="flex items-center justify-between"
                />
              </div>
              <div className="p-4 bg-muted/10 rounded-2xl border border-border/50">
                <AutoSyncField
                  label="Code requis pour rejoindre"
                  value={tournament?.requiresAccessCode || false}
                  type="switch"
                  onChange={(val) => handleUpdate({ requiresAccessCode: val })}
                  editMode="auto"
                  className="flex items-center justify-between"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contacts et Social */}
        <Card className="border-border/50 bg-card/30 backdrop-blur-sm rounded-[2rem] overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Contacts et Réseaux Sociaux
            </CardTitle>
            <CardDescription>Canaux de communication pour les participants.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AutoSyncField
                label="Email de contact"
                value={tournament?.contactEmail || ""}
                onChange={(val) => handleUpdate({ contactEmail: val || null })}
                placeholder="Ex: contact@esports.com"
                editMode="auto"
              />
              <AutoSyncField
                label="Téléphone"
                value={tournament?.contactPhone || ""}
                onChange={(val) => handleUpdate({ contactPhone: val || null })}
                placeholder="Ex: +227 90 00 00 00"
                editMode="auto"
              />
              <AutoSyncField
                label="Serveur Discord"
                value={tournament?.discordServer || ""}
                onChange={(val) => handleUpdate({ discordServer: val || null })}
                placeholder="https://discord.gg/..."
                editMode="auto"
              />
              <AutoSyncField
                label="Groupe WhatsApp"
                value={tournament?.whatsappGroup || ""}
                onChange={(val) => handleUpdate({ whatsappGroup: val || null })}
                placeholder="https://chat.whatsapp.com/..."
                editMode="auto"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
