// components/pages/tournaments/membership-request-dialog.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Trophy,
  Gamepad2,
  User,
  Mail,
  Phone,
  Target,
  Crown
} from "lucide-react";
import type { TournamentWithRelations, User as UserType } from "@/database/schema";
import { Badge } from "@/components/ui/badge";

interface MembershipRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: TournamentWithRelations;
  user: UserType | null;
  onSubmit: (data: any) => void;
}

export function MembershipRequestDialog({
  open,
  onOpenChange,
  tournament,
  user,
  onSubmit,
}: MembershipRequestDialogProps) {
  const [formData, setFormData] = useState({
    displayName: user?.username || user?.fullName || "",
    gameTag: "",
    contactEmail: user?.email || "",
    contactPhone: "",
    gameLevel: "",
    gameRank: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Demande d'adhésion
          </DialogTitle>
          <DialogDescription>
            Remplissez le formulaire pour demander à rejoindre le tournoi "{tournament.name}".
            Votre demande sera examinée par les organisateurs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tournament Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {tournament.profileImage ? (
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={tournament.profileImage} />
                    <AvatarFallback>
                      <Trophy className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div>
                  <Typography variant="body-base" weight="semibold">
                    {tournament.name}
                  </Typography>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <Gamepad2 className="h-3 w-3 mr-1" />
                      {tournament.game}
                    </Badge>
                    {tournament.verified && (
                      <Badge className="bg-green-500">
                        Vérifié
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Info */}
          <Card>
            <CardContent className="p-4">
              <Typography variant="body-base" weight="semibold" className="mb-3">
                Vos informations
              </Typography>
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.image || undefined} />
                  <AvatarFallback>
                    {user?.username?.[0] || user?.fullName?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Typography variant="body-sm" weight="medium">
                    {user?.fullName || user?.username}
                  </Typography>
                  <Typography variant="caption2" theme="muted">
                    {user?.email}
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nom affiché *
              </Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => handleChange("displayName", e.target.value)}
                placeholder="Votre nom dans le tournoi"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gameTag" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Tag de jeu *
              </Label>
              <Input
                id="gameTag"
                value={formData.gameTag}
                onChange={(e) => handleChange("gameTag", e.target.value)}
                placeholder="Ex: Player#1234"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email de contact
              </Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleChange("contactEmail", e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Téléphone
              </Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => handleChange("contactPhone", e.target.value)}
                placeholder="+33 1 23 45 67 89"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gameLevel" className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Niveau dans le jeu
              </Label>
              <Input
                id="gameLevel"
                value={formData.gameLevel}
                onChange={(e) => handleChange("gameLevel", e.target.value)}
                placeholder="Ex: Expert, Pro, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gameRank">Classement dans le jeu</Label>
              <Input
                id="gameRank"
                value={formData.gameRank}
                onChange={(e) => handleChange("gameRank", e.target.value)}
                placeholder="Ex: Top 500, Diamond, etc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes supplémentaires</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Informations complémentaires, expérience, équipe, etc."
              rows={3}
            />
          </div>

          {/* Terms */}
          <div className="bg-muted/30 rounded-lg p-4">
            <Typography variant="body-sm" className="text-muted-foreground">
              En soumettant cette demande, vous acceptez les règles du tournoi et vous engagez à respecter le code de conduite.
              Les organisateurs examineront votre demande sous 48h. Vous serez notifié par email de la décision.
            </Typography>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !formData.displayName || !formData.gameTag}
          >
            {submitting ? "Envoi en cours..." : "Envoyer la demande"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}