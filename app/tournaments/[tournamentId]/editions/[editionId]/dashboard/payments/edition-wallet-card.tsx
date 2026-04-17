"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowUpRight, Wallet } from "lucide-react";
import { transferBetweenIdentities } from "@/actions/wallets";
import { useAuthContext } from "@/contexts/auth-context";

interface EditionWalletCardProps {
    editionId: string;
    editionStatus: string;
    balance: number;
}

export function EditionWalletCard({ editionId, editionStatus, balance }: EditionWalletCardProps) {
    const { user } = useAuthContext();
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const isFinished = editionStatus === "COMPLETED" || editionStatus === "CANCELLED";

    const handleWithdraw = async () => {
        if (!user) return;
        if (balance <= 0) {
            toast.error("Aucun revenu disponible.");
            return;
        }
        if (!isFinished) {
            toast.error("L'édition doit être terminée pour récupérer son GTC.");
            return;
        }

        setIsWithdrawing(true);
        try {
            const res = await transferBetweenIdentities({
                fromIdentityId: editionId,
                fromType: 'TOURNAMENT',
                toIdentityId: user.id,
                toType: 'USER',
                amount: balance,
                description: "Retrait des revenus de l'édition"
            });

            if (res.success) {
                toast.success("Retrait effectué vers votre compte personnel !");
                // Wait to refresh
                setTimeout(() => window.location.reload(), 2000);
            } else {
                toast.error(res.error || "Erreur lors du retrait.");
            }
        } catch (err) {
            toast.error("Erreur serveur inattendue.");
        } finally {
            setIsWithdrawing(false);
        }
    };

    return (
        <Card className="mb-8 border-none bg-gradient-to-br from-indigo-700 to-purple-800 text-white shadow-xl relative overflow-hidden">
            <CardContent className="p-8 relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                            <Wallet className="h-6 w-6 text-white" />
                        </div>
                        <Typography variant="body-sm" className="text-white/80 uppercase font-semibold tracking-wider">
                            Fonds Disponibles
                        </Typography>
                    </div>
                    <Typography variant="h1" className="text-4xl font-black tracking-tight">
                        {balance.toLocaleString()} <span className="text-xl font-normal opacity-70">GTC</span>
                    </Typography>
                </div>
                
                <div className="flex flex-col items-end w-full md:w-auto">
                    {!isFinished && (
                        <Typography variant="caption1" className="text-white/70 mb-2 italic">
                            Terminez l'édition pour debloquer le retrait
                        </Typography>
                    )}
                    <Button
                        onClick={handleWithdraw}
                        disabled={balance <= 0 || isWithdrawing || !isFinished}
                        size="lg"
                        className="bg-white text-indigo-900 hover:bg-white/90 font-bold w-full md:w-auto px-6 rounded-xl shadow-lg"
                    >
                        {isWithdrawing ? "Retrait en cours..." : "Retirer vers mon Wallet"}
                        <ArrowUpRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </CardContent>
            <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        </Card>
    );
}
