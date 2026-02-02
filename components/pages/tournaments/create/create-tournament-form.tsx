"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Gamepad2,
  Trophy,
  Users,
  Calendar,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
// import { createTournament } from "@/actions/tournanents";

import type { NewTournament, NewTournamentEdition } from "@/database/schema";
import { platformEnum } from "@/database/schema";
// import { createTournamentEdition } from "@/actions/tournanents";
import { useAuthContext } from "@/contexts/auth-context";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import { generateTournamentDescription } from "@/lib/tournaments/description";
import { getTournamentPreviewData } from "@/lib/tournaments/preview";
import { createTournament, createTournamentEdition } from "@/actions/tournaments";

// Types pour le formulaire
interface TournamentFormData {
  name: string;
  description: string;
  game: string;
  platform: (typeof platformEnum.enumValues)[number] | "";
  maxParticipants: number;
  startDate: string;
  cashprize: number;
  isPublic: boolean;
  profileImage: string;
  coverImage: string;
}



const initialData: TournamentFormData = {
  name: "",
  description: "",
  game: "",
  platform: "",
  maxParticipants: 32,
  startDate: "",
  cashprize: 0,
  isPublic: true,
  profileImage: "",
  coverImage: "",
};

const steps = [
  { id: 1, title: "Images", icon: ImageIcon, description: "Profil & Cover" },
  { id: 2, title: "Informations", icon: Gamepad2, description: "Champs requis" },
  { id: 3, title: "Aperçu", icon: CheckCircle2, description: "Vérification & confirmation" },
];


export function CreateTournamentForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<TournamentFormData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {user, loading} = useAuthContext()
  const router = useRouter();

  const updateField = <K extends keyof TournamentFormData>(
    field: K,
    value: TournamentFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, steps.length));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!user?.id) {
        throw new Error("Utilisateur non authentifié");
      }
      if (!formData.name || !formData.game || !formData.startDate) {
        throw new Error("Champs requis manquants");
      }
      const platformValue = formData.platform && platformEnum.enumValues.includes(formData.platform)
        ? formData.platform
        : undefined;
      // Préparer les données du tournoi
      const tournamentData: NewTournament = {
        name: formData.name,
        description: formData.description,
        game: formData.game,
        platform: platformValue ?? null,
        maxParticipantsPerEdition: formData.maxParticipants,
        totalPrizePool: formData.cashprize.toString(),
        visibility: formData.isPublic ? "PUBLIC" : "PRIVATE",
        status: "UPCOMING",
        organizerId: user.id,
        profileImage: formData.profileImage || null,
        coverImage: formData.coverImage || null,
      };

      // Créer le tournoi via l'action serveur
      const tournament = await createTournament({
        ...tournamentData,
        profileImage: tournamentData.profileImage ?? null,
        platform: tournamentData.platform || null,
        visibility: tournamentData.visibility ?? "PUBLIC",
      });

      // Préparer les données de la première édition
      const editionData: NewTournamentEdition = {
        tournamentId: tournament.id,
        editionNumber: 1,
        name: `${tournament.name} - Édition 1`,
        startDate: new Date(formData.startDate),
        maxParticipants: formData.maxParticipants,
        prizePool: formData.cashprize.toString(),
        status: "UPCOMING",
      };

      // Créer la première édition
      const edition = await createTournamentEdition(editionData);

      console.log("Tournoi créé:", tournament);
      console.log("Édition créée:", edition);
      router.push("/tournaments");
    } catch (error) {
      console.error("Erreur lors de la création du tournoi:", error);
      // Optionnel : afficher une notification d'erreur
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header & Progress */}
      <div className="mb-12">
        <Typography
          variant="h1"
          className="text-3xl font-bold mb-6 text-center"
        >
          Créer un nouveau tournoi
        </Typography>

        <div className="flex justify-between items-center relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-secondary -z-10 rounded-full" />
          <div
            className="absolute top-1/2 left-0 h-1 bg-primary -z-10 rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          />

          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = step >= s.id;
            const isCurrent = step === s.id;

            return (
              <div
                key={s.id}
                className="flex flex-col items-center gap-2 bg-background p-2 rounded-xl"
              >
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                    ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-muted-foreground border-transparent"
                    }
                    ${isCurrent ? "ring-4 ring-primary/20 scale-110" : ""}
                  `}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-center hidden sm:block">
                  <span
                    className={`text-sm font-medium ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <Card className="border-border/50 shadow-xl overflow-hidden min-h-[400px] flex flex-col">
        <CardContent className="p-8 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {step === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Image de profil</Label>
                      <AdvancedUpload
                        value={formData.profileImage}
                        onChange={(url) => updateField("profileImage", url)}
                        uploadPath="tournaments/profile"
                        uploadPreset="games_trafics"
                        emptyPreview={
                          <div className="text-center">
                            <Typography variant="caption2" theme="muted">Uploadez une image de profil</Typography>
                          </div>
                        }
                        isRounded
                        previewClassName="w-32 h-32"
                        showInternalSelection
                        internalImagesFolder="images/tournaments/profile"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Image de couverture</Label>
                      <AdvancedUpload
                        value={formData.coverImage}
                        onChange={(url) => updateField("coverImage", url)}
                        uploadPath="tournaments/cover"
                        uploadPreset="games_trafics"
                        emptyPreview={
                          <div className="text-center">
                            <Typography variant="caption2" theme="muted">Uploadez une image de couverture</Typography>
                          </div>
                        }
                        previewClassName="min-h-[180px]"
                        showInternalSelection
                        internalImagesFolder="images/tournaments/cover"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du tournoi</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Tournoi Clash Royale - Édition Hiver"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className="text-lg"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Jeu</Label>
                      <Select
                        value={formData.game}
                        onValueChange={(val) => updateField("game", val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un jeu" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FIFA 24">EA FC 24</SelectItem>
                          <SelectItem value="COD">Call of Duty</SelectItem>
                          <SelectItem value="LOL">League of Legends</SelectItem>
                          <SelectItem value="CR">Clash Royale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Plateforme</Label>
                      <Select
                        value={formData.platform}
                        onValueChange={(val) => updateField("platform", val as (typeof platformEnum.enumValues)[number])}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir une plateforme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PC">PC</SelectItem>
                          <SelectItem value="PLAYSTATION">PlayStation</SelectItem>
                          <SelectItem value="XBOX">Xbox</SelectItem>
                          <SelectItem value="NINTENDO_SWITCH">Nintendo Switch</SelectItem>
                          <SelectItem value="MOBILE">Mobile</SelectItem>
                          <SelectItem value="VR">VR</SelectItem>
                          <SelectItem value="OTHER">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Nombre de participants max</Label>
                      <Select
                        value={formData.maxParticipants.toString()}
                        onValueChange={(val) =>
                          updateField("maxParticipants", parseInt(val))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Participants" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="8">8 joueurs</SelectItem>
                          <SelectItem value="16">16 joueurs</SelectItem>
                          <SelectItem value="32">32 joueurs</SelectItem>
                          <SelectItem value="64">64 joueurs</SelectItem>
                          <SelectItem value="128">128 joueurs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date de début</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="datetime-local"
                          className="pl-9"
                          value={formData.startDate}
                          onChange={(e) =>
                            updateField("startDate", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Cashprize Total (GTC)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.cashprize}
                        onChange={(e) =>
                          updateField(
                            "cashprize",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="font-bold text-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="desc">Description</Label>
                      <Textarea
                        id="desc"
                        placeholder="Décrivez votre tournoi, les règles spécifiques, etc."
                        className="min-h-[120px]"
                        value={formData.description}
                        onChange={(e) =>
                          updateField("description", e.target.value)
                        }
                      />
                      {!formData.description.trim() && (
                        <div className="mt-2 p-3 rounded-lg border border-border/50 bg-secondary/20">
                          <div className="flex items-center justify-between gap-3">
                            <Typography variant="caption1" theme="muted">
                              Suggestion automatique
                            </Typography>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateField(
                                  "description",
                                  generateTournamentDescription({
                                    name: formData.name,
                                    game: formData.game,
                                    platform: formData.platform,
                                    maxParticipants: formData.maxParticipants,
                                    startDate: formData.startDate,
                                    cashprize: formData.cashprize,
                                  })
                                )
                              }
                            >
                              Utiliser la suggestion
                            </Button>
                          </div>
                          <Typography variant="caption2" className="mt-2 block">
                            {generateTournamentDescription({
                              name: formData.name,
                              game: formData.game,
                              platform: formData.platform,
                              maxParticipants: formData.maxParticipants,
                              startDate: formData.startDate,
                              cashprize: formData.cashprize,
                            })}
                          </Typography>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <Typography variant="h2">Aperçu</Typography>
                    <Typography variant="body-sm" theme="muted">
                      Vérifiez l'apparence et les informations avant de créer
                    </Typography>
                  </div>
                  <div className="relative rounded-xl overflow-hidden border">
                    <div className="h-40 bg-gradient-to-r from-primary/20 to-primary/10 relative">
                      {formData.coverImage ? (
                        <img
                          src={formData.coverImage}
                          alt="Couverture"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className="h-16 w-16 text-primary/30" />
                        </div>
                      )}
                      <div className="absolute -bottom-10 left-6">
                        <div className="relative">
                          {formData.profileImage ? (
                            <img
                              src={formData.profileImage}
                              alt="Profil"
                              className="w-20 h-20 rounded-full border-4 border-background object-cover"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full border-4 border-background bg-primary/10 flex items-center justify-center">
                              <ImageIcon className="h-10 w-10 text-primary" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="pt-12 p-6">
                      <Typography variant="h3" weight="bold" className="mb-2">
                        {getTournamentPreviewData(formData).title}
                      </Typography>
                      {(formData.description.trim()
                        ? formData.description
                        : generateTournamentDescription({
                            name: formData.name,
                            game: formData.game,
                            platform: formData.platform,
                            maxParticipants: formData.maxParticipants,
                            startDate: formData.startDate,
                            cashprize: formData.cashprize,
                          })) && (
                        <Typography variant="body-base" theme="muted" className="mb-4">
                          {formData.description.trim()
                            ? formData.description
                            : generateTournamentDescription({
                                name: formData.name,
                                game: formData.game,
                                platform: formData.platform,
                                maxParticipants: formData.maxParticipants,
                                startDate: formData.startDate,
                                cashprize: formData.cashprize,
                              })}
                        </Typography>
                      )}
                      <div className="flex flex-wrap gap-3">
                        {getTournamentPreviewData(formData).badges.map((b, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center px-2.5 py-1 rounded border ${
                              b.variant === "outline"
                                ? "border-border"
                                : b.variant === "secondary"
                                ? "bg-secondary text-foreground border-transparent"
                                : "bg-primary text-primary-foreground border-transparent"
                            }`}
                          >
                            {b.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border">
                      <div className="text-sm text-muted-foreground">Plateforme</div>
                      <div className="font-medium">{formData.platform || "Non spécifié"}</div>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <div className="text-sm text-muted-foreground">Participants</div>
                      <div className="font-medium">{formData.maxParticipants}</div>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <div className="text-sm text-muted-foreground">Cashprize</div>
                      <div className="font-medium">{formData.cashprize} GTC</div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>

        <CardFooter className="bg-secondary/10 p-6 flex justify-between border-t border-border/50">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={step === 1 || isSubmitting}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>

          {step < steps.length ? (
            <Button
              onClick={nextStep}
              className="gap-2 bg-primary hover:bg-primary/90"
              disabled={step === 2 && (!formData.name.trim() || !formData.game.trim() || !formData.startDate.trim())}
              title={step === 2 && (!formData.name.trim() || !formData.game.trim() || !formData.startDate.trim()) ? "Renseignez le nom, le jeu et la date" : undefined}
            >
              Suivant
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? "Création..." : "Confirmer et Créer"}
              {!isSubmitting && <CheckCircle2 className="h-4 w-4" />}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
