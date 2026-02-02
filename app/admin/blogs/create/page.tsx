"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { createBlog } from "@/actions/blogs";
import { ArrowLeft, Eye } from "lucide-react";
import { Typography } from "@/components/ui/typography";
import { useAuth } from "@/hooks/use-auth";
import { RichTextEditor } from "@/components/shared/rich-text-editor";

export default function CreateBlogPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState("");
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !content) {
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

      await createBlog({
        authorId: user.id,
        title,
        content,
        images: imagesArray.length > 0 ? imagesArray : undefined,
        isActive,
        isDeleted: false,
      });

      toast.success("Blog créé avec succès");
      router.push("/admin/blogs");
    } catch (error) {
      console.error("Error creating blog:", error);
      toast.error("Erreur lors de la création du blog");
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
            Créer un article
          </Typography>
          <Typography variant="body-base" theme="muted">
            Rédigez un nouvel article de blog
          </Typography>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contenu de l'article</CardTitle>
                <CardDescription>
                  Rédigez le contenu principal de votre article
                </CardDescription>
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
                    placeholder="Titre de l'article"
                    required
                    className="text-2xl font-bold"
                  />
                </div>

                {/* Editor with Preview */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="edit">Éditer</TabsTrigger>
                    <TabsTrigger value="preview">
                      <Eye className="h-4 w-4 mr-2" />
                      Aperçu
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="edit" className="mt-4">
                    <RichTextEditor
                      content={content}
                      onChange={setContent}
                      placeholder="Écrivez votre article ici..."
                    />
                  </TabsContent>

                  <TabsContent value="preview" className="mt-4">
                    <Card className="p-6">
                      <Typography variant="h1" weight="bold" className="mb-6">
                        {title || "Titre de l'article"}
                      </Typography>
                      <div
                        className="prose prose-lg max-w-none"
                        dangerouslySetInnerHTML={{
                          __html:
                            content || "<p>Votre contenu apparaîtra ici...</p>",
                        }}
                      />
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Publication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Article actif</Label>
                    <p className="text-xs text-muted-foreground">
                      Visible sur le site
                    </p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>

                <div className="pt-4 border-t space-y-3">
                  <Button type="submit" className="w-full" disabled={creating}>
                    {creating ? "Création..." : "Publier l'article"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.back()}
                    disabled={creating}
                  >
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Featured Image */}
            <Card>
              <CardHeader>
                <CardTitle>Image à la une</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="images">URLs des images</Label>
                  <Input
                    id="images"
                    value={images}
                    onChange={(e) => setImages(e.target.value)}
                    placeholder="URL1, URL2, URL3..."
                  />
                  <p className="text-xs text-muted-foreground">
                    URLs séparées par des virgules. La première sera l'image à
                    la une.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm">💡 Conseils</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2 text-muted-foreground">
                <p>• Utilisez des titres pour structurer votre article</p>
                <p>• Ajoutez des images pour illustrer vos propos</p>
                <p>• Prévisualisez avant de publier</p>
                <p>• Un bon titre attire l'attention</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
