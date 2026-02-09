"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/auth-context";
import { useCreatePartner } from "@/hooks/use-partners";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { CreatePartnerInput } from "@/validations/partners";

const PARTNER_TYPES = [
    { value: "SPONSOR", label: "Sponsor" },
    { value: "MEDIA", label: "Media" },
    { value: "TECHNOLOGY", label: "Technology" },
    { value: "FINANCIAL", label: "Financial" },
    { value: "ESPORTS", label: "Esports" },
    { value: "GAMING", label: "Gaming" },
    { value: "STREAMING", label: "Streaming" },
    { value: "EQUIPMENT", label: "Equipment" },
    { value: "FOOD_BEVERAGE", label: "Food & Beverage" },
    { value: "FASHION", label: "Fashion" },
    { value: "TELECOM", label: "Telecom" },
    { value: "SOFTWARE", label: "Software" },
    { value: "HARDWARE", label: "Hardware" },
    { value: "PUBLISHER", label: "Publisher" },
    { value: "DISTRIBUTOR", label: "Distributor" },
    { value: "OTHER", label: "Other" },
];

const PARTNER_STATUS = [
    { value: "PENDING", label: "Pending" },
    { value: "ACTIVE", label: "Active" },
    { value: "PAUSED", label: "Paused" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "EXPIRED", label: "Expired" },
];

export default function CreatePartnerPage() {
    const router = useRouter();
    const { user } = useAuthContext();
    const createPartner = useCreatePartner();

    const [formData, setFormData] = useState<Partial<CreatePartnerInput>>({
        name: "",
        legalName: "",
        description: "",
        shortDescription: "",
        type: "SPONSOR",
        website: "",
        contactEmail: "",
        contactPhone: "",
        status: "PENDING",
        verified: false,
        isActive: true,
        isVisible: true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.id) {
            toast.error("You must be logged in to create a partner");
            return;
        }

        if (!formData.name || !formData.type) {
            toast.error("Name and type are required");
            return;
        }

        try {
            await createPartner.mutateAsync({
                data: formData as CreatePartnerInput,
                userId: user.id,
            });
            router.push("/admin/partners");
        } catch (error) {
            console.error("Error creating partner:", error);
        }
    };

    return (
        <div className="container max-w-4xl py-8">
            <Button variant="ghost" onClick={() => router.back()} className="mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Create New Partner</CardTitle>
                    <Typography variant="body-sm" theme="muted">
                        Add a new partner to the platform
                    </Typography>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <Typography variant="h3" weight="semibold">
                                Basic Information
                            </Typography>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="legalName">Legal Name</Label>
                                    <Input
                                        id="legalName"
                                        value={formData.legalName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, legalName: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="shortDescription">Short Description</Label>
                                <Input
                                    id="shortDescription"
                                    value={formData.shortDescription}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            shortDescription: e.target.value,
                                        })
                                    }
                                    placeholder="Brief description (max 160 characters)"
                                    maxLength={160}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    rows={4}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Typography variant="h3" weight="semibold">
                                Partner Details
                            </Typography>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">
                                        Type <span className="text-destructive">*</span>
                                    </Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, type: value as any })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PARTNER_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, status: value as any })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PARTNER_STATUS.map((status) => (
                                                <SelectItem key={status.value} value={status.value}>
                                                    {status.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Typography variant="h3" weight="semibold">
                                Contact Information
                            </Typography>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="website">Website</Label>
                                    <Input
                                        id="website"
                                        type="url"
                                        value={formData.website}
                                        onChange={(e) =>
                                            setFormData({ ...formData, website: e.target.value })
                                        }
                                        placeholder="https://example.com"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="contactEmail">Contact Email</Label>
                                    <Input
                                        id="contactEmail"
                                        type="email"
                                        value={formData.contactEmail}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                contactEmail: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="contactPhone">Contact Phone</Label>
                                    <Input
                                        id="contactPhone"
                                        type="tel"
                                        value={formData.contactPhone}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                contactPhone: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createPartner.isPending}>
                                {createPartner.isPending ? "Creating..." : "Create Partner"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
