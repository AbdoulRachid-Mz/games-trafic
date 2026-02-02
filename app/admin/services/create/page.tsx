"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { createService } from "@/actions/services";
import { ArrowLeft } from "lucide-react";
import { Typography } from "@/components/ui/typography";
import { useAuth } from "@/hooks/use-auth";

export default function CreateServicePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [images, setImages] = useState("");
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    if (!user?.id) {
      toast.error("Vous devez être connecté");
      return;
    }

    setCreating(true);
    try {
      const imagesArray = images
        .split(",")
        .map((img) => img.trim())
        .filter((img) => img);

      await createService({
        adminId: user.id,
        title,
        description,
        icon: icon || undefined,
        images: imagesArray.length > 0 ? imagesArray : undefined,
        isActive,
        isDeleted: false,
      });

      toast.success("Service créé avec succès");
      router.push("/admin/services");
    } catch (error) {
      console.error("Error creating service:", error);
      toast.error("Erreur lors de la création du service");
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
            Créer un service
          </Typography>
          <Typography variant="body-base" theme="muted">
            Ajoutez un nouveau service à votre plateforme
          </Typography>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations du service</CardTitle>
            <CardDescription>Remplissez les détails du service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Titre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nom du service"
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
                placeholder="Décrivez le service en détail..."
                rows={6}
                required
              />
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <Label htmlFor="icon">Icône (optionnel)</Label>
              <Input
                id="icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="URL de l'icône ou emoji"
              />
              <p className="text-xs text-muted-foreground">
                URL d'une icône ou un emoji (ex: 🚀)
              </p>
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label htmlFor="images">Images (optionnel)</Label>
              <Textarea
                id="images"
                value={images}
                onChange={(e) => setImages(e.target.value)}
                placeholder="URL1, URL2, URL3..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                URLs séparées par des virgules
              </p>
            </div>

            {/* Active */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Service actif</Label>
                <p className="text-xs text-muted-foreground">
                  Le service sera visible sur le site
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
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
                {creating ? "Création..." : "Créer le service"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
