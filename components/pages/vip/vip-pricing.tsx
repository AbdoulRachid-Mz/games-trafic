"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Check, Star, Crown, Zap, ShieldCheck } from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { QrCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransactionQRCode } from "@/components/shared/qr-code";
import { encodeTransactionQR } from "@/utils/qr-utils";

import { useUserProfile } from "@/hooks/use-profile";

interface VipPricingProps {
  prices: {
    monthly: number;
    yearly: number;
    lifetime: number; // Prix personnalisé ou 0 si non défini
  };
  highlightedPlan?: string | null;
}

export function VipPricing({ prices, highlightedPlan }: VipPricingProps) {
  const { user } = useAuthContext();
  const { data: completeData } = useUserProfile(!!user);
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const plans = [
    {
      id: "MONTHLY",
      name: "Mensuel",
      price: prices.monthly,
      period: "/ mois",
      description: "Idéal pour commencer",
      features: [
        "Création de tournois limités",
        "1 Boutique active",
        "Badge VIP Bronze",
        "Support prioritaire",
      ],
      icon: Star,
      color: "text-blue-400",
      bgGradient: "from-blue-500/10 to-transparent",
      borderColor: "border-blue-500/20",
    },
    {
      id: "YEARLY",
      name: "Annuel",
      price: prices.yearly,
      period: "/ an",
      description: "Le plus populaire (2 mois offerts)",
      features: [
        "Tout du plan Mensuel",
        "Création de tournois illimités",
        "3 Boutiques actives",
        "Badge VIP Argent",
        "Frais de transaction réduits",
        "Création de thèmes",
      ],
      icon: Zap,
      color: "text-purple-400",
      bgGradient: "from-purple-500/10 to-transparent",
      borderColor: "border-purple-500/50",
      popular: true,
    },
    {
      id: "LIFETIME",
      name: "À Vie",
      price: prices.lifetime > 0 ? prices.lifetime : 9999, // Fallback si 0
      period: "une fois",
      description: "L'expérience ultime sans limite",
      features: [
        "Accès illimité à TOUT",
        "Boutiques illimitées",
        "Badge VIP Gold & Unique",
        "0% de frais supplémentaires",
        "Statut Fondateur",
        "Accès anticipé aux nouveautés",
      ],
      icon: Crown,
      color: "text-yellow-400",
      bgGradient: "from-yellow-500/10 to-transparent",
      borderColor: "border-yellow-500/50",
    },
  ];

  const handleSubscribe = (planId: string, price: number) => {
    if (!user) {
      toast.error("Vous devez être connecté pour souscrire");
      router.push("/auth/login?next=/vip");
      return;
    }

    setLoadingPlan(planId);

    // Vérifier si l'utilisateur a un wallet
    if (!completeData?.wallet) {
      toast.info("Vous avez besoin d'un portefeuille pour payer l'abonnement");
      setTimeout(() => {
        router.push("/wallet/create?next=/vip");
      }, 1500);
      return;
    }

    // Rediriger vers la page de transaction
    const params = new URLSearchParams({
      type: "VIP_SUBSCRIPTION",
      amount: price.toString(),
      entityData: JSON.stringify({ plan: planId }),
    });

    router.push(`/wallet/transactions/create?${params.toString()}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
      {plans.map((plan, index) => {
        const isHighlighted = highlightedPlan === plan.id;
        const Icon = plan.icon;

        return (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: isHighlighted ? 1.05 : 1,
            }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className={cn("relative", isHighlighted && "z-10")}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-0 right-0 flex justify-center z-20">
                <span className="bg-linear-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  POPULAIRE
                </span>
              </div>
            )}

            <Card
              className={cn(
                "h-full flex flex-col border-2 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2",
                plan.borderColor,
                isHighlighted
                  ? "shadow-2xl ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "shadow-md"
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 bg-linear-to-b opacity-50 pointer-events-none",
                  plan.bgGradient
                )}
              />

              <CardHeader className="text-center pb-2 relative z-10">
                <div
                  className={cn(
                    "mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-background/50 backdrop-blur-sm mb-4 border",
                    plan.borderColor
                  )}
                >
                  <Icon className={cn("h-6 w-6", plan.color)} />
                </div>
                <Typography
                  variant="h3"
                  className="font-bold uppercase tracking-wider text-sm text-muted-foreground"
                >
                  {plan.name}
                </Typography>
                <div className="flex items-baseline justify-center gap-1 mt-2">
                  <Typography variant="h1" className="font-black text-4xl">
                    {plan.price} GTC
                  </Typography>
                  <span className="text-muted-foreground text-sm font-medium">
                    {plan.period}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {plan.description}
                </p>
              </CardHeader>

              <CardContent className="flex-1 relative z-10">
                <div className="my-6 border-t border-border/50" />
                <ul className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <div
                        className={cn(
                          "mt-0.5 rounded-full p-0.5",
                          plan.popular
                            ? "bg-purple-500/20 text-purple-500"
                            : "bg-secondary text-muted-foreground"
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="relative z-10 pt-2">
                <Button
                  className={cn(
                    "w-full h-12 text-lg font-bold shadow-lg transition-all",
                    plan.popular
                      ? "bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                      : ""
                  )}
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan.id, plan.price)}
                  disabled={loadingPlan !== null}
                >
                  {loadingPlan === plan.id ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
                      Chargement...
                    </span>
                  ) : (
                    "Choisir ce plan"
                  )}
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full mt-2 h-10 rounded-xl gap-2 font-bold text-muted-foreground hover:text-primary">
                      <QrCode className="h-4 w-4" />
                      Payer par QR
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/50 rounded-[2.5rem] p-0 overflow-hidden">
                    <div className="p-8">
                      <DialogHeader className="mb-6">
                        <DialogTitle className="font-black italic uppercase tracking-tighter text-2xl">Paiement VIP</DialogTitle>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Scannez pour activer votre abonnement {plan.name}</p>
                      </DialogHeader>
                      <div className="flex justify-center">
                        <TransactionQRCode
                          data={encodeTransactionQR({
                            t: "VIP_SUBSCRIPTION",
                            id: plan.id,
                            a: plan.price,
                            m: { plan: plan.id }
                          })}
                          label={`VIP ${plan.name}`}
                          className="shadow-none border-none p-0 bg-transparent"
                        />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
