"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface EditionRevealTriggerProps {
  tournamentId: string;
  editionId: string;
  hasStructure: boolean;
  status?: string;
}

/**
 * Composant client invisible déclenchant la redirection vers la page de révélation
 * une seule et unique fois par utilisateur lors de sa première visite sur l'édition.
 */
export function EditionRevealTrigger({
  tournamentId,
  editionId,
  hasStructure,
  status,
}: EditionRevealTriggerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getItem, setItem, isClient } = useLocalStorage();
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!isClient || hasTriggeredRef.current) return;

    // Éviter les boucles de redirection si explicitement désactivé ou déjà révélé
    const noRevealParam = searchParams.get("noreveal") === "1";
    const alreadyRevealedParam = searchParams.get("revealed") === "1";
    if (noRevealParam || alreadyRevealedParam) {
      if (alreadyRevealedParam) {
        setItem(`gt_edition_revealed_${editionId}`, true);
      }
      return;
    }

    // Vérifier si l'édition a été publiée ou dispose d'une structure
    const isEligibleStatus = status && status !== "DRAFT" && status !== "CANCELLED";
    if (!hasStructure && !isEligibleStatus) return;

    // Vérification du localStorage
    const storageKey = `gt_edition_revealed_${editionId}`;
    const isRevealed = getItem(storageKey);

    if (!isRevealed) {
      hasTriggeredRef.current = true;
      // Rediriger vers la page dédiée de révélation
      router.push(
        `/tournaments/${tournamentId}/editions/${editionId}/reveal?autoRedirect=true&from=first_visit`
      );
    }
  }, [isClient, tournamentId, editionId, hasStructure, status, searchParams, getItem, setItem, router]);

  return null;
}
