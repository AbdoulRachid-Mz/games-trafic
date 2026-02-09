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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Demande d'adhésion
          </DialogTitle>
          <DialogDescription>
            Remplissez les informations essentielles pour rejoindre "{tournament.name}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tournament Preview */}
          <Card className="bg-muted/30 border-none">
            <CardContent className="p-3 flex items-center gap-3">
              {tournament.profileImage ? (
                <Avatar className="h-10 w-10">
                  <AvatarImage src={tournament.profileImage} />
                  <AvatarFallback><Trophy className="h-5 w-5" /></AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
              )}
              <div>
                <Typography variant="body-sm" weight="semibold">{tournament.name}</Typography>
                <Badge variant="outline" className="text-[10px] h-4 py-0">{tournament.game}</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="flex items-center gap-2 text-xs">
                <User className="h-3 w-3" /> Nom affiché *
              </Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => handleChange("displayName", e.target.value)}
                placeholder="Ex: ProGamer99"
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gameTag" className="flex items-center gap-2 text-xs">
                <Target className="h-3 w-3" /> ID de jeu *
              </Label>
              <Input
                id="gameTag"
                value={formData.gameTag}
                onChange={(e) => handleChange("gameTag", e.target.value)}
                placeholder="Ex: User#1234"
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gameLevel" className="flex items-center gap-2 text-xs">
                <Crown className="h-3 w-3" /> Niveau
              </Label>
              <Input
                id="gameLevel"
                value={formData.gameLevel}
                onChange={(e) => handleChange("gameLevel", e.target.value)}
                placeholder="Ex: Expert, Pro"
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone" className="flex items-center gap-2 text-xs">
                <Phone className="h-3 w-3" /> Téléphone
              </Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => handleChange("contactPhone", e.target.value)}
                placeholder="+33..."
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs">Notes (Optionnel)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Expérience, équipe, etc."
              rows={2}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="h-9"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !formData.displayName || !formData.gameTag}
            className="h-9 px-8"
          >
            {submitting ? "Envoi..." : "Rejoindre"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}