"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Wallet, User as UserIcon, ShieldCheck, Gift, Zap, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuthContext();

  useEffect(() => {
    const run = async () => {
      try {
        await refreshUser();
      } catch {
        router.push("/sign-in");
      }
    };
    run();
  }, [refreshUser, router]);

  const username =
    user?.fullName?.split(" ")?.[0] ||
    user?.username ||
    user?.email?.split("@")?.[0] ||
    "utilisateur";

  const defaultWalletName = `wallet_${username}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl rounded-3xl shadow-2xl bg-white/80 backdrop-blur border border-indigo-100 overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="flex flex-col items-center text-center gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white"
            >
              <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10" />
            </motion.div>
            <Typography variant="h2" weight="bold">
              Bienvenue, {username} !
            </Typography>
            <Typography variant="body-base" theme="muted" className="max-w-2xl">
              Votre compte est prêt. Débloquez toute la puissance du système en créant votre wallet sécurisé. Il vous permet d’envoyer et recevoir des fonds, payer vos achats, participer aux tournois et profiter de bonus exclusifs.
            </Typography>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            <Feature icon={<ShieldCheck className="w-5 h-5 text-green-600" />} title="Sécurisé">
              Protection par code PIN et chiffrement.
            </Feature>
            <Feature icon={<Zap className="w-5 h-5 text-yellow-600" />} title="Instantané">
              Transferts rapides et historiques clairs.
            </Feature>
            <Feature icon={<Gift className="w-5 h-5 text-pink-600" />} title="Bonus">
              Crédit de bienvenue offert à la création.
            </Feature>
          </div>

          <div className="mt-10 rounded-xl border bg-muted/30 p-4 text-center">
            <Typography variant="caption1" theme="muted">
              Nom par défaut du wallet: <span className="font-semibold">{defaultWalletName}</span>
            </Typography>
          </div>

          <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-4">
            <Link href="/wallet/create">
              <Button size="lg" className="gap-2">
                <Wallet className="w-5 h-5" />
                Créer mon wallet
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="gap-2">
                <UserIcon className="w-5 h-5" />
                Aller au tableau de bord
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          {icon}
        </div>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
