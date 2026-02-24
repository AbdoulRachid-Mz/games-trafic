// app/marketplace/[productId]/dashboard/layout.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Typography } from "@/components/ui/typography";

export default function ProductDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Header Shell */}
      <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-primary/10 hover:text-primary transition-all"
              onClick={() => router.back()}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Typography variant="body-base" weight="bold" className="hidden sm:block">
              Tableau de bord Vendeur
            </Typography>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <span className="text-xs font-bold text-primary">GT</span>
            </div>
          </div>
        </div>
      </header>

      <main className="animate-in fade-in duration-700">
        {children}
      </main>
    </div>
  );
}
