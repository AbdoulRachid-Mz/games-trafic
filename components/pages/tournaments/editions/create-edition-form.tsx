"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { CalendarIcon, Loader2 } from "lucide-react";
import { Controller } from "react-hook-form";
import { createInsertSchema } from "drizzle-zod";
import { tournamentEditions } from "@/database/schema";

const formSchema = createInsertSchema(tournamentEditions).pick({
  name: true,
  editionNumber: true,
  startDate: true,
  maxParticipants: true,
  prizePool: true,
  prizeCurrency: true,
  locationType: true,
  location: true,
  description: true,
});

type FormValues = z.infer<typeof formSchema>;

interface CreateEditionFormProps {
  tournamentId: string;
  nextEditionNumber: number;
}

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
      startDate: new Date(),
      maxParticipants: 32,
      prizePool: "0",
      prizeCurrency: "GTC",
      locationType: "ONLINE",
      location: "En ligne",
      description: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      await createTournamentEdition({
        ...values,
        tournamentId,
        status: "UPCOMING",
        startDate: new Date(values.startDate),
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
  }

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
                    {...register("editionNumber")}
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
                    {...register("maxParticipants")}
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
                      <Select onValueChange={field.onChange} value={field.value ?? undefined}>
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
