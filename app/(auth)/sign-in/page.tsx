"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Key, Mail, Lock, ChevronRight, Sparkles, FingerprintPattern } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// Schéma de validation Zod
const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [lastMethod, setLastMethod] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const method = authClient.getLastUsedLoginMethod?.() || null;
    setLastMethod(method);

    // Auto-fill passkey si disponible
    if (typeof window !== "undefined" && window.PublicKeyCredential) {
      void PublicKeyCredential.isConditionalMediationAvailable?.().then((available) => {
        if (available) {
          // Ne pas afficher d'erreur pour l'auto-fill
          void authClient.signIn.passkey({ autoFill: true }).catch(() => {
            // Ignorer silencieusement les erreurs d'auto-fill
          });
        }
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    // Validation Zod
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      setFieldErrors({
        email: errors.email?.[0],
        password: errors.password?.[0],
      });
      setLoading(false);
      return;
    }

    const { error } = await authClient.signIn.email(
      {
        email,
        password,
        callbackURL: "/profile",
        rememberMe: true,
      },
      {
        onRequest: () => setLoading(true),
        onSuccess: () => {
          toast.success("Connexion réussie !");
          router.push("/profile");
        },
        onError: (ctx) => {
          setError(ctx.error.message || "Erreur lors de la connexion");
          setLoading(false);
        },
      }
    );
  };

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social(
      {
        provider: "google",
        callbackURL: "/profile",
        errorCallbackURL: "/auth/error",
      },
      {
        onRequest: () => setLoading(true),
        onError: (ctx) => {
          setError(ctx.error.message || "Erreur avec Google");
          setLoading(false);
        },
      }
    );
  };

  const handlePasskeySignIn = async () => {
    const { error } = await authClient.signIn.passkey({
      autoFill: false,
    });

    if (error) {
      // Ne pas afficher d'erreur si l'utilisateur a simplement annulé
      if (error.message?.includes('abort')) {
        console.log('Authentification annulée par l\'utilisateur');
        return;
      }
      toast.error("Échec de l'authentification : " + error.message);
    } else {
      toast.success("Connexion réussie avec Passkey !");
      router.push("/profile");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-2 sm:px-4 lg:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-fit w-full"
      >
        {/* Logo/Brand */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center gap-2"
          >
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-3xl font-black text-white tracking-tight">
              Games<span className="text-primary">Trafics</span>
            </span>
          </motion.div>
        </div>

        <Card className="overflow-hidden border-0 py-0 shadow-2xl bg-white/10 backdrop-blur-xl">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-2">
              {/* Form Section */}
              <div className="p-4 md:p-6 bg-white/95 backdrop-blur-sm">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Content de vous revoir
                    </h1>
                    <p className="text-sm text-slate-500">
                      Connectez-vous à votre compte Games-Trafics
                    </p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-xl"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Last Method Badge */}
                  {lastMethod === "email" && (
                    <Badge variant="secondary" className="gap-1">
                      <Mail className="h-3 w-3" />
                      Dernière connexion par email
                    </Badge>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email Field */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        Email
                      </label>
                      <Input
                        type="email"
                        placeholder="vous@exemple.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        autoComplete="username webauthn"
                        className="h-12 border-slate-200 focus:border-primary focus:ring-primary"
                      />
                      {fieldErrors.email && (
                        <p className="text-xs text-red-500 mt-1">
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                          <Lock className="h-4 w-4" />
                          Mot de passe
                        </label>
                        <Link
                          href="/forgot-password"
                          className="text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          Mot de passe oublié ?
                        </Link>
                      </div>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        autoComplete="current-password webauthn"
                        className="h-12 border-slate-200 focus:border-primary focus:ring-primary"
                      />
                      {fieldErrors.password && (
                        <p className="text-xs text-red-500 mt-1">
                          {fieldErrors.password}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg shadow-primary/25"
                    >
                      {loading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        "Se connecter"
                      )}
                    </Button>
                  </form>

                  {/* Separator */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-4 text-slate-500">
                        Ou continuer avec
                      </span>
                    </div>
                  </div>

                  {/* Social & Passkey Buttons */}
                  <div className="space-y-3">
                    {/* Google Button */}
                    <Button
                      variant="outline"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="w-full h-12 border-slate-200 hover:bg-slate-50 relative overflow-hidden group"
                    >
                      <svg
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      <span className="text-slate-700">Google</span>
                      {lastMethod === "google" && (
                        <Badge variant="secondary" className="absolute -top-1 -right-1 scale-75">
                          Dernier
                        </Badge>
                      )}
                    </Button>

                    {/* Passkey Button */}
                    <Button
                      variant="outline"
                      onClick={handlePasskeySignIn}
                      disabled={loading}
                      className="w-full h-12 border-slate-200 hover:bg-slate-50 group"
                    >
                      {/* <Key className="h-5 w-5 mr-2 text-primary" /> */}
                      <FingerprintPattern className="h-5 w-5 mr-2 text-primary" />
                      <span className="text-slate-700">Se connecter avec une Passkey</span>
                      <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-0">
                        Nouveau
                      </Badge>
                    </Button>
                  </div>

                  {/* Sign Up Link */}
                  <p className="text-center text-sm text-slate-500">
                    Pas encore de compte ?{" "}
                    <Link
                      href="/sign-up"
                      className="font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      S'inscrire
                    </Link>
                  </p>
                </div>
              </div>

              {/* Image Section */}
              <div className="hidden md:block relative bg-gradient-to-br from-primary to-purple-600 p-10">
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative h-full flex flex-col justify-end text-white">
                  <h2 className="text-2xl font-bold mb-2">Bienvenue sur GamesTrafics</h2>
                  <p className="text-white/80 text-sm">
                    La plateforme de gaming qui connecte les passionnés
                  </p>
                  <div className="mt-6 space-y-3">
                    {[
                      "🎮 Achète et vends des comptes de jeux",
                      "🏆 Participe à des tournois exclusifs",
                      "💬 Connecte-toi avec la communauté",
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="flex items-center gap-2 text-sm"
                      >
                        <ChevronRight className="h-4 w-4 text-white/60" />
                        {item}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <p className="text-center text-xs text-white/40 mt-6">
          En continuant, vous acceptez nos{" "}
          <Link href="/terms" className="text-white/60 hover:text-white underline underline-offset-2">
            conditions d'utilisation
          </Link>{" "}
          et notre{" "}
          <Link href="/privacy" className="text-white/60 hover:text-white underline underline-offset-2">
            politique de confidentialité
          </Link>
        </p>
      </motion.div>
    </div>
  );
}