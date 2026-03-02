"use client";

import { Suspense } from "react";
import AuthErrorUI from "./auth-error-ui";

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <AuthErrorUI />
      {/* <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-sm text-gray-600">
            Une erreur s'est produite. Veuillez réessayer.
          </p>
        </div>
      </div> */}
    </Suspense>
  );
}
