"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, Sparkles, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthErrorHandler } from "@/lib/auth/errors";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  const errorInfo = message
    ? { message }
    : AuthErrorHandler.handleAuthError(error, {
        operation: "auth",
        timestamp: new Date(),
      });

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
          <CardContent className="p-8 md:p-10 bg-white/95 backdrop-blur-sm text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6"
            >
              <AlertCircle className="h-10 w-10 text-red-600" />
            </motion.div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Oups ! Une erreur est survenue
            </h1>

            <p className="text-sm text-slate-600 mb-6">
              {errorInfo.message}
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => window.location.href = "/sign-in"}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25"
              >
                Retour à la connexion
              </Button>

              <Link
                href="/"
                className="inline-flex items-center text-sm text-primary hover:text-primary/80"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Accueil
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function AuthErrorPage() {
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
      <AuthErrorContent />
    </Suspense>
  );
}