"use client";

import { motion } from "framer-motion";
import { MapPin, Calendar, Link as LinkIcon, Globe, Mail, Phone } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";
import type { UserWithAllRelations } from "@/actions/users";
import { accountTypesLabel, userLevelLabel, vipStatusLabel } from "@/utils/types-label";

interface ProfileInfoProps {
  user: UserWithAllRelations;
  isOwnProfile?: boolean;
  className?: string;
}

export function ProfileInfo({
  user: rawUser,
  isOwnProfile,
  className,
}: ProfileInfoProps) {
  // Cast to any to avoid drizzle schema typing 'bio', 'country', etc. as unknown
  const user = rawUser as any;

  return (
    <motion.div
      className={cn("space-y-6", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      {/* Bio Section */}
      {user.bio && (
        <div className="space-y-2">
          <Typography variant="body-sm" weight="bold" theme="muted" className="uppercase tracking-wider">
            Bio
          </Typography>
          <Typography variant="body-base" className="text-foreground/80 max-w-2xl leading-relaxed">
            {user.bio}
          </Typography>
        </div>
      )}

      {/* Details Grid */}
      <div className="space-y-2">
        <Typography variant="body-sm" weight="bold" theme="muted" className="uppercase tracking-wider">
          Détails
        </Typography>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {user.country && (
            <InfoItem icon={MapPin} label="Localisation" value={user.country} />
          )}
          {user.website && (
            <InfoItem
              icon={Globe}
              label="Site web"
              value={user.website}
              href={user.website}
            />
          )}
          {user.email && (
            <InfoItem icon={Mail} label="Email" value={user.email} />
          )}
          {user.phoneNumber && isOwnProfile && (
            <InfoItem icon={Phone} label="Téléphone" value={user.phoneNumber} />
          )}
          <InfoItem
            icon={Calendar}
            label="Membre depuis"
            value={formatDate(user.createdAt)}
          />
        </div>
      </div>

      {/* Social Media */}
      {user.socialMedia && Array.isArray(user.socialMedia) && user.socialMedia.length > 0 && (
        <div className="space-y-2">
          <Typography variant="body-sm" weight="bold" theme="muted" className="uppercase tracking-wider">
            Réseaux sociaux
          </Typography>
          <div className="flex flex-wrap gap-2">
            {(user.socialMedia as any[]).map((social: any, idx: number) => {
              const socialUrl = social.url || social.link;
              const href = typeof socialUrl === 'string' ? socialUrl : "#";
              return (
                <a
                  key={idx}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-sm transition-colors border border-border/50 hover:border-primary/30"
                >
                  <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{social.platform || social.name || social.url || "Lien"}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {user.emailVerified && (
          <Badge variant="default" className="gap-1">
            ✓ Vérifié
          </Badge>
        )}
        {user.accountTypes?.map((type: string) => (
          <Badge key={type} variant="secondary">
            {accountTypesLabel(type)}
          </Badge>
        ))}
        {user.level && (
          <Badge variant="outline">{userLevelLabel(user.level)}</Badge>
        )}
        {user.isVip && (
          <Badge variant="default" className="bg-gradient-to-r from-yellow-500 to-orange-500">
            {vipStatusLabel(user.vipStatus)}
          </Badge>
        )}
      </div>
    </motion.div>
  );
}

// Sub-component for individual info items
function InfoItem({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/40"
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        {href ? (
          <a
            href={href.startsWith("http") ? href : `https://${href}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline truncate"
          >
            {value}
          </a>
        ) : (
          <span className="text-sm font-medium truncate">{value}</span>
        )}
      </div>
    </motion.div>
  );
}