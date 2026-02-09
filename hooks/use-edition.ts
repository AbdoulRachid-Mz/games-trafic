"use client";

import { useState, useEffect, useCallback } from "react";
import { getTournamentEditionWithRelations } from "@/actions/editions";
import { TournamentEditionWithRelations } from "@/database/schema";
import { toast } from "sonner";

export function useEdition(editionId: string) {
    const [edition, setEdition] = useState<TournamentEditionWithRelations | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadEdition = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getTournamentEditionWithRelations(editionId);
            setEdition(data as any);
        } catch (err: any) {
            setError(err);
            toast.error("Erreur lors du chargement de l'édition");
        } finally {
            setIsLoading(false);
        }
    }, [editionId]);

    useEffect(() => {
        if (editionId) {
            loadEdition();
        }
    }, [editionId, loadEdition]);

    return {
        edition,
        isLoading,
        error,
        refresh: loadEdition,
    };
}
