// app/admin/vip/page.tsx
"use client";

import React, { useState } from "react";
import {
  useVipSubscriptions,
  useVipStats,
  useCancelVipSubscription,
  useDeleteVipSubscription
} from "@/hooks/use-vip";
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
// import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import {
  Crown,
  Search,
  MoreVertical,
  XCircle,
  Trash2,
  RefreshCw,
  User,
  Calendar,
  CreditCard
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

export default function AdminVipPage() {
  const [search, setSearch] = useState("");
  const { data: subsData, isLoading, refetch } = useVipSubscriptions({
    pagination: { page: 1, limit: 50 }
  });
  const { data: stats } = useVipStats();

  const cancelMutation = useCancelVipSubscription();
  const deleteMutation = useDeleteVipSubscription();

  const handleCancel = async (id: string) => {
    if (!confirm("Annuler cet abonnement ?")) return;
    try {
      await cancelMutation.mutateAsync(id);
      toast.success("Abonnement annulé");
    } catch (error) {
      toast.error("Erreur lors de l'annulation");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer définitivement cet abonnement ?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Abonnement supprimé");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const filteredSubs = subsData?.data.filter(sub =>
    sub.userId.toLowerCase().includes(search.toLowerCase())
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
              <BreadcrumbPage>VIP</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex justify-between items-end mt-2">
          <div>
            <Typography variant="h1" weight="bold" className="flex items-center gap-2">
              <Crown className="h-8 w-8 text-amber-500" /> Abonnements VIP
            </Typography>
            <Typography variant="lead" theme="muted">
              Gérez les privilèges et les abonnements des membres Premium
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
            <CardTitle className="text-sm font-medium">Total Abonnements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.active || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">Mensuels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats?.monthly || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-600">Annuels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.yearly || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des abonnés</CardTitle>
              <CardDescription>Consultez et gérez les abonnements en cours</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par ID..."
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
                <TableHead>Utilisateur</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Prix Payé</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Chargement...</TableCell>
                </TableRow>
              ) : filteredSubs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Aucun abonnement trouvé</TableCell>
                </TableRow>
              ) : (
                filteredSubs.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-xs">{sub.userId.slice(0, 8)}...</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {sub.planType ? sub.planType.toLowerCase() : 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sub.status === "ACTIVE" ? "default" : "secondary"}>
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex flex-col">
                        <span>Du {sub.startDate ? format(sub.startDate, "dd/MM/yy", { locale: fr }) : "N/A"}</span>
                        <span className="text-muted-foreground">Au {sub.endDate ? format(sub.endDate, "dd/MM/yy", { locale: fr }) : "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-medium">
                        <CreditCard className="h-3 w-3" />
                        {sub.pricePaid} {sub.currency}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {sub.status === "ACTIVE" && (
                            <DropdownMenuItem onClick={() => handleCancel(sub.id)} className="text-amber-600">
                              <XCircle className="h-4 w-4 mr-2" /> Annuler
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDelete(sub.id)} className="text-destructive">
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
