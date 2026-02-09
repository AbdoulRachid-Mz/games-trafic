"use client";

import { useState, useEffect, useCallback } from "react";
import { getTournamentMemberById } from "@/actions/members";
import { toast } from "sonner";

export function useMember(memberId: string) {
    const [member, setMember] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadMember = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getTournamentMemberById(memberId);
            setMember(data);
        } catch (err: any) {
            setError(err);
            toast.error("Erreur lors du chargement du membre");
        } finally {
            setIsLoading(false);
        }
    }, [memberId]);

    useEffect(() => {
        if (memberId) {
            loadMember();
        }
    }, [memberId, loadMember]);

    return {
        member,
        isLoading,
        error,
        refresh: loadMember,
    };
}
