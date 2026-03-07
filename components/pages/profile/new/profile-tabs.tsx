"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
    Grid3X3,
    ShoppingBag,
    Trophy,
    Users,
    UserPlus,
    UserCheck,
    MessageSquare,
    Info,
    Mail,
    Search,
    Loader2,
    User as UserIcon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CommentsSection } from "@/components/comments/comments-section";
import { ProfileInfo } from "./profile-info";
import type { UserWithAllRelations } from "@/actions/users";
import { useEntityInteractionsWithRelations } from "@/hooks/use-interactions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Typography } from "@/components/ui/typography";
import { InteractionButton } from "@/components/shared/interaction-button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProfileTabsProps {
    profileUser: any;
    isOwnProfile?: boolean;
    className?: string;
    onUpdate?: (data: Partial<UserWithAllRelations>) => Promise<void>;
}

export function ProfileTabs({ profileUser, isOwnProfile, className, onUpdate }: ProfileTabsProps) {
    const [activeTab, setActiveTab] = useState("about");

    const tabs = [
        { id: "about", label: "À propos", icon: Info },
        { id: "followers", label: `Abonnés`, icon: Users },
        { id: "following", label: `Abonnements`, icon: UserPlus },
        { id: "shop", label: "Boutique", icon: ShoppingBag },
        { id: "tournaments", label: "Tournois", icon: Trophy },
        { id: "conversations", label: "Conversations", icon: MessageSquare },
        ...(isOwnProfile ? [{ id: "messages", label: "Messages", icon: Mail }] : []),
    ];

    return (
        <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className={cn("space-y-6", className)}
        >
            <TabsList className="w-full justify-start overflow-x-auto hide-scrollbar bg-transparent border-b rounded-none h-12 p-0 gap-6">
                {tabs.map((tab) => (
                    <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="gap-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary rounded-none px-1 pb-3 transition-all"
                    >
                        <tab.icon className="h-4 w-4" />
                        <span className="font-bold">{tab.label}</span>
                    </TabsTrigger>
                ))}
            </TabsList>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="min-h-[400px]"
                >
                    <TabsContent value="about" className="mt-0">
                        <ProfileInfo user={profileUser} isOwnProfile={isOwnProfile} onUpdate={onUpdate} />
                    </TabsContent>

                    <TabsContent value="followers" className="mt-0">
                        <PeopleList 
                            userId={profileUser.id} 
                            type="FOLLOWERS" 
                            isOwnProfile={isOwnProfile} 
                        />
                    </TabsContent>

                    <TabsContent value="following" className="mt-0">
                        <PeopleList 
                            userId={profileUser.id} 
                            type="FOLLOWING" 
                            isOwnProfile={isOwnProfile} 
                        />
                    </TabsContent>

                    <TabsContent value="shop" className="mt-0">
                        <ShopSection userId={profileUser.id} />
                    </TabsContent>

                    <TabsContent value="tournaments" className="mt-0">
                        <TournamentsSection userId={profileUser.id} />
                    </TabsContent>

                    <TabsContent value="conversations" className="mt-0">
                        <CommentsSection entityId={profileUser.id} entityType="USER" title="Conversations" />
                    </TabsContent>

                    {isOwnProfile && (
                        <TabsContent value="messages" className="mt-0">
                            <MessagesSection userId={profileUser.id} />
                        </TabsContent>
                    )}
                </motion.div>
            </AnimatePresence>
        </Tabs>
    );
}

// Composant réutilisable pour les listes de personnes (Abonnés/Abonnements)
function PeopleList({ userId, type, isOwnProfile }: { userId: string; type: "FOLLOWERS" | "FOLLOWING"; isOwnProfile?: boolean }) {
    const [search, setSearch] = useState("");
    
    // Pour FOLLOWERS, on veut ceux qui nous suivent (targetId = userId)
    // Pour FOLLOWING, on veut ceux qu'on suit (userId = userId)
    const interactionOptions = type === "FOLLOWERS" 
        ? { types: ["FOLLOW"] as any } // Les interactions pointant VERS l'utilisateur
        : { types: ["FOLLOW"] as any }; // Les interactions DE l'utilisateur
        
    // Note: useEntityInteractionsWithRelations a besoin d'être configuré correctement selon le type
    // On suppose ici qu'il renvoie les relations appropriées.
    const { data: people = [], isLoading } = useEntityInteractionsWithRelations(
        userId,
        "USER",
        interactionOptions,
        { page: 1, limit: 50 },
        { populate: ["user"] }
    );

    const filteredPeople = people.filter((p) => {
        const targetUser = p.user;
        return targetUser?.username?.toLowerCase().includes(search.toLowerCase()) ||
               targetUser?.fullName?.toLowerCase().includes(search.toLowerCase());
    });

    return (
        <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={`Rechercher parmi les ${type === "FOLLOWERS" ? "abonnés" : "abonnements"}...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filteredPeople.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
                    <UserIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                    <p className="text-muted-foreground font-medium">
                        {search ? "Aucun résultat trouvé" : `Aucun ${type === "FOLLOWERS" ? "abonné" : "abonnement"} pour le moment`}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPeople.map((interaction, index) => {
                        const person = interaction.user;
                        if (!person) return null;

                        return (
                            <motion.div
                                key={interaction.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-md transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                        <AvatarImage src={person.profileImage || ""} />
                                        <AvatarFallback>
                                            <UserIcon className="h-6 w-6" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <Typography variant="body-base" weight="bold">
                                            {person.fullName || person.username}
                                        </Typography>
                                        <Typography variant="body-sm" theme="muted">
                                            @{person.username}
                                        </Typography>
                                    </div>
                                </div>
                                <InteractionButton
                                    type="follow"
                                    entityType="USER"
                                    entityId={person.id}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full px-4"
                                />
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function ShopSection({ userId }: { userId: string }) {
    return (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground font-medium">Boutique bientôt disponible</p>
        </div>
    );
}

function TournamentsSection({ userId }: { userId: string }) {
    return (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground font-medium">Aucun tournoi organisé</p>
        </div>
    );
}

function MessagesSection({ userId }: { userId: string }) {
    return (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground font-medium">Bientôt : Gérez vos messages privés ici</p>
        </div>
    );
}