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

// Schéma de création d'édition : dates, inscription, scoring, finance, médias, format.
const formSchema = z
  .object({
    name: z.string().min(1, "Le nom est requis"),
    editionNumber: z.number().int().min(1),
    startDate: z.string().min(1, "La date de début est requise"),
    endDate: z.string().optional(),
    registrationOpens: z.string().optional(),
    registrationDeadline: z.string().optional(),
    maxParticipants: z.number().int().min(1).nullable().optional(),
    entryFee: z.string().nullable().optional(),
    prizePool: z.string().nullable().optional(),
    prizeCurrency: z.string().min(1),
    locationType: z.string().min(1),
    location: z.string().nullable().optional(),
    virtualLink: z.string().nullable().optional(),
    streamLink: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    editionRules: z.string().nullable().optional(),
    editionConfig: z.object({
      competitionType: z.enum(["CHAMPIONSHIP", "CUP", "LDC", "SWISS"]),
      competitionMode: z.enum(["AUTO", "MANUAL"]),
      checkinRequired: z.boolean(),
      autoStart: z.boolean(),
      seedMethod: z.string(),
      tiebreakerRules: z.record(z.string(), z.any()),
    }),
  })
  .superRefine((values, ctx) => {
    const start = values.startDate ? new Date(values.startDate) : null;
    if (start && !Number.isNaN(start.getTime())) {
      if (values.endDate) {
        const end = new Date(values.endDate);
        if (!Number.isNaN(end.getTime()) && end < start) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["endDate"],
            message: "La date de fin doit être postérieure au début.",
          });
        }
      }
      if (values.registrationDeadline) {
        const deadline = new Date(values.registrationDeadline);
        if (!Number.isNaN(deadline.getTime()) && deadline > start) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["registrationDeadline"],
            message: "La clôture des inscriptions doit précéder le début.",
          });
        }
      }
    }
    if (values.registrationOpens && values.registrationDeadline) {
      const opens = new Date(values.registrationOpens);
      const deadline = new Date(values.registrationDeadline);
      if (
        !Number.isNaN(opens.getTime()) &&
        !Number.isNaN(deadline.getTime()) &&
        deadline < opens
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["registrationDeadline"],
          message: "La clôture doit être postérieure à l'ouverture.",
        });
      }
    }
    if (values.entryFee && Number(values.entryFee) < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["entryFee"],
        message: "Les frais d'inscription ne peuvent pas être négatifs.",
      });
    }
    if (values.prizePool && Number(values.prizePool) < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["prizePool"],
        message: "Le cashprize ne peut pas être négatif.",
      });
    }
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
      endDate: "",
      registrationOpens: "",
      registrationDeadline: "",
      maxParticipants: 32,
      entryFee: "0",
      prizePool: "0",
      prizeCurrency: "GTC",
      locationType: "ONLINE",
      location: "En ligne",
      virtualLink: "",
      streamLink: "",
      description: "",
      editionRules: "",
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
      const toDate = (value?: string | null) => {
        if (!value) return undefined;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? undefined : parsed;
      };

      const startDate = toDate(values.startDate);
      if (!startDate) throw new Error("La date de début est invalide.");

      const { endDate, registrationOpens, registrationDeadline, ...rest } =
        values;

      const payload = {
        ...rest,
        endDate: toDate(endDate),
        registrationOpens: toDate(registrationOpens),
        registrationDeadline: toDate(registrationDeadline),
        entryFee: values.entryFee ? values.entryFee : "0",
        prizePool: values.prizePool ? values.prizePool : "0",
        location: values.location || null,
        virtualLink: values.virtualLink || null,
        streamLink: values.streamLink || null,
        description: values.description || null,
        editionRules: values.editionRules || null,
        tournamentId,
        status: "UPCOMING" as const,
        startDate,
      };

      await createTournamentEdition(payload as any);

      toast.success("Édition créée avec succès");
      router.push(`/tournaments/${tournamentId}/dashboard/editions`);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.message || "Erreur lors de la création de l'édition",
      );
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
                <FieldLabel>Date de fin</FieldLabel>
                <FieldContent>
                  <Input
                    type="date"
                    {...register("endDate")}
                    aria-invalid={!!errors.endDate}
                  />
                  {errors.endDate && <FieldError errors={[errors.endDate]} />}
                </FieldContent>
                <FieldDescription>
                  Facultatif. Doit être postérieure à la date de début.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Ouverture des inscriptions</FieldLabel>
                <FieldContent>
                  <Input
                    type="date"
                    {...register("registrationOpens")}
                    aria-invalid={!!errors.registrationOpens}
                  />
                  {errors.registrationOpens && (
                    <FieldError errors={[errors.registrationOpens]} />
                  )}
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Clôture des inscriptions</FieldLabel>
                <FieldContent>
                  <Input
                    type="date"
                    {...register("registrationDeadline")}
                    aria-invalid={!!errors.registrationDeadline}
                  />
                  {errors.registrationDeadline && (
                    <FieldError errors={[errors.registrationDeadline]} />
                  )}
                </FieldContent>
                <FieldDescription>
                  Doit précéder le début de l&apos;édition.
                </FieldDescription>
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
                <FieldLabel>Devise</FieldLabel>
                <FieldContent>
                  <Controller
                    control={control}
                    name="prizeCurrency"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir la devise" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GTC">GTC</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.prizeCurrency && (
                    <FieldError errors={[errors.prizeCurrency]} />
                  )}
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Frais d&apos;inscription</FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("entryFee")}
                    aria-invalid={!!errors.entryFee}
                  />
                  {errors.entryFee && <FieldError errors={[errors.entryFee]} />}
                </FieldContent>
                <FieldDescription>
                  0 pour une inscription gratuite. Le paiement est débité du
                  portefeuille du joueur.
                </FieldDescription>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field>
                <FieldLabel>Lien de jeu / salon</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="https://..."
                    {...register("virtualLink")}
                    aria-invalid={!!errors.virtualLink}
                  />
                  {errors.virtualLink && (
                    <FieldError errors={[errors.virtualLink]} />
                  )}
                </FieldContent>
                <FieldDescription>
                  Lien de connexion pour les participants (Discord, lobby, etc.).
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Lien du stream</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="https://twitch.tv/..."
                    {...register("streamLink")}
                    aria-invalid={!!errors.streamLink}
                  />
                  {errors.streamLink && (
                    <FieldError errors={[errors.streamLink]} />
                  )}
                </FieldContent>
                <FieldDescription>
                  Diffusion officielle de l&apos;édition (facultatif).
                </FieldDescription>
              </Field>
            </div>

            <Field>
              <FieldLabel>Règlement de l&apos;édition</FieldLabel>
              <FieldContent>
                <Textarea
                  placeholder="Règles spécifiques, format, horaires..."
                  className="min-h-[100px]"
                  {...register("editionRules")}
                  aria-invalid={!!errors.editionRules}
                />
                {errors.editionRules && (
                  <FieldError errors={[errors.editionRules]} />
                )}
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