"use client";

import { Suspense } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/auth-context";

function AuthCallbackContent() {
  const router = useRouter();
  const { refreshUser } = useAuthContext();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Vérifier si l'authentification a réussi
        await refreshUser();
        
        toast.success("Connexion réussie !");
        router.push("/dashboard");
      } catch (error) {
        console.error("Auth callback error:", error);
        toast.error("Erreur lors de la connexion");
        router.push("/sign-in");
      }
    };

    handleCallback();
  }, [router, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <h2 className="text-2xl font-bold text-gray-900">Connexion en cours</h2>
        <p className="text-sm text-gray-600">Veuillez patienter pendant que nous vous connectons...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <h2 className="text-2xl font-bold text-gray-900">Connexion en cours</h2>
          <p className="text-sm text-gray-600">Veuillez patienter pendant que nous vous connectons...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}