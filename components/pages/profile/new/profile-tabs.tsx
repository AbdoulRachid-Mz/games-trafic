"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
    Grid3X3,
    ShoppingBag,
    Trophy,
    Users,
    Image,
    MessageSquare,
    Sparkles
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CommentsSection } from "@/components/comments/comments-section";

interface ProfileTabsProps {
    userId: string;
    isOwnProfile?: boolean;
    className?: string;
}

export function ProfileTabs({ userId, isOwnProfile, className }: ProfileTabsProps) {
    const [activeTab, setActiveTab] = useState("posts");

    const tabs = [
        // { id: "posts", label: "Posts", icon: Grid3X3 },
        // { id: "shop", label: "Boutique", icon: ShoppingBag },
        // { id: "tournaments", label: "Tournois", icon: Trophy },
        { id: "followers", label: "Communauté", icon: Users },
        { id: "conversations", label: "Conversations", icon: MessageSquare },
        ...(isOwnProfile ? [{ id: "messages", label: "Messages", icon: MessageSquare }] : []),
    ];

    return (
        <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className={cn("space-y-6", className)}
        >
            <TabsList className="w-full justify-start overflow-x-auto hide-scrollbar">
                {tabs.map((tab) => (
                    <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                        <tab.icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                ))}
            </TabsList>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* <TabsContent value="posts" className="mt-0">
            <PostsSection userId={userId} isOwnProfile={isOwnProfile} />
          </TabsContent> */}

                    {/* <TabsContent value="shop" className="mt-0">
                        <ShopSection userId={userId} />
                    </TabsContent> */}

                    {/* <TabsContent value="tournaments" className="mt-0">
                        <TournamentsSection userId={userId} />
                    </TabsContent> */}

                    <TabsContent value="followers" className="mt-0">
                        <CommunitySection userId={userId} />
                    </TabsContent>

                    {/* <TabsContent value="media" className="mt-0">
            <MediaSection userId={userId} />
          </TabsContent> */}
                    <TabsContent value="conversations" className="mt-0">
                        <CommentsSection entityId={userId} entityType="USER" title="Conversations" />
                    </TabsContent>

                    {/* {isOwnProfile && (
                        <TabsContent value="messages" className="mt-0">
                            <MessagesSection userId={userId} />
                        </TabsContent>
                    )} */}
                </motion.div>
            </AnimatePresence>
        </Tabs>
    );
}

// Sections individuelles
function PostsSection({ userId, isOwnProfile }: { userId: string; isOwnProfile?: boolean }) {
    return (
        <div className="grid grid-cols-3 gap-1 md:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <motion.div
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer relative group"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-2 left-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-sm font-medium">Post {i}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

function ShopSection({ userId }: { userId: string }) {
    return (
        <div className="text-center py-12">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun produit dans la boutique</p>
        </div>
    );
}

function TournamentsSection({ userId }: { userId: string }) {
    return (
        <div className="text-center py-12">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun tournoi organisé</p>
        </div>
    );
}

function CommunitySection({ userId }: { userId: string }) {
    return (
        <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Explorez la communauté</p>
        </div>
    );
}

function MediaSection({ userId }: { userId: string }) {
    return (
        <div className="grid grid-cols-4 gap-1">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg" />
            ))}
        </div>
    );
}

function MessagesSection({ userId }: { userId: string }) {
    return (
        <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Vos messages privés</p>
        </div>
    );
}