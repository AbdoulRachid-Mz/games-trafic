"use client";

import React, { useState, useEffect } from "react";
import { useAuthContext } from "@/contexts/auth-context";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  MoreVertical,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
// import { DateRangePicker } from "@/components/ui/date-range-picker";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/hooks/use-profile";

export default function TransactionHistoryPage() {
  const { user } = useAuthContext();
  // const { data: completeData } = useUserProfile(user?.id || "");
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadTransactions();
  }, [currentPage, statusFilter, typeFilter, dateRange]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(typeFilter !== "all" && { type: typeFilter }),
        ...(dateRange.from && { startDate: dateRange.from.toISOString() }),
        ...(dateRange.to && { endDate: dateRange.to.toISOString() }),
      });

      const response = await fetch(`/api/wallet/transactions?${params}`);
      const data = await response.json();
      
      setTransactions(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Complété
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3" />
            En attente
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
            <XCircle className="h-3 w-3" />
            Échoué
          </span>
        );
      default:
        return <span className="text-xs">{status}</span>;
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

  const filteredTransactions = transactions.filter((tx: any) =>
    tx.description?.toLowerCase().includes(search.toLowerCase()) ||
    tx.id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Typography variant="h1" weight="bold" gradient>
          Historique des Transactions
        </Typography>
        <Typography variant="body-sm" theme="muted" className="mt-1">
          Consultez l'historique complet de vos transactions
        </Typography>
      </motion.div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une transaction..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-2">
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
                  <SelectItem value="VIP_SUBSCRIPTION">VIP</SelectItem>
                </SelectContent>
              </Select>

              <div className={cn("grid gap-2")}>
                <Input
                  type="date"
                  value={dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : ""}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, from: new Date(e.target.value) }))
                  }
                  className="w-[120px]"
                />
                <Input
                  type="date"
                  value={dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : ""}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, to: new Date(e.target.value) }))
                  }
                  className="w-[120px]"
                />
              </div>

              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </div>
          ) : (
            <>
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
                  {filteredTransactions.map((transaction: any, index) => (
                    <motion.tr
                      key={transaction.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-muted/50"
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
                            transaction.type === "DEPOSIT" || transaction.type === "PURCHASE"
                              ? "text-green-600"
                              : "text-red-600"
                          )}
                        >
                          {transaction.type === "DEPOSIT" || transaction.type === "PURCHASE" ? "+" : "-"}
                          {parseFloat(transaction.amount).toFixed(2)} GTC
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body-sm" theme="muted">
                          {parseFloat(transaction.fees || "0").toFixed(2)} GTC
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body-sm">
                          {format(new Date(transaction.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}
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
                              <Calendar className="h-4 w-4 mr-2" />
                              Exporter
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>

              {filteredTransactions.length === 0 && (
                <div className="text-center py-12">
                  <Receipt className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <Typography variant="body-lg" theme="muted" className="mb-2">
                    Aucune transaction trouvée
                  </Typography>
                  <Typography variant="body-sm" theme="muted">
                    Ajustez vos filtres pour voir plus de résultats
                  </Typography>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {filteredTransactions.length > 0 && (
        <div className="flex items-center justify-between">
          <Typography variant="body-sm" theme="muted">
            Page {currentPage} sur {totalPages}
          </Typography>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}