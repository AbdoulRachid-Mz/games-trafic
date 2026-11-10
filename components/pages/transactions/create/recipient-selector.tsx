"use client";

import React, { useState } from "react";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { QrScanner } from "@/components/shared/qr-scanner";
import { getUserWalletById, getUserWalletByUserId, getUserWalletByCardNumber } from "@/actions/wallets";
import { getUserById, getUsers as searchUsersAdvanced, getRecentRecipients } from "@/actions/users";
import { getUsers as searchUsersGeneric } from "@/actions/entities";
import { formatWalletNumber } from "@/lib/utils";
import { useWalletBalance } from "@/hooks/use-wallets";

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
  initialWalletId?: string;
}

export function TransactionRecipientSelector({
  onSelect,
  onBack,
  initialWalletId,
}: TransactionRecipientSelectorProps) {
  const [search, setSearch] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(
    null
  );
  const [prefillLoaded, setPrefillLoaded] = useState(false);
  const [searchType, setSearchType] = useState<"USER" | "WALLET" | "PHONE">(
    "USER"
  );
  const [showScanner, setShowScanner] = useState(false);
  const walletBalance = useWalletBalance(selectedRecipient?.walletId || "");

  React.useEffect(() => {
    const prefillRecipient = async () => {
      if (prefillLoaded) return;
      setLoading(true);
      try {
        if (!initialWalletId) {
          const recents = await getRecentRecipients(10);
          setRecipients(recents as any);
          setPrefillLoaded(true);
          return;
        }

        const wallet = await getUserWalletById(initialWalletId);
        if (!wallet) {
          setPrefillLoaded(true);
          return;
        }
        const user = await getUserById(wallet.userId, { populate: ["wallet"] });
        if (!user) {
          setPrefillLoaded(true);
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
            balance: walletBalance.data?.toString() || "0",
          },
        };
        setRecipients([recipient]);
        setSelectedRecipient(recipient);
      } finally {
        setPrefillLoaded(true);
        setLoading(false);
      }
    };
    prefillRecipient();
  }, [initialWalletId, prefillLoaded, walletBalance.data]);

  const mapUsersToRecipients = async (users: any[]): Promise<Recipient[]> => {
    const wallets = await Promise.all(
      users.map((u: any) => getUserWalletByUserId(u.id))
    );
    return users
      .map((u: any, idx: number) => {
        const wallet = wallets[idx];
        if (!wallet) return null;
        return {
          id: u.id,
          walletId: wallet.id,
          user: {
            id: u.id,
            name: u.fullName || u.username || "Utilisateur",
            email: u.email,
            avatar: u.avatarUrl,
            walletNumber: formatWalletNumber(wallet.cardNumberHash || wallet.id),
          },
          wallet: {
            isActive: !!wallet.isActive,
            isLocked: !!wallet.isLocked,
          },
        } as Recipient;
      })
      .filter(Boolean) as Recipient[];
  };

  const searchRecipient = async () => {
    if (!search.trim()) {
      setLoading(true);
      try {
        const recents = await getRecentRecipients(10);
        setRecipients(recents as any);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      if (searchType === "USER") {
        const response = await searchUsersGeneric({
          search: search.trim(),
          isActive: true,
          page: 1,
          limit: 20,
        });
        const users = response?.data || [];
        const result = await mapUsersToRecipients(users);
        setRecipients(result);
        if (!result.length) {
          toast.error("Aucun destinataire trouvé");
        }
      } else if (searchType === "PHONE") {
        const normalized = search.replace(/[^\d]/g, "").replace(/^00/, "");
        const response = await searchUsersAdvanced({
          pagination: { page: 1, limit: 20 },
          filters: { phoneNumber: normalized },
          options: { includeInactive: false },
        });
        const users = response?.data || [];
        const result = await mapUsersToRecipients(users);
        setRecipients(result);
        if (!result.length) {
          toast.error("Aucun destinataire trouvé");
        }
      } else if (searchType === "WALLET") {
        const wallet = await getUserWalletByCardNumber(search.trim());
        if (!wallet) {
          toast.error("Aucun portefeuille trouvé");
          setRecipients([]);
          return;
        }
        const user = await getUserById(wallet.userId);
        if (!user) {
          toast.error("Utilisateur introuvable");
          setRecipients([]);
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
          },
        };
        setRecipients([recipient]);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Erreur lors de la recherche");
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (value: string) => {
    setShowScanner(false);
    setSearch(value);
    setSearchType("WALLET");
    // Trigger search automatically
    setLoading(true);
    try {
      const wallet = await getUserWalletByCardNumber(value);
      if (!wallet) {
        toast.error("Portefeuille introuvable");
        return;
      }
      const user = await getUserById(wallet.userId);
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
        },
      };
      setRecipients([recipient]);
      setSelectedRecipient(recipient);
      toast.success("Destinataire trouvé !");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du scan");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (recipient: Recipient) => {
    if (!recipient.wallet.isActive || recipient.wallet.isLocked) {
      toast.error("Ce portefeuille n'est pas disponible");
      return;
    }
    setSelectedRecipient(recipient);
  };

  const handleConfirm = () => {
    if (selectedRecipient) {
      onSelect(selectedRecipient);
    }
  };

  const searchTypeTabs = [
    { key: "USER" as const, label: "Nom", icon: User },
    { key: "WALLET" as const, label: "Wallet", icon: Wallet },
    { key: "PHONE" as const, label: "Téléphone", icon: Smartphone },
  ];

  return (
    <div className="w-full max-w-md mx-auto space-y-5">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-primary" />
        </div>
        <Typography variant="h3" weight="bold">
          Destinataire
        </Typography>
        <Typography variant="body-base" theme="muted">
          Sélectionnez le bénéficiaire
        </Typography>
      </div>

      <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden">
        <CardContent className="p-6 space-y-5">
          {/* Search type tabs */}
          <div className="flex gap-1 p-1 bg-muted/30 rounded-xl">
            {searchTypeTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSearchType(tab.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all",
                  searchType === tab.key
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search input + QR button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={
                  searchType === "USER"
                    ? "Nom d'utilisateur..."
                    : searchType === "WALLET"
                    ? "Numéro de portefeuille..."
                    : "Numéro de téléphone..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchRecipient()}
                className="pl-9 h-12 rounded-xl bg-background/50 border-border/50"
              />
            </div>
            <Button
              onClick={searchRecipient}
              variant="default"
              className="h-12 w-12 p-0 rounded-xl"
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => setShowScanner(!showScanner)}
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
                className="relative rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-[1px]"
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

            <div className="grid gap-3 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
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
                      <div className="relative">
                        <Avatar className="h-10 w-10 border border-border/50">
                          <AvatarImage src={recipient.user.avatar} />
                          <AvatarFallback className="text-xs">
                            {recipient.user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {!search && (recipient as any).count > 1 && (
                          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center border-2 border-background">
                            {(recipient as any).count}
                          </span>
                        )}
                      </div>
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
        </CardContent>
      </Card>
    </div>
  );
}
