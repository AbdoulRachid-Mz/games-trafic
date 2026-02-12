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
import { useForm } from "react-hook-form";
import { useUpdateEdition, useDeleteEdition } from "@/hooks/use-editions";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface EditionSettingsFormProps {
  edition: TournamentEditionWithRelations;
  tournamentId: string;
}

export function EditionSettingsForm({
  edition,
  tournamentId,
}: EditionSettingsFormProps) {
  const router = useRouter();
  const updateDecoration = useUpdateEdition();
  const deleteMutation = useDeleteEdition();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      name: edition.name || "",
      slug: edition.editionSlug || "",
      description: edition.description || "",
      entryFee: edition.entryFee || 0,
      maxParticipants: edition.maxParticipants || 64,
      startDate: edition.startDate
        ? new Date(edition.startDate).toISOString().split("T")[0]
        : "",
      endDate: edition.endDate
        ? new Date(edition.endDate).toISOString().split("T")[0]
        : "",
      registrationDeadline: edition.registrationDeadline
        ? new Date(edition.registrationDeadline).toISOString().split("T")[0]
        : "",
      locationType: edition.locationType || "ONLINE",
      location: edition.location || "",
      prizePool: edition.prizePool || 0,
      prizeCurrency: edition.prizeCurrency || "GTC",
      notificationsEnabled: edition.notificationsEnabled ?? true,
      autoAdvance: edition.autoAdvance ?? true,
      // @ts-ignore
      config_checkinRequired: edition.editionConfig?.checkinRequired ?? false,
      // @ts-ignore
      config_autoStart: edition.editionConfig?.autoStart ?? true,
      // @ts-ignore
      config_seedMethod: edition.editionConfig?.seedMethod || "RANDOM",
      // @ts-ignore
      config_tiebreakerRules: JSON.stringify(edition.editionConfig?.tiebreakerRules || {}),
    },
  });

  const onSubmit = (data: any) => {
    updateDecoration.mutate({
      id: edition.id,
      data: {
        ...data,
        entryFee: Number(data.entryFee),
        maxParticipants: Number(data.maxParticipants),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        registrationDeadline: new Date(data.registrationDeadline),
        prizePool: Number(data.prizePool),
        notificationsEnabled: Boolean(data.notificationsEnabled),
        autoAdvance: Boolean(data.autoAdvance),
        editionConfig: {
          checkinRequired: Boolean(data.config_checkinRequired),
          autoStart: Boolean(data.config_autoStart),
          seedMethod: data.config_seedMethod,
          tiebreakerRules: (() => {
            try {
              return JSON.parse(data.config_tiebreakerRules || "{}");
            } catch {
              return {};
            }
          })(),
        },
      },
    });
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
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Paramètres Généraux</CardTitle>
            <CardDescription>
              Modifiez les informations principales de l'édition.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'édition</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder={`Édition #${edition.editionNumber}`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">slug de l'édition</Label>
                <Input
                  id="slug"
                  {...register("slug")}
                  placeholder={`Édition #${edition.editionSlug}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxParticipants">Participants Max</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  {...register("maxParticipants")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début</Label>
                <Input id="startDate" type="date" {...register("startDate")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin</Label>
                <Input id="endDate" type="date" {...register("endDate")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationDeadline">
                  Date limite d'inscription
                </Label>
                <Input
                  id="registrationDeadline"
                  type="date"
                  {...register("registrationDeadline")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entryFee">Frais d'inscription (GTC)</Label>
                <Input
                  id="entryFee"
                  type="number"
                  step="0.01"
                  {...register("entryFee")}
                />
                <p className="text-xs text-muted-foreground">
                  Mettre 0 pour gratuit
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prizePool">Prix total (pool)</Label>
                <Input id="prizePool" type="number" step="0.01" {...register("prizePool")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prizeCurrency">Devise des prix</Label>
                <Input id="prizeCurrency" {...register("prizeCurrency")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationType">Type de lieu</Label>
                <select id="locationType" className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full" {...register("locationType")}>
                  <option value="ONLINE">En ligne</option>
                  <option value="VENUE">Présentiel</option>
                  <option value="HYBRID">Hybride</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Lieu</Label>
                <Input id="location" {...register("location")} placeholder="Adresse ou URL" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 p-4 border rounded-xl">
                <div className="font-medium">Notifications & Avancement</div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notificationsEnabled">Notifications activées</Label>
                  <Switch id="notificationsEnabled" checked={!!edition.notificationsEnabled} {...register("notificationsEnabled")} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoAdvance">Avancement automatique</Label>
                  <Switch id="autoAdvance" checked={!!edition.autoAdvance} {...register("autoAdvance")} />
                </div>
              </div>
              <div className="space-y-3 p-4 border rounded-xl">
                <div className="font-medium">Configuration compétition</div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="config_checkinRequired">Check-in requis</Label>
                  {/* @ts-ignore */}
                  <Switch id="config_checkinRequired" checked={!!edition.editionConfig?.checkinRequired} {...register("config_checkinRequired")} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="config_autoStart">Démarrage auto</Label>
                  {/* @ts-ignore */}
                  <Switch id="config_autoStart" checked={!!edition.editionConfig?.autoStart} {...register("config_autoStart")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="config_seedMethod">Méthode de seed</Label>
                  <select id="config_seedMethod" className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full" {...register("config_seedMethod")}>
                    <option value="RANDOM">Aléatoire</option>
                    <option value="RANKING">Classement</option>
                    <option value="MANUAL">Manuel</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="config_tiebreakerRules">Règles de tiebreaker (JSON)</Label>
                  <Textarea id="config_tiebreakerRules" rows={3} {...register("config_tiebreakerRules")} />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4 bg-muted/50 flex justify-end">
            <Button
              type="submit"
              disabled={!isDirty || updateDecoration.isPending}
            >
              {updateDecoration.isPending
                ? "Enregistrement..."
                : "Enregistrer les modifications"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Card className="border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-500">Zone de Danger</CardTitle>
          <CardDescription>Actions irréversibles</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="bg-red-500/10 border-none">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Supprimer l'édition</AlertTitle>
            <AlertDescription>
              Cela supprimera définitivement l'édition et toutes les données
              associées (inscriptions, matchs, etc.).
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            Supprimer l'édition
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
