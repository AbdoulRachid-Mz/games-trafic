"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { createClaim } from "@/actions/claims";
import { ArrowLeft, Upload, X } from "lucide-react";
import { Typography } from "@/components/ui/typography";

export default function CreateClaimPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  // Form state
  const [userId, setUserId] = useState("");
  const [type, setType] = useState("OTHER");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [evidence, setEvidence] = useState("");
  const [image, setImage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId || !title || !description) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    setCreating(true);
    try {
      await createClaim({
        userId,
        type,
        title,
        description,
        transactionId: transactionId || undefined,
        evidence: evidence || undefined,
        image: image || undefined,
        status: "PENDING",
        isDeleted: false,
      });

      toast.success("Réclamation créée avec succès");
      router.push("/admin/claims");
    } catch (error) {
      console.error("Error creating claim:", error);
      toast.error("Erreur lors de la création de la réclamation");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <Typography variant="h1" weight="bold" className="mb-1">
            Créer une réclamation
          </Typography>
          <Typography variant="body-base" theme="muted">
            Enregistrez une nouvelle réclamation utilisateur
          </Typography>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations de la réclamation</CardTitle>
            <CardDescription>
              Remplissez les détails de la réclamation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User ID */}
            <div className="space-y-2">
              <Label htmlFor="userId">
                ID Utilisateur <span className="text-destructive">*</span>
              </Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="user-id-123"
                required
              />
              <p className="text-xs text-muted-foreground">
                L'identifiant de l'utilisateur qui fait la réclamation
              </p>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Type de réclamation <span className="text-destructive">*</span>
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAYMENT">Paiement</SelectItem>
                  <SelectItem value="DELIVERY">Livraison</SelectItem>
                  <SelectItem value="PRODUCT">Produit</SelectItem>
                  <SelectItem value="SERVICE">Service</SelectItem>
                  <SelectItem value="ACCOUNT">Compte</SelectItem>
                  <SelectItem value="OTHER">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Titre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Résumé de la réclamation"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez la réclamation en détail..."
                rows={6}
                required
              />
            </div>

            {/* Transaction ID (optional) */}
            <div className="space-y-2">
              <Label htmlFor="transactionId">ID Transaction (optionnel)</Label>
              <Input
                id="transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="transaction-id-123"
              />
              <p className="text-xs text-muted-foreground">
                Si la réclamation concerne une transaction spécifique
              </p>
            </div>

            {/* Evidence (optional) */}
            <div className="space-y-2">
              <Label htmlFor="evidence">Preuves (optionnel)</Label>
              <Textarea
                id="evidence"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="Ajoutez des preuves ou des détails supplémentaires..."
                rows={4}
              />
            </div>

            {/* Image URL (optional) */}
            <div className="space-y-2">
              <Label htmlFor="image">URL Image (optionnel)</Label>
              <Input
                id="image"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                URL d'une image de preuve
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={creating}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Création..." : "Créer la réclamation"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
