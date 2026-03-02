"use client";

import { motion } from "framer-motion";
import { MapPin, Calendar, Link as LinkIcon, Globe } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { AutoSyncField } from "@/components/shared/auto-sync-field";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserWithAllRelations } from "@/actions/users";

interface ProfileInfoProps {
  user: UserWithAllRelations;
  isOwnProfile?: boolean;
  onUpdate?: (data: Partial<UserWithAllRelations>) => Promise<void>;
  className?: string;
}

export function ProfileInfo({
  user,
  isOwnProfile,
  onUpdate,
  className,
}: ProfileInfoProps) {
  const infoItems = [
    {
      icon: MapPin,
      label: "Localisation",
      value: user.country,
      key: "country",
      placeholder: "Ajouter votre localisation",
    },
    {
      icon: Globe,
      label: "Site web",
      value: user.website,
      key: "website",
      placeholder: "Ajouter votre site web",
      href: user.website,
    },
    {
      icon: Calendar,
      label: "Inscrit le",
      value: formatDate(user.createdAt),
      isDate: true,
    },
  ];

  return (
    <motion.div
      className={cn("space-y-4", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      {/* Bio */}
      {isOwnProfile ? (
        <AutoSyncField
          value={user.bio || ""}
          onChange={async (value) => {
            await onUpdate?.({ bio: value });
          }}
          type="textarea"
          placeholder="Ajouter une bio..."
          mode="manual"
          className="max-w-2xl"
        />
      ) : user.bio ? (
        <p className="text-foreground/80 max-w-2xl">{user.bio}</p>
      ) : null}

      {/* Info grid */}
      <div className="flex flex-wrap gap-4">
        {infoItems.map((item, index) => (
          <motion.div
            key={item.key || index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="flex items-center gap-2 text-sm"
          >
            <item.icon className="h-4 w-4 text-muted-foreground" />

            {isOwnProfile && !item.isDate && item.key ? (
              <AutoSyncField
                value={item.value || ""}
                onChange={async (value) => {
                  await onUpdate?.({ [item.key!]: value });
                }}
                placeholder={item.placeholder}
                mode="manual"
                debounceMs={1000}
                className="min-w-[200px]"
              />
            ) : item.href ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                {item.value}
              </a>
            ) : (
              <span className="text-muted-foreground">{item.value}</span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {user.emailVerified && (
          <Badge variant="default" className="gap-1">
            ✓ Vérifié
          </Badge>
        )}
        {user.accountTypes?.map((type) => (
          <Badge key={type} variant="secondary">
            {type}
          </Badge>
        ))}
        {user.level && (
          <Badge variant="outline">Niveau {user.level}</Badge>
        )}
        {user.isVip && (
          <Badge variant="default" className="bg-gradient-to-r from-yellow-500 to-orange-500">
            VIP
          </Badge>
        )}
      </div>
    </motion.div>
  );
}