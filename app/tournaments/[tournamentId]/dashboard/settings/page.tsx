"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { getTournamentById, updateTournament } from "@/actions/tournaments";
// import { getTournamentById, updateTournament } from "@/actions/tournanents";

export default function TournamentDashboardSettingsPage() {
  const params = useParams();
  const [tournament, setTournament] = useState<any>(null);
  const [form, setForm] = useState({
    visibility: "PUBLIC",
    inviteOnly: false as boolean,
    requiresAccessCode: false as boolean,
    accessCode: "" as string,
    contactEmail: "" as string,
    contactPhone: "" as string,
    discordServer: "" as string,
    whatsappGroup: "" as string,
  });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    load();
  }, [params.tournamentId]);

  const load = async () => {
    const t = await getTournamentById(params.tournamentId as string);
    setTournament(t);
    setForm({
      visibility: t?.visibility ?? "PUBLIC",
      inviteOnly: t?.inviteOnly ?? false,
      requiresAccessCode: t?.requiresAccessCode ?? false,
      accessCode: t?.accessCode ?? "",
      contactEmail: t?.contactEmail ?? "",
      contactPhone: t?.contactPhone ?? "",
      discordServer: t?.discordServer ?? "",
      whatsappGroup: t?.whatsappGroup ?? "",
    });
  };

  const updateField = (k: keyof typeof form, v: any) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    startTransition(async () => {
      await updateTournament(
        params.tournamentId as string,
        {
          visibility: form.visibility,
          inviteOnly: form.inviteOnly,
          requiresAccessCode: form.requiresAccessCode,
          accessCode: form.accessCode || null,
          contactEmail: form.contactEmail || null,
          contactPhone: form.contactPhone || null,
          discordServer: form.discordServer || null,
          whatsappGroup: form.whatsappGroup || null,
        } as any
      );
    });
  };

  return (
    <div className="space-y-6">
      <Typography variant="h2" weight="bold">
        Paramètres
      </Typography>
      <Card>
        <CardHeader>
          <CardTitle>Visibilité et accès</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Visibilité</Label>
              <Select
                value={form.visibility}
                onValueChange={(v) => updateField("visibility", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Visibilité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Public</SelectItem>
                  <SelectItem value="PRIVATE">Privé</SelectItem>
                  <SelectItem value="UNLISTED">Non listé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Code d'accès</Label>
              <Input
                value={form.accessCode}
                onChange={(e) => updateField("accessCode", e.target.value)}
                placeholder="Optionnel"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={form.inviteOnly ? "default" : "outline"}
              onClick={() => updateField("inviteOnly", !form.inviteOnly)}
            >
              Accès sur invitation
            </Button>
            <Button
              variant={form.requiresAccessCode ? "default" : "outline"}
              onClick={() =>
                updateField("requiresAccessCode", !form.requiresAccessCode)
              }
            >
              Code requis
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={form.contactEmail}
              onChange={(e) => updateField("contactEmail", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Téléphone</Label>
            <Input
              value={form.contactPhone}
              onChange={(e) => updateField("contactPhone", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Discord</Label>
            <Input
              value={form.discordServer}
              onChange={(e) => updateField("discordServer", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp</Label>
            <Input
              value={form.whatsappGroup}
              onChange={(e) => updateField("whatsappGroup", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending}>
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
