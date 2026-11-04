"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { BaseCardProps, CardActionMenu } from "./card-action-menu";
import { cn } from "@/lib/utils";
import type { WalletTransaction } from "@/database/schema";
import {
  Wallet,
  CreditCard,
  User,
  ShoppingBag,
  Palette,
  Trophy,
  GamepadIcon,
  Star,
  Download,
  Share2,
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingCart
} from "lucide-react";

import { transactionTypeLabel, transactionStatusLabel } from "@/utils/types-label";

export interface TransactionCardProps extends BaseCardProps<WalletTransaction> {
  currentUserId?: string;
  onDownloadReceipt?: (item: WalletTransaction) => void;
  onShare?: (item: WalletTransaction) => void;
}

function getTypeIcon(type: string, isIncome: boolean) {
  switch (type) {
    case "THEME_PURCHASE": return Palette;
    case "VIP_SUBSCRIPTION": return Star;
    case "ORDER_PURCHASE": return ShoppingCart;
    case "TOURNAMENT_PARTICIPATION": return Trophy;
    case "GAME_ITEM_PURCHASE": return GamepadIcon;
    case "DEPOSIT": return ArrowDownLeft;
    case "WITHDRAWAL": return ArrowUpRight;
    case "TRANSFER": return isIncome ? ArrowDownLeft : ArrowUpRight;
    default: return Wallet;
  }
}

export function TransactionCard({
  item,
  viewMode = "list",
  status,
  isCliquable = true,
  isMini = false,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  onDownloadReceipt,
  onShare,
  currentUserId,
  className,
}: TransactionCardProps) {
  const isIncome =
    item.type === "DEPOSIT" ||
    item.type === "BONUS" ||
    item.type === "REFUND" ||
    (item.type === "TRANSFER" && item.toUserId === currentUserId);

  const getStatusBorder = (statusStr?: string) => {
    switch (statusStr) {
      case "COMPLETED":
        return "border-l-4 border-l-green-500";
      case "PENDING":
      case "PROCESSING":
        return "border-l-4 border-l-yellow-500";
      case "FAILED":
      case "REFUNDED":
        return "border-l-4 border-l-red-500";
      default:
        return "border-l-4 border-l-gray-300";
    }
  };

  const getStatusBadge = (statusStr: string) => {
    const label = transactionStatusLabel(statusStr);
    switch (statusStr) {
      case "COMPLETED":
        return <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600"><div className="h-1.5 w-1.5 rounded-full bg-white" /> {label}</Badge>;
      case "PENDING":
      case "PROCESSING":
        return <Badge variant="destructive" className="gap-1 bg-yellow-500 hover:bg-yellow-600"><div className="h-1.5 w-1.5 rounded-full bg-white" /> {label}</Badge>;
      case "FAILED":
        return <Badge variant="destructive" className="gap-1"><div className="h-1.5 w-1.5 rounded-full bg-white" /> {label}</Badge>;
      case "REFUNDED":
        return <Badge variant="destructive" className="gap-1"><div className="h-1.5 w-1.5 rounded-full bg-white" /> {label}</Badge>;
      default:
        return <Badge variant="outline">{label}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    return transactionTypeLabel(type);
  };

  const Icon = getTypeIcon(item.type, isIncome);
  const isListView = viewMode === "list";
  const isCompact = viewMode === "compact" || isMini;

  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view" && onView) onView(item);
    else if (activeAction === "edit" && onEdit) onEdit(item);
    else if (activeAction === "delete" && onDelete) onDelete(item);
    else if (onView) onView(item);
  };

  const hasActions = onEdit || onView || onDelete || onDownloadReceipt || onShare;

  const extraActions = [];
  if (onDownloadReceipt && item.status === "COMPLETED") {
    extraActions.push({
      id: "receipt",
      label: "Télécharger le reçu",
      icon: Download,
      onClick: () => onDownloadReceipt(item)
    });
  }
  if (onShare) {
    extraActions.push({
      id: "share",
      label: "Partager",
      icon: Share2,
      onClick: () => onShare(item)
    });
  }

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-300 group relative overflow-hidden",
        isListView && "flex items-center",
        isCliquable && "cursor-pointer active:scale-[0.98]",
        getStatusBorder(status || item.status || "default"),
        className
      )}
      onClick={handleMainAction}
    >
      <div
        className={cn(
          "p-3 flex w-full gap-3",
          isListView ? "flex-row items-center" : "flex-col",
        )}
      >
        <div className={cn("flex items-center gap-3", !isListView && "w-full")}>
          <div className={`p-2 rounded-full flex-shrink-0 ${isIncome ? 'bg-green-100' : 'bg-red-100'}`}>
            <Icon className={`h-5 w-5 ${isIncome ? 'text-green-600' : 'text-red-600'}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Typography
                  variant={isCompact ? "body-sm" : "body-base"}
                  weight="bold"
                  className="truncate group-hover:text-primary transition-colors"
                >
                  {getTypeLabel(item.type)}
                </Typography>
                {!isListView && getStatusBadge(item.status || "")}
              </div>
              {!isListView && hasActions && (
                <div
                  className="flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CardActionMenu
                    onEdit={onEdit ? () => onEdit(item) : undefined}
                    onView={onView ? () => onView(item) : undefined}
                    onDelete={onDelete ? () => onDelete(item) : undefined}
                    entityName={`la transaction ${item.id.slice(0, 8)}`}
                    extraActions={extraActions}
                  />
                </div>
              )}
            </div>
            
            {isListView && (
               <div className="flex items-center gap-2 mt-1">
                 {getStatusBadge(item.status || "")}
                 <Typography variant="caption2" theme="muted">
                  {item.createdAt && format(new Date(item.createdAt), "dd MMMM yyyy HH:mm", { locale: fr })}
                 </Typography>
               </div>
            )}
            
            {!isListView && item.description && (
              <Typography variant="caption2" theme="muted" className="mt-1 line-clamp-1">
                {item.description}
              </Typography>
            )}
          </div>

          {isListView && hasActions && (
             <div
               className="flex-shrink-0 ml-auto flex items-center gap-2"
               onClick={(e) => e.stopPropagation()}
             >
                <div className="text-right mr-2">
                   <Typography variant="body-lg" weight="bold" className={isIncome ? 'text-green-600' : 'text-red-600'}>
                     {isIncome ? '+' : '-'}{parseFloat(item.amount)?.toFixed(2)} GTC
                   </Typography>
                   {item.fees && parseFloat(item.fees) > 0 && (
                     <Typography variant="caption2" theme="muted">
                       Frais: {parseFloat(item.fees)?.toFixed(2)} GTC
                     </Typography>
                   )}
                </div>
               <CardActionMenu
                 onEdit={onEdit ? () => onEdit(item) : undefined}
                 onView={onView ? () => onView(item) : undefined}
                 onDelete={onDelete ? () => onDelete(item) : undefined}
                 entityName={`la transaction ${item.id.slice(0, 8)}`}
                 extraActions={extraActions}
               />
             </div>
          )}
        </div>

        {!isCompact && !isListView && (
          <div className="space-y-2 mt-2 pt-2 border-t border-border/50">
             <div className="flex justify-between items-center">
                 <Typography variant="caption2" theme="muted">
                  {item.createdAt && format(new Date(item.createdAt), "dd MMM yyyy", { locale: fr })}
                 </Typography>
                 <Typography variant="body-base" weight="bold" className={isIncome ? 'text-green-600' : 'text-red-600'}>
                     {isIncome ? '+' : '-'}{parseFloat(item.amount)?.toFixed(2)} GTC
                 </Typography>
             </div>
             {item.description && (
              <Typography variant="caption2" theme="muted" className="italic text-center">
                "{item.description}"
              </Typography>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
