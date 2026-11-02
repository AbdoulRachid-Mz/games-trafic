"use client";

import { useState } from "react";
import { z } from "zod";
import Link from "next/link";
import { useAuthContext } from "@/contexts/auth-context";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const emailSchema = z.object({
  email: z.string().email("Email invalide"),
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { forgotPassword } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword(email);
      setEmailSent(true);
      toast.success("Email de réinitialisation envoyé !");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi de l'email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center gap-2"
          >
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-3xl font-black text-secondary tracking-tight">
              Games<span className="text-primary">Trafics</span>
            </span>
          </motion.div>
        </div>

        <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-xl">
          <CardContent className="p-8 md:p-10 bg-white/95 backdrop-blur-sm">
            {emailSent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-slate-900">
                    Email envoyé !
                  </h1>
                  <p className="text-sm text-slate-600">
                    Nous avons envoyé un lien de réinitialisation à{" "}
                    <strong className="text-primary">{email}</strong>
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => setEmailSent(false)}
                    variant="outline"
                    className="w-full h-12"
                  >
                    Utiliser une autre adresse
                  </Button>

                  <Link
                    href="/sign-in"
                    className="block text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Retour à la connexion
                  </Link>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {/* Header */}
                <div className="space-y-2">
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Retour
                  </Link>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Mot de passe oublié ?
                  </h1>
                  <p className="text-sm text-slate-600">
                    Pas de panique ! Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      Adresse email
                    </label>
                    <Input
                      type="email"
                      placeholder="vous@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-12 border-slate-200"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      "Envoyer le lien"
                    )}
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}