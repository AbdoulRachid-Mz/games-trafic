"use client";

import React, { useState, useEffect } from "react";
import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import {
    getUserWallets,
    updateUserWallet,
    toggleWalletLock,
    getWalletStats,
} from "@/actions/wallets";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import {
    Wallet,
    Lock,
    Unlock,
    ShieldCheck,
    ShieldAlert,
    User,
    MoreVertical,
    Eye,
    RefreshCw,
    Coins,
    Activity,
    CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserWalletWithRelations, VerificationEnum } from "@/database/schema";
import { getWallets } from "@/actions/entities";

export default function AdminWalletsPage() {
    const router = useRouter();
    const [selectedWallet, setSelectedWallet] = useState<UserWalletWithRelations | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [stats, setStats] = useState<any>(null);

    const {
        data,
        loading,
        page,
        limit,
        searchTerm,
        filters,
        viewMode,
        total,
        setPage,
        setLimit,
        setSearchTerm,
        setFilters,
        setViewMode,
        onRefresh,
        isPlaceholderData,
    } = useEntityList<any>({
        entityType: "userWallets",
        fetchFunction: getWallets,
        defaultFilters: {
            limit: 20,
            populate: ["user", "financialAccount"],
        },
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const s = await getWalletStats();
            setStats(s);
        } catch (error) {
            console.error("Error loading wallet stats:", error);
        }
    };

    const handleToggleLock = async (wallet: UserWalletWithRelations) => {
        try {
            await toggleWalletLock(wallet.id, !wallet.isLocked);
            toast.success(wallet.isLocked ? "Wallet déverrouillé" : "Wallet verrouillé");
            onRefresh();
            loadStats();
        } catch (error) {
            toast.error("Erreur lors de la modification");
        }
    };

    const handleVerify = async (walletId: string, status: "VERIFIED" | "REJECTED") => {
        try {
            await updateUserWallet(walletId, { verificationStatus: status });
            toast.success(status === "VERIFIED" ? "Wallet vérifié" : "Vérification rejetée");
            onRefresh();
            loadStats();
        } catch (error) {
            toast.error("Erreur lors de la vérification");
        }
    };

    const renderStats = () => {
        if (!stats) return null;
        return (
            <>
                <StatCard
                    title="Total Wallets"
                    value={stats.total}
                    icon={Wallet}
                    color="blue"
                />
                <StatCard
                    title="Solde Total"
                    value={formatCurrency(stats.totalBalance || 0, "GTC")}
                    icon={Coins}
                    color="green"
                />
                <StatCard
                    title="Verrouillés"
                    value={stats.locked}
                    icon={Lock}
                    color="red"
                />
                <StatCard
                    title="Solde Moyen"
                    value={formatCurrency(stats.averageBalance || 0, "GTC")}
                    icon={Activity}
                    color="purple"
                />
            </>
        );
    };

    return (
        <div className="space-y-6">
            <EntityList
                title="Gestion des Wallets"
                description="Supervisez les portefeuilles numériques et les transactions"
                entityType="wallets"
                data={data}
                loading={loading}
                isPlaceholderData={isPlaceholderData}
                page={page}
                limit={limit}
                total={total}
                searchTerm={searchTerm}
                filters={filters}
                viewMode={viewMode}
                onPageChange={setPage}
                onLimitChange={setLimit}
                onSearchChange={setSearchTerm}
                onFilterChange={setFilters}
                onViewModeChange={setViewMode}
                onRefresh={() => {
                    onRefresh();
                    loadStats();
                }}
                renderStats={renderStats}
                availableFilters={[
                    {
                        key: "verificationStatus",
                        label: "Vérification",
                        type: "select",
                        options: [
                            { label: "Tous", value: "all" },
                            { label: "Vérifié", value: "VERIFIED" },
                            { label: "En attente", value: "PENDING" },
                            { label: "Rejeté", value: "REJECTED" },
                        ],
                    },
                    {
                        key: "isLocked",
                        label: "Verrouillage",
                        type: "select",
                        options: [
                            { label: "Tous", value: "all" },
                            { label: "Verrouillé", value: "true" },
                            { label: "Déverrouillé", value: "false" },
                        ],
                    },
                ]}
                renderTableHeader={() => (
                    <tr className="border-b">
                        <th className="text-left p-4">Propriétaire</th>
                        <th className="text-left p-4">Statut</th>
                        <th className="text-left p-4">Vérification</th>
                        <th className="text-left p-4">Date Création</th>
                        <th className="text-right p-4">Actions</th>
                    </tr>
                )}
                renderTableRow={(wallet: any) => (
                    <tr key={wallet.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={wallet.user?.profileImage} />
                                    <AvatarFallback>{wallet.user?.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">@{wallet.user?.username}</div>
                                    <div className="text-xs text-muted-foreground">{wallet.user?.email}</div>
                                </div>
                            </div>
                        </td>
                        <td className="p-4">
                            <Badge variant={wallet.isLocked ? "destructive" : "default"}>
                                {wallet.isLocked ? "Verrouillé" : "Actif"}
                            </Badge>
                        </td>
                        <td className="p-4">
                            <Badge
                                variant={
                                    wallet.verificationStatus === "VERIFIED" ? "default" :
                                        wallet.verificationStatus === "PENDING" ? "secondary" : "destructive"
                                }
                            >
                                {wallet.verificationStatus}
                            </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{formatDate(wallet.createdAt)}</td>
                        <td className="p-4 text-right">
                            <WalletActions
                                wallet={wallet}
                                onView={() => {
                                    setSelectedWallet(wallet);
                                    setViewDialogOpen(true);
                                }}
                                onToggleLock={() => handleToggleLock(wallet)}
                                onVerify={(status: "VERIFIED" | "REJECTED") => handleVerify(wallet.id, status)}
                            />
                        </td>
                    </tr>
                )}
                renderCard={(wallet: UserWalletWithRelations) => (
                    <Card key={wallet.id} className="overflow-hidden">
                        <CardContent className="p-4 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={wallet.user?.profileImage ?? undefined} />
                                        <AvatarFallback>{wallet.user?.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-bold">@{wallet.user?.username ?? "N/A"}</div>
                                        <div className="text-xs text-muted-foreground">{wallet.user?.email}</div>
                                    </div>
                                </div>
                                <WalletActions
                                    wallet={wallet}
                                    onView={() => {
                                        setSelectedWallet(wallet);
                                        setViewDialogOpen(true);
                                    }}
                                    onToggleLock={() => handleToggleLock(wallet)}
                                    onVerify={(status: "VERIFIED" | "REJECTED") => handleVerify(wallet.id, status)}
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant={wallet.isLocked ? "destructive" : "default"}>
                                    {wallet.isLocked ? "Verrouillé" : "Actif"}
                                </Badge>
                                <Badge variant={wallet.verificationStatus === "VERIFIED" ? "default" : wallet.verificationStatus === "PENDING" ? "secondary" : "destructive"}>
                                    {wallet.verificationStatus ?? "N/A"}
                                </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                **** **** **** {wallet.cardNumberHash?.slice(-4)}
                            </div>
                        </CardContent>
                    </Card>
                )}
            />

            {/* Details Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Détails du Wallet</DialogTitle>
                        <DialogDescription>Informations complètes sur le portefeuille et son propriétaire</DialogDescription>
                    </DialogHeader>
                    {selectedWallet && (
                        <ScrollArea className="max-h-[70vh] p-4">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <Typography variant="h4" weight="bold">Propriétaire</Typography>
                                        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                                            <Avatar className="h-16 w-16">
                                                <AvatarImage src={selectedWallet.user?.profileImage ?? undefined} />
                                                <AvatarFallback>{selectedWallet.user?.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-bold text-lg">@{selectedWallet.user?.username}</div>
                                                <div className="text-sm text-muted-foreground">{selectedWallet.user?.fullName ?? "N/A"}</div>
                                                <div className="text-sm text-muted-foreground">{selectedWallet.user?.email}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <Typography variant="h4" weight="bold">Informations Wallet</Typography>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">ID Wallet:</span>
                                                <span className="font-mono text-xs">{selectedWallet.id}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Numéro de carte:</span>
                                                <span className="font-medium">**** **** **** {selectedWallet.cardNumberHash?.slice(-4)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Date de création:</span>
                                                <span>{selectedWallet.createdAt ? formatDate(selectedWallet.createdAt) : "N/A"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t">
                                    <Typography variant="h4" weight="bold">Compte Financier</Typography>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="p-4 rounded-lg border bg-card">
                                            <div className="text-xs text-muted-foreground uppercase mb-1">Type</div>
                                            <div className="font-bold">{selectedWallet.financialAccount?.type || "N/A"}</div>
                                        </div>
                                        <div className="p-4 rounded-lg border bg-card">
                                            <div className="text-xs text-muted-foreground uppercase mb-1">Devise</div>
                                            <div className="font-bold">{selectedWallet.financialAccount?.currency || "GTC"}</div>
                                        </div>
                                        <div className="p-4 rounded-lg border bg-card">
                                            <div className="text-xs text-muted-foreground uppercase mb-1">Statut</div>
                                            <Badge variant={selectedWallet.financialAccount?.isActive ? "default" : "secondary"}>
                                                {selectedWallet.financialAccount?.isActive ? "Actif" : "Inactif"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-6 border-t">
                                    <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Fermer</Button>
                                    <Button
                                        variant={selectedWallet.isLocked ? "default" : "destructive"}
                                        onClick={() => {
                                            handleToggleLock(selectedWallet);
                                            setViewDialogOpen(false);
                                        }}
                                    >
                                        {selectedWallet.isLocked ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                                        {selectedWallet.isLocked ? "Déverrouiller" : "Verrouiller"}
                                    </Button>
                                </div>
                            </div>
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function WalletActions({ wallet, onView, onToggleLock, onVerify }: any) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={onView}>
                    <Eye className="h-4 w-4 mr-2" /> Voir les détails
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {wallet.verificationStatus === "PENDING" && (
                    <>
                        <DropdownMenuItem onClick={() => onVerify("VERIFIED")}>
                            <ShieldCheck className="h-4 w-4 mr-2 text-green-600" /> Approuver
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onVerify("REJECTED")}>
                            <ShieldAlert className="h-4 w-4 mr-2 text-red-600" /> Rejeter
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}
                <DropdownMenuItem onClick={onToggleLock} className={wallet.isLocked ? "text-green-600" : "text-destructive"}>
                    {wallet.isLocked ? (
                        <><Unlock className="h-4 w-4 mr-2" /> Déverrouiller</>
                    ) : (
                        <><Lock className="h-4 w-4 mr-2" /> Verrouiller</>
                    )}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    const colorClasses: any = {
        blue: "bg-blue-500/10 text-blue-500",
        green: "bg-green-500/10 text-green-500",
        red: "bg-red-500/10 text-red-500",
        purple: "bg-purple-500/10 text-purple-500",
    };

    return (
        <Card className="min-w-[200px] flex-shrink-0 snap-center lg:flex-1">
            <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", colorClasses[color])}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <div className="text-xs text-muted-foreground uppercase">{title}</div>
                    <div className="text-xl font-bold">{value}</div>
                </div>
            </CardContent>
        </Card>
    );
}
