"use client";

import React, { useEffect, useState } from "react";
import {
  listAllApiKeys,
  revokeApiKey,
} from "@/actions/api-keys";
import { useAuthContext } from "@/contexts/auth-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Key, 
  Trash2, 
  Plus, 
  RefreshCw, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Activity,
  History,
  Terminal
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { ApiKeyDialog } from "@/components/admin/api/api-key-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function AdminApiKeysPage() {
  const { user } = useAuthContext();
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const data = await listAllApiKeys();
      setKeys(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des clés");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleRevoke = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir révoquer cette clé ?")) return;
    
    try {
      await revokeApiKey(id, "Révoqué par l'administrateur");
      toast.success("Clé révoquée");
      fetchKeys();
    } catch (error) {
      toast.error("Erreur lors de la révocation");
    }
  };

  const filteredKeys = keys.filter(k => 
    k.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.userName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Key className="h-8 w-8 text-primary" />
            Gestion des APIs
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les accès programmatiques et les limites des acteurs système.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" asChild>
            <Link href="/admin/api/logs">
              <History className="h-4 w-4 mr-2" />
              Logs API
            </Link>
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Clé
          </Button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Key className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Clés Actives</p>
            <p className="text-2xl font-bold">{keys.filter(k => k.status === 'ACTIVE').length}</p>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Requêtes Totales</p>
            <p className="text-2xl font-bold">
              {keys.reduce((acc, k) => acc + (k.requestCount || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
            <Terminal className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Endpoint Test</p>
            <p className="text-sm font-mono text-primary font-bold">/api/test</p>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher par nom ou utilisateur..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="ghost" size="icon" onClick={fetchKeys}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clé / Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Détenteur</TableHead>
              <TableHead>Limites (H/J)</TableHead>
              <TableHead>Utilisation</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredKeys.length > 0 ? (
              filteredKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{key.name || "Sans nom"}</span>
                      <code className="text-[10px] text-muted-foreground font-mono">{key.prefix}xxxxxx</code>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {key.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{key.userName || "Admin"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-[10px] space-y-1">
                      <p className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        {key.rateLimitPerHour}/h
                      </p>
                      <p className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        {key.rateLimitPerDay}/j
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold">{key.requestCount} req.</span>
                      <span className="text-[10px] text-muted-foreground">
                        {key.lastUsedAt ? format(new Date(key.lastUsedAt), "dd MMM HH:mm", { locale: fr }) : "Jamais"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {key.status === "ACTIVE" ? (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20 gap-1 capitalize">
                        <ShieldCheck className="h-3 w-3" />
                        {key.status.toLowerCase()}
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1 capitalize">
                        <ShieldAlert className="h-3 w-3" />
                        {key.status.toLowerCase()}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {key.status === "ACTIVE" && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleRevoke(key.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Aucune clé trouvée.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {user && (
        <ApiKeyDialog 
          isOpen={isDialogOpen} 
          onClose={() => setIsDialogOpen(false)} 
          userId={user.id!} 
        />
      )}
    </div>
  );
}
