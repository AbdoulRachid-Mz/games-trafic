// app/admin/media/page.tsx
"use client";

import React, { useState } from "react";
import { useMedias, useMediaStats, useDeleteMedia } from "@/hooks/use-media";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import {
  FileIcon,
  ImageIcon,
  VideoIcon,
  MusicIcon,
  Search,
  MoreVertical,
  Trash2,
  RefreshCw,
  ExternalLink,
  HardDrive
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";

export default function AdminMediaPage() {
  const [search, setSearch] = useState("");
  const { data: mediaData, isLoading, refetch } = useMedias({
    pagination: { page: 1, limit: 50 }
  });
  const { data: stats } = useMediaStats();
  const deleteMutation = useDeleteMedia();

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer définitivement ce fichier ?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Média supprimé");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const filteredMedia = mediaData?.data.filter(media =>
    media.fileName.toLowerCase().includes(search.toLowerCase()) ||
    media.ownerId.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image": return <ImageIcon className="h-4 w-4 text-blue-500" />;
      case "video": return <VideoIcon className="h-4 w-4 text-purple-500" />;
      case "audio": return <MusicIcon className="h-4 w-4 text-pink-500" />;
      default: return <FileIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Média</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex justify-between items-end mt-2">
          <div>
            <Typography variant="h1" weight="bold" className="flex items-center gap-2">
              <HardDrive className="h-8 w-8 text-primary" /> Médiathèque
            </Typography>
            <Typography variant="lead" theme="muted">
              Gérez les fichiers, images et vidéos hébergés sur la plateforme
            </Typography>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Actualiser
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Fichiers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.images || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-600">Vidéos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.videos || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Autres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats?.other || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fichiers stockés</CardTitle>
              <CardDescription>Consultez tous les médias chargés par les utilisateurs</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un fichier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fichier</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Taille</TableHead>
                <TableHead>Propriétaire</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Chargement...</TableCell>
                </TableRow>
              ) : filteredMedia.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Aucun média trouvé</TableCell>
                </TableRow>
              ) : (
                filteredMedia.map((media) => (
                  <TableRow key={media.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted rounded flex items-center justify-center overflow-hidden">
                          {media.type === "image" ? (
                            <img src={media.url} alt={media.fileName} className="h-full w-full object-cover" />
                          ) : (
                            getFileIcon(media.type)
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm truncate max-w-[200px]">{media.fileName}</span>
                          <span className="text-xs text-muted-foreground">{media.mimeType}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">
                        {media.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {formatSize(media.size)}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{media.ownerId.slice(0, 8)}...</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {media.createdAt ? format(new Date(media.createdAt), "dd/MM/yy HH:mm", { locale: fr }) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <a href={media.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDelete(media.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
