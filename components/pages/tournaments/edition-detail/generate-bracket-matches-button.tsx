"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, Swords } from "lucide-react";
import { generateBracketMatches } from "@/actions/phases";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface GenerateBracketMatchesButtonProps {
  bracketNodeId: string;
  hasMatches: boolean;
  participantsCount: number;
}

export function GenerateBracketMatchesButton({
  bracketNodeId,
  hasMatches,
  participantsCount,
}: GenerateBracketMatchesButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleGenerate = () => {
    if (participantsCount < 2) {
      toast.error("Au moins 2 participants sont nécessaires pour générer des matchs.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await generateBracketMatches(bracketNodeId, {
          forceRecreate: true,
          returnType: "single",
        });
        toast.success(`${res.count} match(s) généré(s) avec succès.`);
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la génération des matchs.");
      }
    });
  };

  if (hasMatches) return null;

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="gap-2 h-8 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-bold"
      onClick={handleGenerate}
      disabled={isPending || participantsCount < 2}
    >
      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
      Générer Matchs
    </Button>
  );
}
