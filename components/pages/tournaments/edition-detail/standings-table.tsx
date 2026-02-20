"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StandingRow {
    registrationId: string;
    points: number;
    matchesPlayed: number;
    matchesWon: number;
    matchesDrawn: number;
    matchesLost: number;
    scoreFor: number;
    scoreAgainst: number;
    scoreDifference: number;
    position?: number;
    qualified?: boolean;
    participantName?: string;
    participantImage?: string;
}

interface StandingGroup {
    groupId: string;
    groupName: string;
    rows: StandingRow[];
}

interface StandingsTableProps {
    groups: StandingGroup[];
    registrations?: any[];
    title?: string;
    showFilter?: boolean;
}

export function StandingsTable({
    groups,
    registrations = [],
    title = "Classement",
    showFilter = true,
}: StandingsTableProps) {
    const [selectedGroupId, setSelectedGroupId] = useState<string>(
        groups[0]?.groupId || ""
    );

    const activeGroup = useMemo(() => {
        return groups.find((g) => g.groupId === selectedGroupId) || groups[0];
    }, [groups, selectedGroupId]);

    if (!activeGroup) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-card border rounded-xl">
                Aucun classement disponible.
            </div>
        );
    }

    // Sorting logic based on prompt: Points, Goal difference, Victoires
    const sortedRows = [...activeGroup.rows].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.scoreDifference !== a.scoreDifference)
            return b.scoreDifference - a.scoreDifference;
        if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
        return 0;
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {title && <Typography variant="h4" weight="bold">{title}</Typography>}

                {showFilter && groups.length > 1 && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Groupe :</span>
                        <Select
                            value={selectedGroupId}
                            onValueChange={setSelectedGroupId}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Choisir un groupe" />
                            </SelectTrigger>
                            <SelectContent>
                                {groups.map((group) => (
                                    <SelectItem key={group.groupId} value={group.groupId}>
                                        {group.groupName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            <Card className="overflow-hidden border-none shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr className="text-muted-foreground">
                                <th className="text-left p-4 w-12 font-medium">#</th>
                                <th className="text-left p-4 font-medium">Participant</th>
                                <th className="text-center p-4 font-bold text-foreground">Pts</th>
                                <th className="text-center p-4 font-medium">J</th>
                                <th className="text-center p-4 font-medium">V</th>
                                <th className="text-center p-4 font-medium">N</th>
                                <th className="text-center p-4 font-medium">D</th>
                                <th className="text-center p-4 font-medium">+/-</th>
                                <th className="text-center p-4 font-medium">Diff.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {sortedRows.map((row, idx) => {
                                const reg = registrations.find((r) => r.id === row.registrationId);
                                const member = reg?.member;
                                const user = member?.user;
                                const name = row.participantName || member?.displayName || user?.name || user?.username || "Joueur";
                                const image = row.participantImage || member?.avatar || user?.image;

                                return (
                                    <tr
                                        key={row.registrationId}
                                        className="hover:bg-accent/5 transition-colors"
                                    >
                                        <td className="p-4 font-bold text-muted-foreground whitespace-nowrap">
                                            {row.position || idx + 1}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border-2 border-background ring-2 ring-slate-100">
                                                    <AvatarImage src={image} />
                                                    <AvatarFallback className="text-[10px] bg-slate-50">
                                                        {name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm whitespace-nowrap">{name}</span>
                                                    {row.qualified && (
                                                        <span className="text-[10px] text-green-600 font-medium leading-none">Qualifié</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-black">
                                                {row.points}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center font-medium">{row.matchesPlayed}</td>
                                        <td className="p-4 text-center text-green-600">{row.matchesWon}</td>
                                        <td className="p-4 text-center text-amber-600">{row.matchesDrawn}</td>
                                        <td className="p-4 text-center text-destructive">{row.matchesLost}</td>
                                        <td className="p-4 text-center text-muted-foreground tabular-nums">
                                            {row.scoreFor}/{row.scoreAgainst}
                                        </td>
                                        <td className="p-4 text-center font-bold">
                                            {row.scoreDifference > 0 ? `+${row.scoreDifference}` : row.scoreDifference}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
