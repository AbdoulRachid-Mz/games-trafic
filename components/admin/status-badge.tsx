// components/admin/status-badge.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType =
  | "PENDING"
  | "COMPLETED"
  | "ACCEPTED"
  | "ACCEPTED_BY_SHOP"
  | "PROCESSING"
  | "FAILED"
  | "REJECTED"
  | "REJECTED_BY_SHOP"
  | "REJECTED_BY_ADMIN"
  | "REFUNDED"
  | "CANCELLED"
  | "ACTIVE"
  | "INACTIVE"
  | "VERIFIED"
  | "UNVERIFIED";

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusConfig: Record<string, { className: string; label: string }> = {
  PENDING: {
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    label: "En attente",
  },
  COMPLETED: {
    className: "bg-green-500/10 text-green-600 border-green-500/20",
    label: "Complété",
  },
  ACCEPTED: {
    className: "bg-green-500/10 text-green-600 border-green-500/20",
    label: "Accepté",
  },
  ACCEPTED_BY_SHOP: {
    className: "bg-green-500/10 text-green-600 border-green-500/20",
    label: "Accepté",
  },
  PROCESSING: {
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    label: "En cours",
  },
  FAILED: {
    className: "bg-red-500/10 text-red-600 border-red-500/20",
    label: "Échoué",
  },
  REJECTED: {
    className: "bg-red-500/10 text-red-600 border-red-500/20",
    label: "Rejeté",
  },
  REJECTED_BY_SHOP: {
    className: "bg-red-500/10 text-red-600 border-red-500/20",
    label: "Rejeté",
  },
  REJECTED_BY_ADMIN: {
    className: "bg-red-500/10 text-red-600 border-red-500/20",
    label: "Rejeté",
  },
  REFUNDED: {
    className: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    label: "Remboursé",
  },
  CANCELLED: {
    className: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    label: "Annulé",
  },
  ACTIVE: {
    className: "bg-green-500/10 text-green-600 border-green-500/20",
    label: "Actif",
  },
  INACTIVE: {
    className: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    label: "Inactif",
  },
  VERIFIED: {
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    label: "Vérifié",
  },
  UNVERIFIED: {
    className: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    label: "Non vérifié",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    className: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    label: status,
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border backdrop-blur-sm",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
