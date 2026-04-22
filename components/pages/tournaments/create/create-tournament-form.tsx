"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Gamepad2,
  Users,
  Calendar,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Image as ImageIcon,
  Shield,
  MessageCircle,
  Eye,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";

import type { NewTournament, NewTournamentEdition } from "@/database/schema";
import { platformEnum } from "@/database/schema";
import { useAuthContext } from "@/contexts/auth-context";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import { generateTournamentDescription } from "@/lib/tournaments/description";
import { getTournamentPreviewData } from "@/lib/tournaments/preview";
import {
  createTournament,
  createTournamentEdition,
} from "@/actions/tournaments";
import Image from "next/image";

// ─── Types ──────────────────────────────────────────────────────────────────
interface TournamentFormData {
  // Identité
  name: string;
  description: string;
  profileImage: string;
  coverImage: string;

  // Jeu & Config
  game: string;
  platform: (typeof platformEnum.enumValues)[number] | "";
  gameMode: string;

  // Participants
  maxParticipants: number;
  minParticipants: number;
  startDate: string;

  // Visibilité
  isPublic: boolean;
  inviteOnly: boolean;
  requiresAccessCode: boolean;
  accessCode: string;

  // Contact
  contactEmail: string;
  contactPhone: string;
  discordServer: string;
  whatsappGroup: string;

  // Édition
  addFirstEdition: boolean;
  editionName: string;
  competitionType: string;
  competitionMode: string;
  seedMethod: string;
  entryFee: number;
}

const steps = [
  { id: 1, title: "Identité", icon: Gamepad2, description: "Nom, Jeu & Images" },
  { id: 2, title: "Accès", icon: Shield, description: "Visibilité & Contact" },
  { id: 3, title: "Édition", icon: Calendar, description: "Format & Config" },
  { id: 4, title: "Aperçu", icon: CheckCircle2, description: "Vérification" },
];

export function CreateTournamentForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthContext();
  const router = useRouter();
  const [formData, setFormData] = useState<TournamentFormData>({
    name: user ? `Tournoi de ${user?.fullName || ""}` : "",
    description: "",
    profileImage: "/icons/tournament-500.png",
    coverImage: "/images/icons/background/bg-controller.jpg",
    game: "EOOTBALL PES",
    platform: "MOBILE",
    gameMode: "1v1",
    maxParticipants: 32,
    minParticipants: 4,
    startDate: "",
    isPublic: true,
    inviteOnly: false,
    requiresAccessCode: false,
    accessCode: "",
    contactEmail: user?.email || "",
    contactPhone: (user?.countryCode ?? "") + (user?.phoneNumber ?? "") || "",
    discordServer: "",
    whatsappGroup: "",
    addFirstEdition: true,
    editionName: "",
    competitionType: "LDC",
    competitionMode: "AUTO",
    seedMethod: "RANDOM",
    entryFee: 0,
  });

  const updateField = <K extends keyof TournamentFormData>(
    field: K,
    value: TournamentFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, steps.length));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const canAdvanceStep2 =
    formData.name.trim() && formData.game.trim() && formData.startDate.trim();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!user?.id) {
        throw new Error("Utilisateur non authentifié");
      }
      if (!formData.name || !formData.game || !formData.startDate) {
        throw new Error("Champs requis manquants");
      }

      const platformValue =
        formData.platform && platformEnum.enumValues.includes(formData.platform)
          ? formData.platform
          : undefined;

      // Slug auto-généré
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const tournamentData: NewTournament = {
        name: formData.name,
        slug,
        description:
          formData.description ||
          generateTournamentDescription({
            name: formData.name,
            game: formData.game,
            platform: formData.platform,
            maxParticipants: formData.maxParticipants,
            startDate: formData.startDate,
            cashprize: 0,
          }),
        game: formData.game,
        platform: platformValue ?? null,
        gameMode: formData.gameMode || null,
        maxParticipantsPerEdition: formData.maxParticipants,
        minParticipants: formData.minParticipants,
        visibility: formData.isPublic ? "PUBLIC" : "PRIVATE",
        inviteOnly: formData.inviteOnly,
        requiresAccessCode: formData.requiresAccessCode,
        accessCode: formData.requiresAccessCode ? formData.accessCode : null,
        contactEmail: formData.contactEmail || null,
        contactPhone: formData.contactPhone || null,
        discordServer: formData.discordServer || null,
        whatsappGroup: formData.whatsappGroup || null,
        status: "UPCOMING",
        organizerId: user.id,
        profileImage: formData.profileImage || null,
        coverImage: formData.coverImage || null,
      };

      const tournament = await createTournament({
        ...tournamentData,
        profileImage: tournamentData.profileImage ?? null,
        platform: tournamentData.platform || null,
        visibility: tournamentData.visibility ?? "PUBLIC",
      });

      // 1ère édition
      const editionData: any = {
        tournamentId: tournament.id,
        editionNumber: 1,
        name: formData.editionName || `${tournament.name} - Édition 1`,
        startDate: new Date(formData.startDate),
        maxParticipants: formData.maxParticipants,
        status: "UPCOMING",
        entryFee: formData.entryFee.toString(),
        editionConfig: {
          checkinRequired: false,
          autoStart: true,
          seedMethod: formData.seedMethod,
          competitionType: formData.competitionType,
          competitionMode: formData.competitionMode,
          tiebreakerRules: {}
        }
      };

      await createTournamentEdition(editionData);
      router.push("/tournaments");
    } catch (error) {
      console.error("Erreur lors de la création du tournoi:", error);
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
                    className={`text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}
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
        <CardContent className="p-6 sm:p-8 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {/* ── Step 1: Identité & Images ── */}
              {step === 1 && (
                <div className="space-y-8">
                  {/* Images Section */}
                  <div className="relative mb-12">
                    <div className="space-y-2">
                      <Label>Image de couverture</Label>
                      <AdvancedUpload
                        value={formData.coverImage}
                        onChange={(url) => updateField("coverImage", url)}
                        uploadPath="tournaments/cover"
                        uploadPreset="games_trafics"
                        previewClassName="min-h-[180px]"
                        showInternalSelection
                        internalImagesFolder="images/tournaments/cover"
                      />
                    </div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                      <AdvancedUpload
                        value={formData.profileImage}
                        onChange={(url) => updateField("profileImage", url)}
                        uploadPath="tournaments/profile"
                        uploadPreset="games_trafics"
                        isRounded
                        previewClassName="w-32 h-32"
                        showInternalSelection
                        internalImagesFolder="images/tournaments/profile"
                      />
                    </div>
                  </div>

                  <div className="pt-8 space-y-6">
                    {/* Nom */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom du tournoi *</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Tournoi Clash Royale - Édition Hiver"
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        className="text-lg"
                      />
                    </div>

                    {/* Jeu & Plateforme */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Jeu *</Label>
                        <Select
                          value={formData.game}
                          onValueChange={(val) => updateField("game", val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir un jeu" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EFOOTBALL PES">EA Football PES</SelectItem>
                            <SelectItem value="FIFA 24">EA FIFA</SelectItem>
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
                          onValueChange={(val) =>
                            updateField("platform", val as any)
                          }
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

                    {/* Mode & Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Mode de jeu</Label>
                        <Select
                          value={formData.gameMode}
                          onValueChange={(val) => updateField("gameMode", val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1v1">1 vs 1</SelectItem>
                            <SelectItem value="2v2">2 vs 2</SelectItem>
                            <SelectItem value="3v3">3 vs 3</SelectItem>
                            <SelectItem value="5v5">5 vs 5</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Date de début *</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="datetime-local"
                            className="pl-9"
                            value={formData.startDate}
                            onChange={(e) => updateField("startDate", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="desc">Description</Label>
                      <Textarea
                        id="desc"
                        placeholder="Décrivez votre tournoi..."
                        className="min-h-[100px]"
                        value={formData.description}
                        onChange={(e) => updateField("description", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 2: Visibilité & Contact ── */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <Typography variant="h3" weight="bold" className="mb-1">
                      Visibilité & Accès
                    </Typography>
                    <Typography variant="body-sm" theme="muted">
                      Configurez qui peut voir et rejoindre votre tournoi
                    </Typography>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Visibility toggles */}
                    <div className="space-y-4 p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Eye className="h-5 w-5 text-primary" />
                        <Typography variant="body-base" weight="bold">
                          Visibilité
                        </Typography>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Tournoi public</Label>
                          <p className="text-xs text-muted-foreground">
                            Visible par tous
                          </p>
                        </div>
                        <Switch
                          checked={formData.isPublic}
                          onCheckedChange={(v) => updateField("isPublic", v)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Sur invitation</Label>
                          <p className="text-xs text-muted-foreground">
                            Seuls les invités peuvent rejoindre
                          </p>
                        </div>
                        <Switch
                          checked={formData.inviteOnly}
                          onCheckedChange={(v) => updateField("inviteOnly", v)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Code d&apos;accès</Label>
                          <p className="text-xs text-muted-foreground">
                            Exiger un code pour rejoindre
                          </p>
                        </div>
                        <Switch
                          checked={formData.requiresAccessCode}
                          onCheckedChange={(v) =>
                            updateField("requiresAccessCode", v)
                          }
                        />
                      </div>

                      {formData.requiresAccessCode && (
                        <div className="space-y-2 pt-2">
                          <Label className="text-sm">Code</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              className="pl-9"
                              placeholder="Code d'accès"
                              value={formData.accessCode}
                              onChange={(e) =>
                                updateField("accessCode", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Contact */}
                    <div className="space-y-4 p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <MessageCircle className="h-5 w-5 text-primary" />
                        <Typography variant="body-base" weight="bold">
                          Contact
                        </Typography>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-sm">Email</Label>
                          <Input
                            type="email"
                            placeholder="contact@example.com"
                            value={formData.contactEmail}
                            onChange={(e) =>
                              updateField("contactEmail", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm">Téléphone</Label>
                          <Input
                            type="tel"
                            placeholder="+33 6 12 34 56 78"
                            value={formData.contactPhone}
                            onChange={(e) =>
                              updateField("contactPhone", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm">Discord</Label>
                          <Input
                            placeholder="https://discord.gg/..."
                            value={formData.discordServer}
                            onChange={(e) =>
                              updateField("discordServer", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm">WhatsApp</Label>
                          <Input
                            placeholder="https://chat.whatsapp.com/..."
                            value={formData.whatsappGroup}
                            onChange={(e) =>
                              updateField("whatsappGroup", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              //  </div>
              )}

              {/* ── Step 3: Édition ── */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <Typography variant="h3" weight="bold" className="mb-1">
                      Configuration de l'Édition
                    </Typography>
                    <Typography variant="body-sm" theme="muted">
                      Paramètres de la première édition du tournoi
                    </Typography>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="editionName">Nom de l'édition</Label>
                      <Input
                        id="editionName"
                        placeholder={`${formData.name} - Édition 1`}
                        value={formData.editionName}
                        onChange={(e) => updateField("editionName", e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type de compétition</Label>
                        <Select
                          value={formData.competitionType}
                          onValueChange={(val) => updateField("competitionType", val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LDC">Champions League (LDC)</SelectItem>
                            <SelectItem value="CHAMPIONSHIP">Championnat (Ligue)</SelectItem>
                            <SelectItem value="CUP">Coupe (Élimination directe)</SelectItem>
                            <SelectItem value="SWISS">Rondes Suisses</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Mode d'organisation</Label>
                        <Select
                          value={formData.competitionMode}
                          onValueChange={(val) => updateField("competitionMode", val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AUTO">Automatique (Wizard)</SelectItem>
                            <SelectItem value="MANUAL">Manuel (Expert)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Méthode de Tirage (Seed)</Label>
                        <Select
                          value={formData.seedMethod}
                          onValueChange={(val) => updateField("seedMethod", val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tirage" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="RANDOM">Aléatoire</SelectItem>
                            <SelectItem value="MANUAL">Manuel</SelectItem>
                            <SelectItem value="RANKED">Par Rang / Elo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {!formData.isPublic && (
                        <div className="space-y-2">
                          <Label htmlFor="entryFee">Prix d'entrée (GTC)</Label>
                          <Input
                            id="entryFee"
                            type="number"
                            min="0"
                            value={formData.entryFee}
                            onChange={(e) => updateField("entryFee", parseInt(e.target.value) || 0)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 4: Aperçu ── */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <Typography variant="h2">Aperçu</Typography>
                    <Typography variant="body-sm" theme="muted">
                      Vérifiez les informations avant de créer
                    </Typography>
                  </div>

                  {/* Carte preview */}
                  <div className="relative rounded-xl overflow-hidden border">
                    <div className="h-40 bg-gradient-to-r from-primary/20 to-primary/10 relative">
                      {formData.coverImage ? (
                        <Image
                          src={formData.coverImage}
                          fill={true}
                          alt="Couverture"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className="h-16 w-16 text-primary/30" />
                        </div>
                      )}
                      <div className="absolute -bottom-10 left-6">
                        {formData.profileImage ? (
                          <Image
                            src={formData.profileImage}
                            alt="Profil"
                            width={80}
                            height={80}
                            className="w-20 h-20 rounded-full border-4 border-background object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full border-4 border-background bg-primary/10 flex items-center justify-center">
                            <ImageIcon className="h-10 w-10 text-primary" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="pt-12 p-6">
                      <Typography variant="h3" weight="bold" className="mb-2">
                        {formData.editionName || getTournamentPreviewData(formData).title}
                      </Typography>
                      {(formData.description.trim() ||
                        formData.name.trim()) && (
                        <Typography
                          variant="body-base"
                          theme="muted"
                          className="mb-4"
                        >
                          {formData.description.trim() ||
                            generateTournamentDescription({
                              name: formData.name,
                              game: formData.game,
                              platform: formData.platform,
                              maxParticipants: formData.maxParticipants,
                              startDate: formData.startDate,
                              cashprize: 0,
                            })}
                        </Typography>
                      )}
                      <div className="flex flex-wrap gap-3">
                        {getTournamentPreviewData(formData).badges.map(
                          (b, i) => (
                            <span
                              key={i}
                              className={`inline-flex items-center px-2.5 py-1 rounded border text-xs ${
                                b.variant === "outline"
                                  ? "border-border"
                                  : b.variant === "secondary"
                                    ? "bg-secondary text-foreground border-transparent"
                                    : "bg-primary text-primary-foreground border-transparent"
                              }`}
                            >
                              {b.label}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Summary grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg border text-center">
                      <div className="text-xs text-muted-foreground">
                        Plateforme
                      </div>
                      <div className="font-medium text-sm mt-1">
                        {formData.platform || "—"}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border text-center">
                      <div className="text-xs text-muted-foreground">Mode</div>
                      <div className="font-medium text-sm mt-1">
                        {formData.gameMode || "—"}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border text-center">
                      <div className="text-xs text-muted-foreground">
                        Participants
                      </div>
                      <div className="font-medium text-sm mt-1">
                        {formData.maxParticipants}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border text-center">
                      <div className="text-xs text-muted-foreground">
                        Visibilité
                      </div>
                      <div className="font-medium text-sm mt-1">
                        {formData.isPublic ? "Public" : "Privé"}
                        {formData.inviteOnly && " · Invitation"}
                      </div>
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
              disabled={step === 2 && !canAdvanceStep2}
              title={
                step === 2 && !canAdvanceStep2
                  ? "Renseignez le nom, le jeu et la date"
                  : undefined
              }
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
