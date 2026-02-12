"use client";

import React, { useState } from "react";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  User,
  Wallet,
  Check,
  AlertCircle,
  ScanLine,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { QrScanner } from "@/components/shared/qr-scanner";
import { getUserWalletById, getUserWalletByUserId, getUserWalletByCardNumber } from "@/actions/wallets";
import { getUserById } from "@/actions/users";
import { formatWalletNumber } from "@/lib/utils";
import { useEntityList } from "@/hooks/use-entity-list";

interface Recipient {
  id: string;
  walletId: string;
  user: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    walletNumber: string;
  };
  wallet: {
    isActive: boolean;
    isLocked: boolean;
    balance?: string;
  };
}

interface TransactionRecipientSelectorProps {
  onSelect: (recipient: Recipient) => void;
  onBack: () => void;
}

export function TransactionRecipientSelector({
  onSelect,
  onBack,
}: TransactionRecipientSelectorProps) {
  const [search, setSearch] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(
    null
  );
  const [searchType, setSearchType] = useState<"USER" | "WALLET" | "PHONE">(
    "USER"
  );
  const [showScanner, setShowScanner] = useState(false);

  const {
    data: foundUsers,
    onRefresh: refreshUsers,
    setSearchTerm: setUserSearch,
    setFilters: setUserFilters,
  } = useEntityList<any>({
    entityType: "users",
    defaultLimit: 20,
    enabled: false,
  });

  const searchRecipient = async () => {
    if (!search.trim()) return;

    setLoading(true);
    try {
      if (searchType === "USER") {
        setUserSearch(search);
        setUserFilters({ includeInactive: false });
        await refreshUsers();
        const users = foundUsers || [];
        const result: Recipient[] = [];
        for (const u of users) {
          const wallet = await getUserWalletByUserId(u.id);
          if (wallet) {
            result.push({
              id: u.id,
              walletId: wallet.id,
              user: {
                id: u.id,
                name: (u as any).fullName || (u as any).username || "Utilisateur",
                email: (u as any).email,
                avatar: (u as any).avatarUrl,
                walletNumber: formatWalletNumber(wallet.cardNumberHash || wallet.id),
              },
              wallet: {
                isActive: !!wallet.isActive,
                isLocked: !!wallet.isLocked,
                balance: wallet.balance?.toString(),
              },
            });
          }
        }
        setRecipients(result);
        if (!result.length) {
          toast.error("Aucun destinataire trouvé");
        }
      } else if (searchType === "PHONE") {
        const normalized = search.replace(/[^\d]/g, "").replace(/^00/, "");
        setUserSearch("");
        setUserFilters({ phoneNumber: normalized, includeInactive: false });
        await refreshUsers();
        const users = foundUsers || [];
        const result: Recipient[] = [];
        for (const u of users) {
          const wallet = await getUserWalletByUserId(u.id);
          if (wallet) {
            result.push({
              id: u.id,
              walletId: wallet.id,
              user: {
                id: u.id,
                name: (u as any).fullName || (u as any).username || "Utilisateur",
                email: (u as any).email,
                avatar: (u as any).avatarUrl,
                walletNumber: formatWalletNumber(wallet.cardNumberHash || wallet.id),
              },
              wallet: {
                isActive: !!wallet.isActive,
                isLocked: !!wallet.isLocked,
                balance: wallet.balance?.toString(),
              },
            });
          }
        }
        setRecipients(result);
        if (!result.length) {
          toast.error("Aucun destinataire trouvé");
        }
      } else if (searchType === "WALLET") {
        const wallet = await getUserWalletByCardNumber(search);
        if (wallet) {
          const user = await getUserById(wallet.userId, { populate: ["wallet"] });
          if (user) {
            const recipient: Recipient = {
              id: user.id,
              walletId: wallet.id,
              user: {
                id: user.id,
                name: (user as any).fullName || (user as any).username || "Utilisateur",
                email: (user as any).email,
                avatar: (user as any).avatarUrl,
                walletNumber: formatWalletNumber(wallet.cardNumberHash || wallet.id),
              },
              wallet: {
                isActive: !!wallet.isActive,
                isLocked: !!wallet.isLocked,
                balance: wallet.balance?.toString(),
              },
            };
            setRecipients([recipient]);
          } else {
            setRecipients([]);
          }
        } else {
          setRecipients([]);
        }
        if (!wallet) {
          toast.error("Aucun destinataire trouvé");
        }
      }
    } catch (error) {
      console.error("Error searching recipient:", error);
      toast.error("Erreur lors de la recherche");
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (data: string) => {
    try {
      const isPlain = typeof data === "string";
      let wallet = null as any;
      if (isPlain && (data.startsWith("WLT-") || /^\d{16}$/.test(data.replace(/\s+/g, "")))) {
        wallet = await getUserWalletByCardNumber(data);
      } else {
        const parsed = JSON.parse(data);
        if (parsed && parsed.type === "wallet") {
          if (parsed.cardNumber) {
            wallet = await getUserWalletByCardNumber(parsed.cardNumber);
          } else if (parsed.walletId) {
            wallet = await getUserWalletById(parsed.walletId);
          }
        }
      }
      if (wallet) {
        const user = await getUserById(wallet.userId, { populate: ["wallet"] });
        if (!user) {
          toast.error("Utilisateur introuvable");
          return;
        }
        const recipient: Recipient = {
          id: user.id,
          walletId: wallet.id,
          user: {
            id: user.id,
            name: (user as any).fullName || (user as any).username || "Utilisateur",
            email: (user as any).email,
            avatar: (user as any).avatarUrl,
            walletNumber: formatWalletNumber(wallet.cardNumberHash || wallet.id),
          },
          wallet: {
            isActive: !!wallet.isActive,
            isLocked: !!wallet.isLocked,
            balance: wallet.balance?.toString(),
          },
        };
        setRecipients([recipient]);
        setSelectedRecipient(recipient);
        setShowScanner(false);
        toast.success("Wallet scanné");
        return;
      }
      toast.error("QR non pris en charge");
    } catch {
      toast.error("QR invalide");
    }
  };

  const handleSelect = (recipient: Recipient) => {
    if (!recipient.wallet.isActive) {
      toast.error("Le wallet du destinataire est inactif");
      return;
    }

    if (recipient.wallet.isLocked) {
      toast.warning("Le wallet du destinataire est verrouillé");
    }

    setSelectedRecipient(recipient);
  };

  const handleConfirm = () => {
    if (selectedRecipient) {
      onSelect(selectedRecipient);
    }
  };

  // Icône correspondant au type de recherche
  const SearchIcon =
    searchType === "WALLET"
      ? Wallet
      : searchType === "PHONE"
      ? Smartphone
      : User;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <Typography variant="h3" weight="bold">
          Destinataire
        </Typography>
        <Typography variant="body-base" theme="muted">
          À qui souhaitez-vous envoyer de l'argent ?
        </Typography>
      </div>

      <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 space-y-6">
            {/* Search Tabs */}
            <div className="flex p-1 bg-muted/40 rounded-xl">
              {(["USER", "WALLET", "PHONE"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSearchType(type);
                    setSearch("");
                    setRecipients([]);
                    setSelectedRecipient(null);
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                    searchType === type
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:bg-background/50 hover:text-foreground/80"
                  )}
                >
                  {type === "USER" && <User className="w-4 h-4" />}
                  {type === "WALLET" && <Wallet className="w-4 h-4" />}
                  {type === "PHONE" && <Smartphone className="w-4 h-4" />}
                  <span className="hidden sm:inline">
                    {type === "USER"
                      ? "Nom/Email"
                      : type === "WALLET"
                      ? "N° Wallet"
                      : "Téléphone"}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder={
                    searchType === "WALLET"
                      ? "WLT-XXXX-XXXX"
                      : searchType === "PHONE"
                      ? "+225 07..."
                      : "Rechercher un utilisateur..."
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchRecipient()}
                  className="pl-12 h-12 bg-background/50 border-input/50 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl"
                />
              </div>
              <Button
                onClick={searchRecipient}
                className="h-12 w-12 p-0 rounded-xl"
                 disabled={!search}
              >
                <Search className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => setShowScanner(true)}
                variant="outline"
                className="h-12 w-12 p-0 rounded-xl"
              >
                <ScanLine className="w-5 h-5" />
              </Button>
            </div>

            {showScanner && (
              <div className="rounded-2xl overflow-hidden border border-border/50 bg-background/30 p-4">
                <QrScanner onScan={handleScan} />
                <div className="flex justify-end mt-4">
                  <Button variant="secondary" onClick={() => setShowScanner(false)}>
                    Fermer
                  </Button>
                </div>
              </div>
            )}

            {/* Selected Recipient Preview */}
            <AnimatePresence mode="wait">
              {selectedRecipient && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative p-1 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-[1px]"
                >
                  <div className="bg-card/95 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                          <AvatarImage src={selectedRecipient.user.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {selectedRecipient.user.name
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-0.5 border-2 border-background">
                          <Check className="w-3 h-3" />
                        </div>
                      </div>
                      <div>
                        <Typography
                          variant="body-base"
                          weight="bold"
                          className="leading-tight"
                        >
                          {selectedRecipient.user.name}
                        </Typography>
                        <Typography
                          variant="caption1"
                          theme="muted"
                          className="font-mono mt-1 block"
                        >
                          {selectedRecipient.user.walletNumber}
                        </Typography>
                      </div>
                    </div>
                    {/* Visual flourish */}
                    <div className="text-right hidden sm:block">
                      <Typography
                        variant="caption2"
                        className="text-primary font-medium px-2 py-1 bg-primary/10 rounded-full"
                      >
                        Sélectionné
                      </Typography>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recipient List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <Typography variant="body-sm" weight="medium" theme="muted">
                  {search ? "Résultats de recherche" : "Contacts récents"}
                </Typography>
                {loading && (
                  <div className="text-xs text-muted-foreground animate-pulse">
                    Chargement...
                  </div>
                )}
              </div>

              <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {loading && recipients.length === 0 ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-3 rounded-xl border border-transparent bg-muted/20 animate-pulse"
                    >
                      <div className="w-10 h-10 rounded-full bg-muted-foreground/10" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-1/3 bg-muted-foreground/10 rounded" />
                        <div className="h-3 w-1/2 bg-muted-foreground/10 rounded" />
                      </div>
                    </div>
                  ))
                ) : recipients.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center justify-center opacity-60">
                    <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <Typography variant="body-base" theme="muted">
                      {search
                        ? "Aucun utilisateur trouvé"
                        : "Aucun contact récent"}
                    </Typography>
                  </div>
                ) : (
                  recipients.map((recipient, index) => (
                    <motion.button
                      key={recipient.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSelect(recipient)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 group text-left",
                        selectedRecipient?.id === recipient.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/40 hover:border-primary/50 hover:bg-muted/30 bg-background/20"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border border-border/50">
                          <AvatarImage src={recipient.user.avatar} />
                          <AvatarFallback className="text-xs">
                            {recipient.user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Typography
                            variant="body-sm"
                            weight="semibold"
                            className="group-hover:text-primary transition-colors"
                          >
                            {recipient.user.name}
                          </Typography>
                          <Typography
                            variant="caption2"
                            theme="muted"
                            className="font-mono"
                          >
                            {recipient.user.walletNumber}
                          </Typography>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {!recipient.wallet.isActive ? (
                          <Badge
                            variant="destructive"
                            className="h-5 text-[10px] px-2"
                          >
                            Inactif
                          </Badge>
                        ) : recipient.wallet.isLocked ? (
                          <Badge
                            variant="secondary"
                            className="h-5 text-[10px] px-2"
                          >
                            Bloqué
                          </Badge>
                        ) : (
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full border-2 border-background",
                              selectedRecipient?.id === recipient.id
                                ? "bg-primary"
                                : "bg-muted-foreground/20 group-hover:bg-primary/50"
                            )}
                          />
                        )}
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-border/50">
              <Button
                variant="outline"
                onClick={onBack}
                className="flex-1 h-12 rounded-xl font-bold"
              >
                Retour
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!selectedRecipient}
                className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/25"
              >
                Continuer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
