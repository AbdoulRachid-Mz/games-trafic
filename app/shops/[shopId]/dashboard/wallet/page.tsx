"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCw,
    History,
    TrendingUp,
    CreditCard
} from "lucide-react";
import { getShopFinancialStats } from "@/actions/shops";
import { ShopExportButton } from "@/components/pages/shops/shop-export-button";
import { getWalletTransactions, transferBetweenIdentities } from "@/actions/wallets";
import { useAuthContext } from "@/contexts/auth-context";
import { motion } from "framer-motion";

export default function ShopWalletPage() {
    const params = useParams();
    const shopId = params.shopId as string;
    const { user } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ balance: 0, transactionsCount: 0 });
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [s, t] = await Promise.all([
                getShopFinancialStats(shopId),
                getWalletTransactions({
                    filters: { shopId }, // Logic in actions should support filtering by shop financial account if linked
                    pagination: { page: 1, limit: 10 },
                    options: { sortBy: "createdAt", sortOrder: "desc" }
                })
            ]);
            setStats(s);
            setTransactions(t.data || []);
        } catch (err) {
            toast.error("Erreur de chargement des données financières");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [shopId]);

    const handleWithdraw = async () => {
        if (stats.balance <= 0) {
            toast.error("Aucun revenu à retirer");
            return;
        }

        setIsWithdrawing(true);
        try {
            const res = await transferBetweenIdentities({
                fromIdentityId: shopId,
                fromType: 'SHOP',
                toIdentityId: user?.id!,
                toType: 'USER',
                amount: stats.balance,
                description: "Retrait des revenus de la boutique"
            });

            if (res.success) {
                toast.success("Retrait effectué avec succès vers votre wallet personnel");
                loadData();
            } else {
                toast.error(res.error || "Erreur lors du retrait");
            }
        } catch (err) {
            toast.error("Une erreur est survenue");
        } finally {
            setIsWithdrawing(false);
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <Typography variant="h1" weight="bold">Portefeuille Boutique</Typography>
                    <Typography variant="body-base" theme="muted">Gérez vos revenus et retirez vos bénéfices</Typography>
                </div>
                <div className="flex items-center gap-2">
                    <ShopExportButton shopId={shopId} kind="wallet" label="Exporter" />
                    <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualiser
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-none shadow-xl relative overflow-hidden">
                    <CardContent className="p-8 relative z-10">
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <Typography variant="body-sm" className="text-white/70 uppercase tracking-wider mb-1">Revenus Disponibles</Typography>
                                <Typography variant="h1" className="text-5xl font-bold tracking-tighter">
                                    {stats.balance.toLocaleString()} <span className="text-2xl font-normal opacity-70 ml-1">GTC</span>
                                </Typography>
                            </div>
                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                                <Wallet className="h-8 w-8" />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                onClick={handleWithdraw}
                                disabled={stats.balance <= 0 || isWithdrawing}
                                size="lg"
                                className="bg-white text-teal-800 hover:bg-white/90 font-bold px-8 rounded-xl shadow-lg shadow-teal-900/20"
                            >
                                {isWithdrawing ? "Traitement..." : "Retirer vers mon Wallet"}
                                <ArrowUpRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                    </CardContent>
                    <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                </Card>

                <Card className="bg-card/40 backdrop-blur-xl border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                            Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                            <Typography variant="body-sm" theme="muted" className="mb-1">Transactions totales</Typography>
                            <Typography variant="h3" weight="bold">{stats.transactionsCount}</Typography>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                            <Typography variant="body-sm" theme="muted" className="mb-1">Dernier retrait</Typography>
                            <Typography variant="body-base" weight="semibold">Aucun retrait récent</Typography>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-card/40 backdrop-blur-xl border-border/50">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5 text-teal-500" />
                        Historique Financier
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">Voir tout</Button>
                </CardHeader>
                <CardContent>
                    {transactions.length > 0 ? (
                        <div className="space-y-4">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${tx.type === 'TRANSFER' ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'}`}>
                                            {tx.type === 'TRANSFER' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <Typography variant="body-base" weight="semibold">{tx.description || tx.type}</Typography>
                                            <Typography variant="body-sm" theme="muted">{new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</Typography>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Typography variant="body-base" weight="bold" className={tx.type === 'TRANSFER' ? 'text-amber-500' : 'text-green-500'}>
                                            {tx.type === 'TRANSFER' ? '-' : '+'}{parseFloat(tx.amount).toLocaleString()} GTC
                                        </Typography>
                                        <Badge variant="outline" className="text-[10px] mt-1 opacity-70 uppercase">{tx.status}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <CreditCard className="h-12 w-12 text-muted/30 mx-auto mb-4" />
                            <Typography theme="muted">Aucune transaction trouvée</Typography>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
