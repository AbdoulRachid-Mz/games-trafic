import { PartnerCard as PartnerCardType } from "@/types/view-models";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Building2, ExternalLink, Mail, Phone, MapPin, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list" | "compact";
type CardVariant = "default" | "premium" | "admin";

interface PartnerCardProps {
  partner: PartnerCardType;
  viewMode?: ViewMode;
  showActions?: boolean;
  showBadge?: boolean;
  showDescription?: boolean;
  showContactInfo?: boolean;
  showWebsite?: boolean;
  className?: string;
  variant?: CardVariant;
}

export function PartnerCard({
  partner,
  viewMode = "grid",
  showActions = true,
  showBadge = true,
  showDescription = true,
  showContactInfo = true,
  className,
  variant = "default"
}: PartnerCardProps) {
  const isList = viewMode === "list";
  const isCompact = viewMode === "compact";

  const variantStyles = {
    default: "bg-card border-border hover:border-primary/30",
    premium: "bg-gradient-to-br from-primary/5 to-background border-primary/20 shadow-md hover:shadow-lg hover:border-primary/40",
    admin: "bg-muted/30 border-dashed border-2",
  };

  const layoutClasses = isList 
    ? "flex-row items-center gap-6 p-4" 
    : isCompact 
      ? "flex-col p-3" 
      : "flex-col p-6";

  const logoClasses = cn(
    "relative flex-shrink-0 bg-muted rounded-lg overflow-hidden flex items-center justify-center transition-all",
    isList ? "w-20 h-20" : isCompact ? "w-12 h-12 mb-2" : "w-24 h-24 mb-4 mx-auto"
  );

  return (
    <Card className={cn("h-full transition-all duration-200", variantStyles[variant], className)}>
      <div className={cn("flex h-full", layoutClasses)}>
        {/* Logo */}
        <div className={logoClasses}>
          {partner.logo ? (
            <Image
              src={partner.logo}
              alt={partner.name}
              fill
              className="object-contain p-2"
            />
          ) : (
            <Building2 className={cn("text-muted-foreground", isCompact ? "w-6 h-6" : "w-10 h-10")} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className={cn(
              "font-bold truncate",
              isCompact ? "text-sm" : isList ? "text-lg" : "text-xl"
            )}>
              {partner.name}
            </h3>
            {showBadge && variant === "premium" && (
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            )}
          </div>

          {!isCompact && showDescription && partner.shortDescription && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
              {partner.shortDescription}
            </p>
          )}

          {showContactInfo && !isCompact && (
            <div className="space-y-1.5 mb-4">
              {partner.country && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{partner.country}</span>
                </div>
              )}
            </div>
          )}

          {/* Stats Section */}
          {!isCompact && (
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="w-3.5 h-3.5" />
                <span>{partner.totalPartnerships || 0} Projets</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{partner.viewCount || 0} Vues</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && partner.website && (
          <div className={cn(isList ? "ml-auto" : "mt-auto pt-2")}>
            <Button
              asChild
              variant={variant === "premium" ? "default" : "outline"}
              size={isCompact ? "sm" : "default"}
              className={cn(isList ? "w-auto" : "w-full")}
            >
              <a href={partner.website} target="_blank" rel="noopener noreferrer" className="gap-2">
                {!isCompact && (isList ? "Website" : "Visit Website")}
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
