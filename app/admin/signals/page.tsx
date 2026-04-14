"use client";

import { useState } from "react";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Bug, CheckCircle,
  Trash2, Filter,
  RefreshCw,
  Search,
  MoreVertical
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useSignals, useUpdateSignal, useDeleteSignal } from "@/hooks/use-signals";

export default function AdminSignalsPage() {
  const [filter, setFilter] = useState<any>({});

  const { data, isLoading, refetch } = useSignals(filter);

  const updateMutation = useUpdateSignal();
  const deleteMutation = useDeleteSignal();

  const handleStatusUpdate = async (id: string, status: string) => {
    updateMutation.mutate(
      { id, input: { status: status as any } },
      {
        onSuccess: () => {
          toast.success("Statut mis à jour");
        },
        onError: () => {
          toast.error("Erreur de mise à jour");
        },
      }
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce signalement ?")) return;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Signalement supprimé");
      },
      onError: () => {
        toast.error("Erreur de suppression");
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">En attente</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">En cours</Badge>;
      case "PROCESSED":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Traité</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "text-rose-600 bg-rose-50";
      case "HIGH": return "text-orange-600 bg-orange-50";
      case "MEDIUM": return "text-amber-600 bg-amber-50";
      case "LOW": return "text-emerald-600 bg-emerald-50";
      default: return "";
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h2" className="text-3xl font-black">Gestion des Signalements</Typography>
          <Typography variant="body-base" theme="muted">Modérez et résolvez les bugs signalés par les utilisateurs.</Typography>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading} className="gap-2 rounded-xl">
          <RefreshCw className={isLoading ? "animate-spin w-4 h-4" : "w-4 h-4"} />
          Actualiser
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher un signalement..." className="pl-10 h-11 rounded-xl" />
        </div>
        <Button variant="outline" className="gap-2 rounded-xl">
          <Filter className="w-4 h-4" />
          Filtres
        </Button>
      </div>

      <Card className="rounded-2xl border-border/50 shadow-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Titre / Description</TableHead>
              <TableHead>Sévérité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="h-16 animate-pulse bg-muted/10" />
                </TableRow>
              ))
            ) : data && data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                  Aucun signalement trouvé.
                </TableCell>
              </TableRow>
            ) : (
              data?.map((signal: any) => (
                <TableRow key={signal.id} className="group hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <Bug className="w-4 h-4 text-muted-foreground" />
                       <span className="text-xs font-bold uppercase">{signal.targetType}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="space-y-1">
                      <p className="font-bold truncate">{signal.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{signal.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full ${getSeverityColor(signal.metadata?.severity || 'MEDIUM')}`}>
                      {signal.metadata?.severity || 'MEDIUM'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(signal.status)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground capitalize">
                     {format(new Date(signal.createdAt), 'dd MMMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-xl">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/50">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(signal.id, "IN_PROGRESS")} className="gap-2">
                          <RefreshCw className="w-4 h-4" /> En cours
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(signal.id, "PROCESSED")} className="gap-2 text-emerald-600">
                          <CheckCircle className="w-4 h-4" /> Marquer traité
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(signal.id)} className="gap-2 text-rose-600">
                          <Trash2 className="w-4 h-4" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
