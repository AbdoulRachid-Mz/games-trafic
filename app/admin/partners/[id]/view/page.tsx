"use client";

import { useRouter, useParams } from "next/navigation";
import { usePartner } from "@/hooks/use-partners";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Building2,
    Globe,
    Mail,
    Phone,
    CheckCircle2,
    XCircle,
    Calendar,
    Edit,
    Loader2,
} from "lucide-react";

export default function ViewPartnerPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const { data: partner, isLoading } = usePartner(id);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!partner) {
        return (
            <div className="container py-8 text-center">
                <Typography variant="h2">Partner not found</Typography>
                <Button onClick={() => router.push("/admin/partners")} className="mt-4">
                    Return to list
                </Button>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl py-8">
            <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button onClick={() => router.push(`/admin/partners/${id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Partner
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <Card className="md:col-span-1">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-24 h-24 rounded-xl bg-muted flex items-center justify-center mb-4">
                            {partner.logo ? (
                                <img
                                    src={partner.logo}
                                    alt={partner.name}
                                    className="w-full h-full object-contain p-2"
                                />
                            ) : (
                                <Building2 className="h-12 w-12 text-muted-foreground" />
                            )}
                        </div>
                        <CardTitle className="line-clamp-1">{partner.name}</CardTitle>
                        <div className="flex flex-wrap justify-center gap-2 mt-2">
                            <Badge variant="outline">{partner.type}</Badge>
                            <Badge
                                variant={partner.status === "ACTIVE" ? "default" : "secondary"}
                            >
                                {partner.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 text-sm">
                            <div className="p-2 rounded-md bg-primary/10 text-primary">
                                {partner.verified ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                    <XCircle className="h-4 w-4" />
                                )}
                            </div>
                            <div>
                                <p className="font-medium">Verification</p>
                                <p className="text-muted-foreground whitespace-nowrap">
                                    {partner.verified ? "Verified Partner" : "Not Verified"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            <div className="p-2 rounded-md bg-green-500/10 text-green-500">
                                <Calendar className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="font-medium">Joined</p>
                                <p className="text-muted-foreground whitespace-nowrap">
                                    {new Date(partner.createdAt || "").toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Detailed Info */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Typography variant="body-base">
                                {partner.description || "No description provided."}
                            </Typography>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {partner.website && (
                                <div className="flex items-center gap-3">
                                    <Globe className="h-5 w-5 text-primary" />
                                    <a
                                        href={partner.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm hover:underline line-clamp-1"
                                    >
                                        {partner.website.replace(/^https?:\/\//, "")}
                                    </a>
                                </div>
                            )}
                            {partner.contactEmail && (
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-primary" />
                                    <a
                                        href={`mailto:${partner.contactEmail}`}
                                        className="text-sm hover:underline line-clamp-1"
                                    >
                                        {partner.contactEmail}
                                    </a>
                                </div>
                            )}
                            {partner.contactPhone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 text-primary" />
                                    <span className="text-sm">{partner.contactPhone}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
