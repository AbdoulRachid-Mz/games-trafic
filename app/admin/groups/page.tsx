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
  RefreshCw,
  Globe,
  Lock,
  MessageSquare,
  Users2,
  ShieldCheck,
  Users,
  MoreVertical,
  Trash2
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
      <StatsCarousel mode="auto">
        <StatCard
          title="Total Groupes"
          value={stats?.total || 0}
          icon={Users2}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          title="Publics"
          value={stats?.public || 0}
          icon={Globe}
          iconClassName="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          title="Privés"
          value={stats?.private || 0}
          icon={Lock}
          iconClassName="bg-amber-500/10 text-amber-500"
        />
      </StatsCarousel>

      <Card>
        <CardHeader className="pb-0 border-b-0">
          <ResponsiveFilters
            searchTerm={search}
            onSearchChange={setSearch}
            searchPlaceholder="Rechercher un groupe..."
            onReset={() => setSearch("")}
          />
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
