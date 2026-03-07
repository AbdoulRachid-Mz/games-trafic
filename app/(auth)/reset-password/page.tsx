"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthContext } from "@/contexts/auth-context";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Sparkles, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState("");

  const { resetPassword, verifyResetToken } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false);
        setIsVerifying(false);
        return;
      }

      try {
        const result = await verifyResetToken(token);
        setEmail(result as unknown as string);
        setTokenValid(true);
      } catch (error: any) {
        setTokenValid(false);
        toast.error("Lien de réinitialisation invalide ou expiré");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token, verifyResetToken]);

  const getPasswordStrength = (password: string) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthColor = 
    passwordStrength <= 25 ? "bg-red-500" :
    passwordStrength <= 50 ? "bg-orange-500" :
    passwordStrength <= 75 ? "bg-yellow-500" :
    "bg-green-500";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (!token) {
      toast.error("Token de réinitialisation manquant");
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(token, password);
      toast.success("Mot de passe réinitialisé avec succès !");
      router.push("/sign-in");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la réinitialisation");
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-xl">
          <CardContent className="p-8 bg-white/95 backdrop-blur-sm">
            <div className="text-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"
              />
              <p className="text-sm text-slate-600">
                Vérification du lien de réinitialisation...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-xl">
            <CardContent className="p-8 bg-white/95 backdrop-blur-sm text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  Lien invalide
                </h1>
                <p className="text-sm text-slate-600">
                  Ce lien de réinitialisation est invalide ou a expiré.
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  href="/forgot-password"
                  className="block w-full py-3 px-4 bg-gradient-to-r from-primary to-purple-600 text-white font-semibold rounded-lg hover:from-primary/90 hover:to-purple-600/90 transition-colors"
                >
                  Demander un nouveau lien
                </Link>

                <Link
                  href="/sign-in"
                  className="block text-sm text-primary hover:text-primary/80"
                >
                  Retour à la connexion
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
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
            <span className="text-3xl font-black text-white tracking-tight">
              Games<span className="text-primary">Trafics</span>
            </span>
          </motion.div>
        </div>

        <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-xl">
          <CardContent className="p-8 md:p-10 bg-white/95 backdrop-blur-sm">
            <div className="space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  Nouveau mot de passe
                </h1>
                <p className="text-sm text-slate-600">
                  Créez un nouveau mot de passe pour votre compte{" "}
                  <strong className="text-primary">{email}</strong>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                    <Lock className="h-4 w-4" />
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-12 border-slate-200 pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength */}
                  {password && (
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
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-12 border-slate-200 pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password match indicator */}
                {confirmPassword && (
                  <div className="flex items-center gap-1 text-xs">
                    {password === confirmPassword ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-green-600">Les mots de passe correspondent</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 text-red-500" />
                        <span className="text-red-600">Les mots de passe ne correspondent pas</span>
                      </>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || password !== confirmPassword}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg shadow-primary/25 disabled:opacity-50"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    "Réinitialiser le mot de passe"
                  )}
                </Button>

                <Link
                  href="/sign-in"
                  className="block text-center text-sm text-primary hover:text-primary/80"
                >
                  Retour à la connexion
                </Link>
              </form>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-xl">
          <CardContent className="p-8 bg-white/95 backdrop-blur-sm">
            <div className="text-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"
              />
              <p className="text-sm text-slate-600">Chargement...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}