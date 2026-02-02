"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Check,
  ShoppingCart,
  Bell,
  AlertCircle,
  Award,
  Users,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { markNotificationAsRead } from "@/actions/notifications";
import { useAuthContext } from "@/contexts/auth-context";

interface NotificationItemProps {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: Date;
  isRead: boolean;
  linkUrl?: string;
  onRead?: () => void;
}

export function NotificationItem({
  id,
  title,
  message,
  type,
  createdAt,
  isRead,
  linkUrl,
  onRead,
}: NotificationItemProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [read, setRead] = useState(isRead);
  const { user } = useAuthContext();

  const handleMarkAsRead = async () => {
    if (read) return;

    setIsLoading(true);
    try {
      if (!user?.id) return;
      await markNotificationAsRead(id, user.id);
      setRead(true);
      onRead?.();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = () => {
    switch (type) {
      case "PURCHASE":
      case "SALE":
        return <ShoppingCart className="h-5 w-5 text-green-500" />;
      case "PURCHASE_CANCELLED":
      case "SALE_CANCELLED":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "PURCHASE_COMPLETED":
      case "SALE_COMPLETED":
        return <Check className="h-5 w-5 text-green-500" />;
      case "FOLLOW":
        return <Users className="h-5 w-5 text-blue-500" />;
      case "OFFER":
      case "OFFER_ACCEPTED":
      case "OFFER_REJECTED":
        return <CreditCard className="h-5 w-5 text-purple-500" />;
      case "TOURNAMENT":
        return <Award className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer w-full",
        !read && "bg-muted/30"
      )}
      onClick={handleMarkAsRead}
    >
      <div className="mt-1">{getIcon()}</div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <p className={cn("text-sm font-medium", !read && "font-semibold")}>
            {title}
          </p>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(createdAt), {
              addSuffix: true,
              locale: fr,
            })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );

  if (linkUrl) {
    return <Link href={linkUrl}>{content}</Link>;
  }

  return content;
}
