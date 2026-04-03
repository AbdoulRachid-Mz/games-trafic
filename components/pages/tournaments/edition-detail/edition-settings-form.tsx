"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  TournamentEdition,
  TournamentEditionWithRelations,
} from "@/database/schema";
import { useDeleteEdition } from "@/hooks/use-editions";
import { useRouter } from "next/navigation";
import { Trash2, Calendar, Users, MapPin, Trophy, Bell, Zap, Info } from "lucide-react";
import { AutoSyncField } from "@/components/shared/auto-sync-field";
import { updateEdition } from "@/actions/editions";
import { toast } from "sonner";

interface EditionSettingsFormProps {
  edition: TournamentEditionWithRelations;
  tournamentId: string;
}

export function EditionSettingsForm({
  edition,
  tournamentId,
}: EditionSettingsFormProps) {
  const router = useRouter();
  const deleteMutation = useDeleteEdition();

  const handleUpdate = async (field: keyof TournamentEdition, value: any) => {
    try {
      await updateEdition(edition.id, { [field]: value });
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleConfigUpdate = async (key: string, value: any) => {
    try {
      const currentConfig = edition.editionConfig || {};
      await updateEdition(edition.id, {
        editionConfig: {
          ...currentConfig,
          [key]: value,
        },
      });
    } catch (error) {
      toast.error("Erreur lors de la mise à jour de la configuration");
    }
  };

  const handleDelete = () => {
    if (
      confirm(
        "Êtes-vous sûr de vouloir supprimer cette édition ? Cette action est irréversible."
      )
    ) {
      deleteMutation.mutate(edition.id, {
        onSuccess: () => {
          router.push(`/tournaments/${tournamentId}`);
        },
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Informations Principales */}
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="bg-muted/30 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Informations Générales</CardTitle>
              <CardDescription>
                Identité et visibilité de cette édition.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AutoSyncField<string>
              label="Nom de l'édition"
              value={edition.name || ""}
              onChange={async (val: string) => { await handleUpdate("name", val); }}
              placeholder="Ex: Spring Finals 2024"
              helperText="Le nom public de cette édition."
            />
            <AutoSyncField<string>
              label="Slug d'URL"
              value={edition.editionSlug || ""}
              onChange={async (val: string) => { await handleUpdate("editionSlug", val); }}
              placeholder="spring-finals-2024"
              helperText="Utilisé dans l'URL (ex: /editions/slug)"
            />
          </div>

          <AutoSyncField<string>
            label="Description"
            type="textarea"
            value={edition.description || ""}
            onChange={async (val: string) => { await handleUpdate("description", val); }}
            placeholder="Détails, règles spécifiques, etc."
          />
        </CardContent>
      </Card>

      {/* Logistique & Planning */}
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="bg-muted/30 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Logistique & Planning</CardTitle>
              <CardDescription>
                Dates clés et limites de participants.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AutoSyncField<number>
              label="Participants Max"
              type="number"
              value={edition.maxParticipants || 64}
              onChange={(val) => handleUpdate("maxParticipants", val)}
              icon={Users}
            />
            <AutoSyncField<string>
                label="Type de lieu"
                type="select"
                value={edition.locationType || "ONLINE"}
                options={[
                    { label: "En ligne", value: "ONLINE" },
                    { label: "Présentiel", value: "VENUE" },
                    { label: "Hybride", value: "HYBRID" },
                ]}
                onChange={(val) => handleUpdate("locationType", val)}
                icon={MapPin}
            />
            <AutoSyncField<string>
                label="Lieu / URL"
                value={edition.location || ""}
                onChange={(val) => handleUpdate("location", val)}
                placeholder="Ex: Paris ou Discord"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AutoSyncField<string>
              label="Début"
              type="date"
              value={edition.startDate ? new Date(edition.startDate).toISOString().split('T')[0] : ""}
              onChange={(val) => handleUpdate("startDate", new Date(val))}
            />
            <AutoSyncField<string>
              label="Fin"
              type="date"
              value={edition.endDate ? new Date(edition.endDate).toISOString().split('T')[0] : ""}
              onChange={(val) => handleUpdate("endDate", new Date(val))}
            />
            <AutoSyncField<string>
              label="Date limite inscription"
              type="date"
              value={edition.registrationDeadline ? new Date(edition.registrationDeadline).toISOString().split('T')[0] : ""}
              onChange={(val) => handleUpdate("registrationDeadline", new Date(val))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Finance & Cashprize */}
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="bg-muted/30 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Finance & Récompenses</CardTitle>
              <CardDescription>
                Frais d'entrée et dotation globale.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AutoSyncField<number>
              label="Frais d'inscription"
              type="number"
              value={Number(edition.entryFee) || 0}
              onChange={async (val: number) => { await handleUpdate("entryFee", val); }}
              helperText="Mettre 0 pour gratuit"
            />
            <AutoSyncField<number>
              label="Cashprize Total"
              type="number"
              value={Number(edition.prizePool) || 0}
              onChange={async (val: number) => { await handleUpdate("prizePool", val); }}
            />
            <AutoSyncField<string>
              label="Devise"
              value={edition.prizeCurrency || "GTC"}
              onChange={(val) => handleUpdate("prizeCurrency", val)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Automatisation & Sécurité */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50 overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-green-500/10 text-green-500">
                        <Bell className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">Notifications & Flux</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <AutoSyncField<boolean>
                    label="Notifications activées"
                    type="switch"
                    value={edition.notificationsEnabled ?? true}
                    onChange={(val) => handleUpdate("notificationsEnabled", val)}
                    helperText="Informer les joueurs des changements"
                />
                <AutoSyncField<boolean>
                    label="Avancement automatique"
                    type="switch"
                    value={edition.autoAdvance ?? true}
                    onChange={(val) => handleUpdate("autoAdvance", val)}
                    helperText="Passer aux phases suivantes automatiquement"
                />
            </CardContent>
        </Card>

        <Card className="border-border/50 overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                        <Zap className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">Configuration Matchs</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <AutoSyncField<boolean>
                    label="Check-in requis"
                    type="switch"
                    value={(edition.editionConfig as any)?.checkinRequired ?? false}
                    onChange={async (val: boolean) => { await handleConfigUpdate("checkinRequired", val); }}
                />
                <AutoSyncField<boolean>
                    label="Démarrage auto"
                    type="switch"
                    value={(edition.editionConfig as any)?.autoStart ?? true}
                    onChange={async (val: boolean) => { await handleConfigUpdate("autoStart", val); }}
                />
            </CardContent>
        </Card>
      </div>

      {/* Zone de Danger */}
      <Card className="border-red-500/20 bg-red-500/5">
        <CardHeader>
          <div className="flex items-center gap-3 text-red-500">
            <Trash2 className="h-5 w-5" />
            <CardTitle>Zone de Danger</CardTitle>
          </div>
          <CardDescription>
            Actions irréversibles concernant cette édition.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600/80 mb-4">
            La suppression supprimera toutes les inscriptions, les matchs et les résultats associés.
          </p>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="w-full sm:w-auto"
          >
            Supprimer définitivement l'édition
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
