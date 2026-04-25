"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createTournamentEdition } from "@/actions/tournaments";
import { Loader2 } from "lucide-react";
import { Controller } from "react-hook-form";

// Schéma simplifié - accepter string pour startDate
const formSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  editionNumber: z.number().int().min(1),
  startDate: z.string().min(1, "La date est requise"),
  maxParticipants: z.number().int().min(1).nullable().optional(),
  prizePool: z.string().nullable().optional(),
  prizeCurrency: z.string().min(1),
  locationType: z.string().min(1),
  location: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  editionConfig: z.object({
    competitionType: z.enum(["CHAMPIONSHIP", "CUP", "LDC", "SWISS"]),
    competitionMode: z.enum(["AUTO", "MANUAL"]),
    checkinRequired: z.boolean(),
    autoStart: z.boolean(),
    seedMethod: z.string(),
    tiebreakerRules: z.record(z.string(), z.any()),
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateEditionFormProps {
  tournamentId: string;
  nextEditionNumber: number;
}

// Helper pour formater une date au format YYYY-MM-DD
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function CreateEditionForm({
  tournamentId,
  nextEditionNumber,
}: CreateEditionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: `Édition ${nextEditionNumber}`,
      editionNumber: nextEditionNumber,
      startDate: formatDateForInput(new Date()),
      maxParticipants: 32,
      prizePool: "0",
      prizeCurrency: "GTC",
      locationType: "ONLINE",
      location: "En ligne",
      description: "",
      editionConfig: {
        competitionType: "LDC",
        competitionMode: "AUTO",
        checkinRequired: false,
        autoStart: true,
        seedMethod: "RANDOM",
        tiebreakerRules: {},
      },
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    setLoading(true);
    try {
      // Convertir la string en Date pour l'API
      const startDate = new Date(values.startDate);
      
      // Vérifier que la date est valide
      if (isNaN(startDate.getTime())) {
        throw new Error("Date invalide");
      }

      await createTournamentEdition({
        ...values,
        tournamentId,
        status: "UPCOMING",
        startDate,
      } as any);

      toast.success("Édition créée avec succès");
      router.push(`/tournaments/${tournamentId}/dashboard/editions`);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la création de l'édition");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouvelle Édition</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field>
                <FieldLabel>Nom de l'édition</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="Ex: Édition Hiver 2024"
                    {...register("name")}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <FieldError errors={[errors.name]} />}
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Numéro d'édition</FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    {...register("editionNumber", { valueAsNumber: true })}
                    aria-invalid={!!errors.editionNumber}
                  />
                  {errors.editionNumber && <FieldError errors={[errors.editionNumber]} />}
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Date de début</FieldLabel>
                <FieldContent>
                  <Input
                    type="date"
                    {...register("startDate")}
                    aria-invalid={!!errors.startDate}
                  />
                  {errors.startDate && <FieldError errors={[errors.startDate]} />}
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Nombre max de participants</FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    {...register("maxParticipants", { valueAsNumber: true })}
                    aria-invalid={!!errors.maxParticipants}
                  />
                  {errors.maxParticipants && <FieldError errors={[errors.maxParticipants]} />}
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Cashprize</FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    step="0.01"
                    {...register("prizePool")}
                    aria-invalid={!!errors.prizePool}
                  />
                  {errors.prizePool && <FieldError errors={[errors.prizePool]} />}
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Type de lieu</FieldLabel>
                <FieldContent>
                  <Controller
                    control={control}
                    name="locationType"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir le type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ONLINE">En ligne</SelectItem>
                          <SelectItem value="VENUE">Physique</SelectItem>
                          <SelectItem value="HYBRID">Hybride</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.locationType && <FieldError errors={[errors.locationType]} />}
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Type de compétition</FieldLabel>
                <FieldContent>
                  <Controller
                    control={control}
                    name="editionConfig.competitionType"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir le type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CHAMPIONSHIP">Championnat (Ligue)</SelectItem>
                          <SelectItem value="CUP">Coupe (Élimination directe)</SelectItem>
                          <SelectItem value="LDC">Ligue des Champions (Groupes + Élimination)</SelectItem>
                          <SelectItem value="SWISS">Système Suisse</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FieldContent>
                <FieldDescription>
                  Définit la structure de base du tournoi.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Mode de gestion</FieldLabel>
                <FieldContent>
                  <Controller
                    control={control}
                    name="editionConfig.competitionMode"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir le mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AUTO">Assistant (Automatisé)</SelectItem>
                          <SelectItem value="MANUAL">Manuel (Contrôle total)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FieldContent>
                <FieldDescription>
                  L'Assistant gère les qualifications et bracket nodes automatiquement en mode Auto.
                </FieldDescription>
              </Field>
            </div>

            <Field>
              <FieldLabel>Lieu / Lien</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="Ex: Discord, Adresse, etc."
                  {...register("location")}
                  aria-invalid={!!errors.location}
                />
                {errors.location && <FieldError errors={[errors.location]} />}
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Description de l'édition</FieldLabel>
              <FieldContent>
                <Textarea
                  placeholder="Détails spécifiques à cette édition..."
                  className="min-h-[100px]"
                  {...register("description")}
                  aria-invalid={!!errors.description}
                />
                {errors.description && <FieldError errors={[errors.description]} />}
              </FieldContent>
            </Field>
          </FieldGroup>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer l'édition
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}