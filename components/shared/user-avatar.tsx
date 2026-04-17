"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const userAvatarVariants = cva(
  "relative inline-flex items-center justify-center rounded-full overflow-hidden",
  {
    variants: {
      size: {
        xs: "h-6 w-6 text-xs",
        sm: "h-8 w-8 text-sm",
        md: "h-10 w-10 text-base",
        lg: "h-12 w-12 text-lg",
        xl: "h-14 w-14 text-xl",
        "2xl": "h-16 w-16 text-2xl",
        "3xl": "h-20 w-20 text-3xl",
      },
      variant: {
        default: "bg-muted",
        outline: "border-2 border-background shadow-sm",
        ring: "ring-2 ring-background shadow-sm",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
);

export interface UserAvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof userAvatarVariants> {
  user?: {
    username?: string | null;
    profileImage?: string | null;
    image?: string | null;
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  fallback?: string;
  showIndicator?: boolean;
  indicatorColor?: "online" | "offline" | "away" | "busy";
  indicatorPosition?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

export const UserAvatar = React.forwardRef<HTMLDivElement, UserAvatarProps>(
  (
    {
      user,
      fallback,
      size,
      variant,
      className,
      showIndicator = false,
      indicatorColor = "online",
      indicatorPosition = "bottom-right",
      ...props
    },
    ref
  ) => {
    const getInitials = React.useCallback(() => {
      if (!user) return "?";
      
      const first = user.firstName || user.username || user.displayName || "";
      const last = user.lastName || "";
      
      if (first && last) {
        return `${first[0]}${last[0]}`.toUpperCase();
      }
      
      if (first) {
        return first.slice(0, 2).toUpperCase();
      }
      
      if (fallback) {
        return fallback.slice(0, 2).toUpperCase();
      }
      
      return "?";
    }, [user, fallback]);

    const getImageSrc = React.useCallback(() => {
      if (!user) return undefined;
      return user.profileImage || user.image || undefined;
    }, [user]);

    const getAlt = React.useCallback(() => {
      if (!user) return "User avatar";
      
      if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
      }
      
      return user.username || user.displayName || "User";
    }, [user]);

    const indicatorColors = {
      online: "bg-green-500",
      offline: "bg-gray-400",
      away: "bg-yellow-500",
      busy: "bg-red-500",
    };

    const indicatorPositions = {
      "top-right": "top-0 right-0",
      "top-left": "top-0 left-0",
      "bottom-right": "bottom-0 right-0",
      "bottom-left": "bottom-0 left-0",
    };

    return (
      <div
        ref={ref}
        className={cn(userAvatarVariants({ size, variant }), className)}
        {...props}
      >
        <Avatar className="h-full w-full">
          <AvatarImage
            src={getImageSrc()}
            alt={getAlt()}
            className="object-cover"
          />
          <AvatarFallback className="bg-inherit text-inherit">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        
        {showIndicator && (
          <div
            className={cn(
              "absolute h-2 w-2 rounded-full border-2 border-background",
              indicatorColors[indicatorColor],
              indicatorPositions[indicatorPosition],
              {
                "xs:h-1.5 xs:w-1.5": size === "xs",
                "sm:h-2 sm:w-2": size === "sm",
                "md:h-2 md:w-2": size === "md",
                "lg:h-2.5 lg:w-2.5": size === "lg",
                "xl:h-3 xl:w-3": size === "xl",
                "2xl:h-3 2xl:w-3": size === "2xl",
                "3xl:h-3.5 3xl:w-3.5": size === "3xl",
              }
            )}
          />
        )}
      </div>
    );
  }
);

UserAvatar.displayName = "UserAvatar";
