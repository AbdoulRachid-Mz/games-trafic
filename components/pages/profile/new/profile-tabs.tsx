"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ShoppingBag,
  Trophy,
  Users,
  UserPlus,
  MessageSquare,
  Info,
  Search,
  Loader2,
  User as UserIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProfileInfo } from "./profile-info";
import type { UserWithAllRelations } from "@/actions/users";
import { useInteractionsWithRelations } from "@/hooks/use-interactions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Typography } from "@/components/ui/typography";
import { InteractionButton } from "@/components/shared/interaction-button";
import { Input } from "@/components/ui/input";
import { ResponsiveTabs, type ResponsiveTab } from "@/components/ui/responsive-tabs";
import { useShopsByOwner } from "@/hooks/use-shops";
import { useTournamentsWithEditions } from "@/hooks/use-tournaments";
import { useConversations } from "@/hooks/use-conversations";
import Link from "next/link";

interface ProfileTabsProps {
  profileUser: any;
  isOwnProfile?: boolean;
  className?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function ProfileTabs({
  profileUser,
  isOwnProfile,
  className,
  activeTab: externalActiveTab,
  onTabChange: externalOnTabChange,
}: ProfileTabsProps) {
  const tabs: ResponsiveTab[] = [
    {
      value: "infos",
      label: "Infos",
      icon: <Info className="h-4 w-4" />,
      content: <ProfileInfo user={profileUser} isOwnProfile={isOwnProfile} />,
    },
    {
      value: "followers",
      label: "Abonnés",
      icon: <Users className="h-4 w-4" />,
      content: (
        <PeopleList
          userId={profileUser.id}
          type="FOLLOWERS"
          isOwnProfile={isOwnProfile}
        />
      ),
    },
    {
      value: "following",
      label: "Abonnements",
      icon: <UserPlus className="h-4 w-4" />,
      content: (
        <PeopleList
          userId={profileUser.id}
          type="FOLLOWING"
          isOwnProfile={isOwnProfile}
        />
      ),
    },
    {
      value: "shop",
      label: "Boutique",
      icon: <ShoppingBag className="h-4 w-4" />,
      content: <ShopSection userId={profileUser.id} />,
    },
    {
      value: "tournaments",
      label: "Tournois",
      icon: <Trophy className="h-4 w-4" />,
      content: <TournamentsSection userId={profileUser.id} />,
    },
    ...(isOwnProfile
      ? [
          {
            value: "discussions",
            label: "Discussions",
            icon: <MessageSquare className="h-4 w-4" />,
            content: <DiscussionsSection userId={profileUser.id} />,
          },
        ]
      : []),
  ];

  return (
    <div className={cn("sticky top-0 z-30 bg-background pt-2 pb-0", className)}>
      <ResponsiveTabs
        tabs={tabs}
        defaultValue={externalActiveTab || "infos"}
        onValueChange={externalOnTabChange}
        mobileCount={3}
        tabletCount={4}
        desktopCount={tabs.length}
        swipeable={true}
        labelCharacters={7}
      />
    </div>
  );
}

// ========================================================================
// PeopleList (Abonnés/Abonnements) — unchanged logic
// ========================================================================
function PeopleList({
  userId,
  type,
  isOwnProfile,
}: {
  userId: string;
  type: "FOLLOWERS" | "FOLLOWING";
  isOwnProfile?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const filters =
    type === "FOLLOWERS"
      ? {
          entityId: userId,
          entityType: ["USER"] as any,
          types: ["FOLLOW"] as any,
        }
      : {
          userId: userId,
          entityType: ["USER"] as any,
          types: ["FOLLOW"] as any,
        };

  const {
    data: response,
    isLoading,
    isFetching,
  } = useInteractionsWithRelations(filters, { page, limit }, { populate: ["user"] });

  const [allPeople, setAllPeople] = useState<any[]>([]);

  useEffect(() => {
    if (response?.data && Array.isArray(response.data)) {
      if (page === 1) {
        setAllPeople(response.data);
      } else {
        setAllPeople((prev) => [...prev, ...response.data]);
      }
    }
  }, [response, page]);

  const filteredPeople = allPeople.filter((interaction) => {
    const person =
      type === "FOLLOWERS" ? interaction.user : interaction.targetUser;
    if (!person) return false;
    
    const searchLower = search.toLowerCase();
    return (
      person.username?.toLowerCase().includes(searchLower) ||
      person.fullName?.toLowerCase().includes(searchLower)
    );
  });

  const hasMore = response?.pagination?.hasNext;

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Rechercher parmi les ${type === "FOLLOWERS" ? "abonnés" : "abonnements"}...`}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-10"
        />
      </div>

      {isLoading && page === 1 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredPeople.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
          <UserIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
          <p className="text-muted-foreground font-medium">
            {search
              ? "Aucun résultat trouvé"
              : `Aucun ${type === "FOLLOWERS" ? "abonné" : "abonnement"} pour le moment`}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPeople.map((interaction, index) => {
              const person =
                type === "FOLLOWERS"
                  ? interaction.user
                  : interaction.targetUser;
              if (!person) return null;

              return (
                <motion.div
                  key={`${interaction.id}-${index}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (index % limit) * 0.05 }}
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

          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={isFetching}
                className="gap-2"
              >
                {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
                Charger plus
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ========================================================================
// ShopSection — uses useShopsByOwner hook
// ========================================================================
function ShopSection({ userId }: { userId: string }) {
  const { data, isLoading } = useShopsByOwner(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const shops = data?.data || [];

  if (shops.length === 0) {
    return (
      <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
        <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
        <p className="text-muted-foreground font-medium">Aucune boutique</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {shops.map((shop: any) => (
        <Link
          key={shop.id}
          href={`/shops/${shop.id}`}
          className="group p-4 rounded-xl border bg-card hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={shop.profileImage || shop.logo || ""} />
              <AvatarFallback>
                <ShoppingBag className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold truncate group-hover:text-primary transition-colors">
                {shop.name}
              </span>
              {shop.category && (
                <span className="text-xs text-muted-foreground">{shop.category}</span>
              )}
            </div>
          </div>
          {shop.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{shop.description}</p>
          )}
        </Link>
      ))}
    </div>
  );
}

// ========================================================================
// TournamentsSection — uses useTournamentsWithEditions hook
// ========================================================================
function TournamentsSection({ userId }: { userId: string }) {
  const { data, isLoading } = useTournamentsWithEditions(10);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter tournaments by organizer
  const tournaments = (data || []).filter(
    (t: any) => t.organizerId === userId
  );

  if (tournaments.length === 0) {
    return (
      <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
        <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
        <p className="text-muted-foreground font-medium">Aucun tournoi organisé</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {tournaments.map((tournament: any) => (
        <Link
          key={tournament.id}
          href={`/tournaments/${tournament.id}`}
          className="group p-4 rounded-xl border bg-card hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold truncate group-hover:text-primary transition-colors">
                {tournament.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {tournament.editions?.length || 0} édition(s)
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ========================================================================
// DiscussionsSection — liste les entités avec qui l'utilisateur a échangé
// (remplace l'ancien onglet "Messages" qui affichait les messages bruts)
// ========================================================================
const DISCUSSION_ICONS: Record<string, typeof Users> = {
  user: UserIcon,
  group: Users,
  shop: ShoppingBag,
  tournament: Trophy,
};

function DiscussionsSection({ userId }: { userId: string }) {
  const { conversations, isLoading } = useConversations(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
        <p className="text-muted-foreground font-medium">
          Aucune discussion pour le moment
        </p>
        <Button asChild variant="outline" className="mt-4 rounded-full">
          <Link href="/chats">Démarrer une discussion</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {conversations.map((conv) => {
        const entity = conv.entity?.data || {};
        const Icon = DISCUSSION_ICONS[conv.entityType] || MessageSquare;
        const name =
          entity.fullName ||
          entity.name ||
          entity.username ||
          "Discussion";
        const avatar =
          entity.profileImage || entity.logo || entity.image || "";
        const lastMessage = conv.lastMessage;
        const preview = lastMessage
          ? lastMessage.content?.trim() ||
            (lastMessage.audioUrl ? "Message vocal" : "Média")
          : "Aucun message";
        const time = conv.lastMessageTime
          ? new Date(conv.lastMessageTime)
          : null;

        return (
          <Link
            key={conv.id}
            href={`/chats?entityType=${conv.entityType}&entityId=${conv.entityId}`}
            className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:shadow-md hover:border-primary/40 transition-all"
          >
            <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
              {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
              <AvatarFallback className="bg-primary/10 text-primary">
                {avatar ? (
                  <Icon className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-bold uppercase">
                    {String(name).slice(0, 2)}
                  </span>
                )}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold truncate">{name}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">
                  {conv.entityType}
                </span>
                {conv.unreadCount > 0 && (
                  <span className="ml-auto shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                  </span>
                )}
              </div>
              <span className="text-sm text-muted-foreground truncate">
                {preview}
              </span>
              {time && (
                <span className="text-[11px] text-muted-foreground/80 mt-0.5">
                  {time.toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
