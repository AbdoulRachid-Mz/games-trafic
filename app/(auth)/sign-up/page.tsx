"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, User, Phone, Sparkles, ChevronRight, Key } from "lucide-react";

// Schéma Zod
const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, "Le nom d'utilisateur doit contenir au moins 2 caractères"),
    email: z.string().email("Email invalide"),
    phoneNumber: z.string().optional(),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .regex(/[A-Z]/, "Doit contenir une majuscule")
      .regex(/[0-9]/, "Doit contenir un chiffre")
      .regex(/[^A-Za-z0-9]/, "Doit contenir un caractère spécial"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (e.target.name === "password") {
      setShowPasswordStrength(true);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthColor = 
    passwordStrength <= 25 ? "bg-red-500" :
    passwordStrength <= 50 ? "bg-orange-500" :
    passwordStrength <= 75 ? "bg-yellow-500" :
    "bg-green-500";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = signupSchema.safeParse(formData);
    if (!result.success) {
      setError(result.error.issues[0].message);
      setLoading(false);
      return;
    }

    const { error } = await authClient.signUp.email(
      {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        callbackURL: "/profile",
      },
      {
        onRequest: () => setLoading(true),
        onSuccess: () => {
          toast.success("Inscription réussie ! Bienvenue sur Games-Trafics.");
          router.push("/profile");
        },
        onError: (ctx) => {
          setError(ctx.error.message || "Erreur lors de l'inscription");
          setLoading(false);
        },
      }
    );
  };

  const handleGoogleSignUp = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/profile",
      errorCallbackURL: "/auth/error",
      newUserCallbackURL: "/profile",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-2 sm:px-4 lg:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-fit w-full"
      >
        {/* Logo */}
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
                      Créez votre compte
                    </h1>
                    <p className="text-sm text-slate-500">
                      Rejoignez la communauté Games-Trafics
                    </p>
                  </div>

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-xl"
                    >
                      {error}
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Username */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Nom d'utilisateur
                      </label>
                      <Input
                        name="name"
                        placeholder="Votre pseudo"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="h-11 border-slate-200"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        Email
                      </label>
                      <Input
                        name="email"
                        type="email"
                        placeholder="vous@exemple.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="h-11 border-slate-200"
                      />
                    </div>

                    {/* Phone (optional) */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        Téléphone (optionnel)
                      </label>
                      <Input
                        name="phoneNumber"
                        type="tel"
                        placeholder="+227 96 02 15 53"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        disabled={loading}
                        className="h-11 border-slate-200"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                        <Lock className="h-4 w-4" />
                        Mot de passe
                      </label>
                      <Input
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="h-11 border-slate-200"
                      />

                      {/* Password Strength */}
                      {showPasswordStrength && formData.password && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-1"
                        >
                          <div className="flex gap-1 h-1.5">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className={cn(
                                  "flex-1 rounded-full transition-colors",
                                  i * 25 <= passwordStrength ? strengthColor : "bg-slate-200"
                                )}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-slate-500">
                            {passwordStrength <= 25 && "Faible"}
                            {passwordStrength > 25 && passwordStrength <= 50 && "Moyen"}
                            {passwordStrength > 50 && passwordStrength <= 75 && "Bon"}
                            {passwordStrength > 75 && "Fort"}
                          </p>
                        </motion.div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Confirmer le mot de passe
                      </label>
                      <Input
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="h-11 border-slate-200"
                      />
                    </div>

                    {/* Password requirements */}
                    <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                      <p className="text-xs font-medium text-slate-700">Exigences :</p>
                      <ul className="text-xs text-slate-500 space-y-1">
                        {[
                          "Minimum 8 caractères",
                          "Au moins une majuscule",
                          "Au moins un chiffre",
                          "Au moins un caractère spécial",
                        ].map((req, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <span className={cn(
                              "w-1 h-1 rounded-full",
                              i === 0 && formData.password.length >= 8 && "bg-green-500",
                              i === 1 && /[A-Z]/.test(formData.password) && "bg-green-500",
                              i === 2 && /[0-9]/.test(formData.password) && "bg-green-500",
                              i === 3 && /[^A-Za-z0-9]/.test(formData.password) && "bg-green-500",
                              (!formData.password || 
                                (i === 0 && formData.password.length < 8) ||
                                (i === 1 && !/[A-Z]/.test(formData.password)) ||
                                (i === 2 && !/[0-9]/.test(formData.password)) ||
                                (i === 3 && !/[^A-Za-z0-9]/.test(formData.password))) && "bg-slate-300"
                            )} />
                            {req}
                          </li>
                        ))}
                      </ul>
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
                        "Créer mon compte"
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
                        Ou s'inscrire avec
                      </span>
                    </div>
                  </div>

                  {/* Google Only */}
                  <Button
                    variant="outline"
                    onClick={handleGoogleSignUp}
                    disabled={loading}
                    className="w-full h-12 border-slate-200 hover:bg-slate-50"
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
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
                  </Button>

                  {/* Sign In Link */}
                  <p className="text-center text-sm text-slate-500">
                    Déjà un compte ?{" "}
                    <Link
                      href="/sign-in"
                      className="font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      Se connecter
                    </Link>
                  </p>
                </div>
              </div>

              {/* Image Section */}
              <div className="hidden md:block relative bg-gradient-to-br from-primary to-purple-600 p-10">
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative h-full flex flex-col justify-end text-white">
                  {/* logo */}
                  <div className="w-full h-full flex items-center justify-center relative">
                    <Image src="/images/icons/app/gt-primary.png" alt="logo" fill className="object-contain" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Rejoignez l'aventure</h2>
                  <p className="text-white/80 text-sm mb-6">
                    Découvrez une plateforme unique dédiée aux gamers
                  </p>
                  <div className="space-y-3">
                    {[
                      "🎮 Accès à des milliers de comptes et outils de jeux",
                      "🏆 Tournois exclusifs et cash prizes",
                      "💬 Communauté active et passionnée",
                      "🔐 Authentification sécurisée par passkey",
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
          En vous inscrivant, vous acceptez nos{" "}
          <Link href="/docs/legal/terms" className="text-white/60 hover:text-white underline underline-offset-2">
            conditions d'utilisation
          </Link>{" "}
          et notre{" "}
          <Link href="/docs/legal/privacy" className="text-white/60 hover:text-white underline underline-offset-2">
            politique de confidentialité
          </Link>
        </p>
      </motion.div>
    </div>
  );
}