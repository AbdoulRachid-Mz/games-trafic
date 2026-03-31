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
  ExternalLink,
  HardDrive,
  CheckCircle,
  PlayCircle,
  FileIcon,
  ImageIcon,
  MoreVertical,
  MusicIcon,
  RefreshCw,
  Trash2,
  VideoIcon
} from "lucide-react";
import { StatsCarousel } from "@/components/shared/stats-carousel";
import { StatCard } from "@/components/admin/stat-card";
import { ResponsiveFilters } from "@/components/shared/responsive-filters";
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
      <StatsCarousel mode="auto">
        <StatCard
          title="Total Fichiers"
          value={stats?.total || 0}
          icon={HardDrive}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          title="Images"
          value={stats?.images || 0}
          icon={ImageIcon}
          iconClassName="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          title="Vidéos"
          value={stats?.videos || 0}
          icon={PlayCircle}
          iconClassName="bg-purple-500/10 text-purple-500"
        />
        <StatCard
          title="Autres"
          value={stats?.other || 0}
          icon={FileIcon}
          iconClassName="bg-muted/10 text-muted-foreground"
        />
      </StatsCarousel>

      <Card>
        <CardHeader className="pb-0 border-b-0">
          <ResponsiveFilters
            searchTerm={search}
            onSearchChange={setSearch}
            searchPlaceholder="Rechercher un fichier..."
            onReset={() => setSearch("")}
          />
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
