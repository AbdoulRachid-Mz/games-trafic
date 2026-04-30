"use client";

import React from "react";
import { MessageSquare, Shield, Smartphone, Laptop, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ChatsPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-[var(--chat-background)] p-8 text-center">
      <div className="max-w-md space-y-3">
        <div className="flex justify-center">
          <div className="h-24 w-24 bg-[var(--chat-surface)] rounded-full flex items-center justify-center shadow-lg border border-[var(--chat-border)]">
            <MessageSquare className="h-12 w-12 text-[var(--chat-primary)]" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[var(--chat-text)]">
            GT Messenger
          </h1>
          <p className="text-[var(--chat-textMuted)]">
            Envoyez et recevez des messages sans avoir besoin de garder votre téléphone connecté.
            Utilisez GT Messenger sur jusqu'à 4 appareils liés et 1 téléphone en même temps.
          </p>
        </div>

        <div className="pt-4">
          <Button 
            className="bg-[var(--chat-primary)] hover:bg-[var(--chat-accentHover)] text-white px-6"
            asChild
          >
            <Link href="/chats">
              Commencer à discuter
              <ChevronRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        <div className="pt-4 border-t border-[var(--chat-border)]">
          <div className="flex items-center justify-center gap-2 text-sm text-[var(--chat-textMuted)]">
            <Shield className="h-4 w-4" />
            <span>Chiffré de bout en bout</span>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-6 pt-2 text-[var(--chat-textMuted)]">
          <div className="flex flex-col items-center gap-1">
            <Smartphone className="h-5 w-5" />
            <span className="text-[10px]">Mobile</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Laptop className="h-5 w-5" />
            <span className="text-[10px]">Desktop</span>
          </div>
        </div>
      </div>
    </div>
  );
}