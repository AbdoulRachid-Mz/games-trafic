"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createApiKey } from "@/actions/api-keys";
import { toast } from "sonner";
import { Copy, Check, Loader2, Key } from "lucide-react";

interface ApiKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function ApiKeyDialog({ isOpen, onClose, userId }: ApiKeyDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"USER" | "APPLICATION" | "SERVICE">("USER");
  const [rateLimitPerHour, setRateLimitPerHour] = useState(1000);
  const [rateLimitPerDay, setRateLimitPerDay] = useState(10000);
  const [isPending, setIsPending] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const result = await createApiKey(userId, {
        name,
        type,
        rateLimitPerHour,
        rateLimitPerDay,
        permissions: ["*"], // Par défaut, tout pour le test
      });
      setGeneratedKey(result.key);
      toast.success("Clé API générée avec succès");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la génération");
    } finally {
      setIsPending(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.info("Clé copiée dans le presse-papier");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Générer une nouvelle clé API
          </DialogTitle>
          <DialogDescription>
            {generatedKey 
              ? "Veuillez copier cette clé maintenant. Elle ne sera plus affichée par la suite."
              : "Définissez les paramètres de la nouvelle clé d'accès."}
          </DialogDescription>
        </DialogHeader>

        {generatedKey ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={generatedKey}
                className="font-mono text-xs bg-muted"
              />
              <Button size="icon" variant="outline" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-destructive font-medium flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-destructive" />
              Attention: Une fois ce dialogue fermé, vous ne pourrez plus voir cette clé.
            </p>
            <Button className="w-full" onClick={onClose}>J'ai bien noté la clé</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la clé</Label>
              <Input
                id="name"
                placeholder="ex: Client Web Mobile"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type d'acteur</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Utilisateur</SelectItem>
                    <SelectItem value="APPLICATION">Application</SelectItem>
                    <SelectItem value="SERVICE">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Niveau de permissions</Label>
                <Select defaultValue="full">
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Toutes (Accès total)</SelectItem>
                    <SelectItem value="read">Lecture seule</SelectItem>
                    <SelectItem value="write">Écriture seule</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="limit-hour">Limite / Heure</Label>
                <Input
                  id="limit-hour"
                  type="number"
                  value={rateLimitPerHour}
                  onChange={(e) => setRateLimitPerHour(parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limit-day">Limite / Jour</Label>
                <Input
                  id="limit-day"
                  type="number"
                  value={rateLimitPerDay}
                  onChange={(e) => setRateLimitPerDay(parseInt(e.target.value))}
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
                Annuler
              </Button>
              <Button type="submit" disabled={isPending || !name}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Générer la clé
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
