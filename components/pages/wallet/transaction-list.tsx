"use client";

import React, { useState } from "react";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Download,
  Eye,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TransactionListProps {
  transactions: any[];
  walletId: string;
  showFilters?: boolean;
  compact?: boolean;
}

export function TransactionList({
  transactions,
  walletId,
  showFilters = false,
  compact = false,
}: TransactionListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge
            variant="default"
            className="gap-1 bg-green-100 text-green-800 hover:bg-green-100"
          >
            <CheckCircle className="h-3 w-3" />
            Complété
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            En attente
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Échoué
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "DEPOSIT":
      case "PURCHASE":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case "WITHDRAWAL":
      case "TRANSFER":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      default:
        return <Receipt className="h-4 w-4 text-blue-500" />;
    }
  };

  const filteredTransactions = transactions
    .filter((transaction) => {
      if (
        search &&
        !transaction.description?.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (statusFilter !== "all" && transaction.status !== statusFilter) {
        return false;
      }
      if (typeFilter !== "all" && transaction.type !== typeFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "date") {
        return (
          multiplier *
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        );
      }
      if (sortBy === "amount") {
        return multiplier * (parseFloat(a.amount) - parseFloat(b.amount));
      }
      return 0;
    });

  if (compact) {
    return (
      <div className="space-y-3">
        <AnimatePresence>
          {filteredTransactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="group flex items-center justify-between p-3 rounded-xl bg-card/30 border border-border/50 hover:bg-card/60 hover:border-primary/20 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "p-2.5 rounded-xl transition-colors",
                      transaction.type === "DEPOSIT" ||
                        transaction.type === "PURCHASE"
                        ? "bg-green-500/10 text-green-500 group-hover:bg-green-500/20"
                        : "bg-red-500/10 text-red-500 group-hover:bg-red-500/20"
                    )}
                  >
                    {getTypeIcon(transaction.type)}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold tracking-tight text-foreground/90 group-hover:text-primary transition-colors">
                      {transaction.description || "Transaction"}
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      {format(
                        new Date(transaction.createdAt),
                        "dd MMM, HH:mm",
                        { locale: fr }
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={cn(
                      "font-black tracking-tight text-sm mb-1",
                      transaction.type === "DEPOSIT" ||
                        transaction.type === "PURCHASE"
                        ? "text-green-500"
                        : "text-red-500"
                    )}
                  >
                    {transaction.type === "DEPOSIT" ||
                    transaction.type === "PURCHASE"
                      ? "+"
                      : "-"}
                    {parseFloat(transaction.amount).toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    GTC
                  </div>
                  {getStatusBadge(transaction.status)}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-8 border border-dashed border-border/50 rounded-xl bg-card/20">
            <Receipt className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              Aucune transaction récente
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        {/* En-tête avec filtres */}
        {showFilters && (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <Typography variant="h4" weight="semibold">
              Historique des Transactions
            </Typography>

            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-full md:w-48"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="COMPLETED">Complété</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="FAILED">Échoué</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="DEPOSIT">Dépôt</SelectItem>
                  <SelectItem value="WITHDRAWAL">Retrait</SelectItem>
                  <SelectItem value="TRANSFER">Transfert</SelectItem>
                  <SelectItem value="PURCHASE">Achat</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Table des transactions */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Frais</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filteredTransactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(transaction.type)}
                        <Typography variant="body-sm">
                          {transaction.type}
                        </Typography>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body-sm">
                        {transaction.description || "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body-sm"
                        weight="semibold"
                        className={cn(
                          transaction.type === "DEPOSIT" ||
                            transaction.type === "PURCHASE"
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        {transaction.type === "DEPOSIT" ||
                        transaction.type === "PURCHASE"
                          ? "+"
                          : "-"}
                        {parseFloat(transaction.amount).toLocaleString(
                          "fr-FR",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}{" "}
                        GTC
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body-sm" theme="muted">
                        {parseFloat(transaction.fees || "0").toLocaleString(
                          "fr-FR",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}{" "}
                        GTC
                      </Typography>
                    </TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>
                      <Typography variant="body-sm">
                        {format(
                          new Date(transaction.createdAt),
                          "dd/MM/yyyy HH:mm",
                          { locale: fr }
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir les détails
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Receipt className="h-4 w-4 mr-2" />
                            Télécharger le reçu
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Suivre
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <Typography variant="body-lg" theme="muted" className="mb-2">
                Aucune transaction trouvée
              </Typography>
              <Typography variant="body-sm" theme="muted">
                Ajustez vos filtres ou effectuez votre première transaction
              </Typography>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredTransactions.length > 0 && (
          <div className="flex items-center justify-between pt-6">
            <Typography variant="body-sm" theme="muted">
              Affichage de {filteredTransactions.length} transaction(s)
            </Typography>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Précédent
              </Button>
              <Button variant="outline" size="sm">
                Suivant
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
