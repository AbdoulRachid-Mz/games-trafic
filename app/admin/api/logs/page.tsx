"use client";

import React, { useEffect, useState } from "react";
import { getApiLogs } from "@/actions/api-keys";
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
  History, 
  RefreshCw, 
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function AdminApiLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getApiLogs(100);
      setLogs(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    l.path?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.apiKeyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.userName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return "text-green-500 bg-green-500/10 border-green-500/20";
    if (code >= 400 && code < 500) return "text-orange-500 bg-orange-500/10 border-orange-500/20";
    if (code >= 500) return "text-red-500 bg-red-500/10 border-red-500/20";
    return "text-muted-foreground bg-muted";
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="h-8 w-8 text-primary" />
            Logs de l'API
          </h1>
          <p className="text-muted-foreground mt-1">
            Surveillance en temps réel des appels API et des performances.
          </p>
        </div>
        
        <Button variant="outline" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Actualiser
        </Button>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher par route, clé ou utilisateur..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Horodatage</TableHead>
              <TableHead>Méthode / Route</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Détenteur</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-xs whitespace-nowrap">
                    {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px] py-0">
                        {log.method}
                      </Badge>
                      <span className="text-sm font-medium">{log.path}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border font-bold", getStatusColor(log.statusCode))}>
                      {log.statusCode >= 200 && log.statusCode < 300 ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {log.statusCode}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{log.apiKeyName || "Inconnu"}</span>
                      <span className="text-[10px] text-muted-foreground">{log.userName || "Admin"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className={cn(
                        log.duration > 500 ? "text-orange-500 font-bold" : "text-muted-foreground"
                      )}>
                        {log.duration}ms
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[10px] font-mono text-muted-foreground">
                    {log.ip}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Aucun log trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
