// app/admin/groups/page.tsx
"use client";

import React, { useState } from "react";
import { useGroups, useGroupStats, useDeleteGroup } from "@/hooks/use-groupes";
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
  Users, 
  Search, 
  MoreVertical, 
  Trash2, 
  RefreshCw,
  Globe,
  Lock,
  MessageSquare
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function AdminGroupsPage() {
  const [search, setSearch] = useState("");
  const { data: groupsData, isLoading, refetch } = useGroups({
    pagination: { page: 1, limit: 50 }
  });
  const { data: stats } = useGroupStats();
  const deleteMutation = useDeleteGroup();

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce groupe et tous ses membres ?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Groupe supprimé");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const filteredGroups = groupsData?.data.filter(group => 
    group.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

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
              <BreadcrumbPage>Groupes</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex justify-between items-end mt-2">
          <div>
            <Typography variant="h1" weight="bold" className="flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" /> Gestion des Groupes
            </Typography>
            <Typography variant="lead" theme="muted">
              Supervisez les communautés, les clans et les groupes de discussion
            </Typography>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Actualiser
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Groupes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Publics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.public || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">Privés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats?.private || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Communautés</CardTitle>
              <CardDescription>Liste de tous les groupes créés par les utilisateurs</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un groupe..."
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
                <TableHead>Groupe</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Membres</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Chargement...</TableCell>
                </TableRow>
              ) : filteredGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Aucun groupe trouvé</TableCell>
                </TableRow>
              ) : (
                filteredGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={group.image || ""} />
                          <AvatarFallback>{group.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{group.name}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">{group.description}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {group.isPrivate ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                            <Lock className="h-3 w-3 mr-1" /> Privé
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                            <Globe className="h-3 w-3 mr-1" /> Public
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {0}
                        {/* {group.members?.length !== null ? group.members.length : 0} */}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {group.createdAt ? format(new Date(group.createdAt), "dd MMM yyyy", { locale: fr }) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDelete(group.id)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
