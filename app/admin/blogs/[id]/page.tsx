"use client";

import { useState, useEffect } from "react";
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
import { getBlogById, updateBlog } from "@/actions/blogs";
import { ArrowLeft, Eye } from "lucide-react";
import { Typography } from "@/components/ui/typography";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditBlogPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadBlog();
  }, [params.id]);

  const loadBlog = async () => {
    try {
      const blog = await getBlogById(params.id);
      if (!blog) {
        toast.error("Blog non trouvé");
        router.push("/admin/blogs");
        return;
      }

      setTitle(blog.title);
      setContent(blog.content);
      setImages(blog.images?.join(", ") || "");
      setIsActive(blog?.isActive || true);
    } catch (error) {
      console.error("Error loading blog:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !content) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    setUpdating(true);
    try {
      const imagesArray = images
        .split(",")
        .map((img) => img.trim())
        .filter((img) => img);

      await updateBlog(params.id, {
        title,
        content,
        images: imagesArray.length > 0 ? imagesArray : undefined,
        isActive,
      });

      toast.success("Blog mis à jour avec succès");
      router.push("/admin/blogs");
    } catch (error) {
      console.error("Error updating blog:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <Typography variant="h1" weight="bold" className="mb-1">
            Modifier l'article
          </Typography>
          <Typography variant="body-base" theme="muted">
            Modifiez le contenu de votre article
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
                  Modifiez le contenu de votre article
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
                  <Button type="submit" className="w-full" disabled={updating}>
                    {updating ? "Mise à jour..." : "Mettre à jour"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.back()}
                    disabled={updating}
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
          </div>
        </div>
      </form>
    </div>
  );
}
