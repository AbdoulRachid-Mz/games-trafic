"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Check, X, Eye, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface BaseCardProps<T> {
  item: T;
  viewMode?: "grid" | "list" | "compact";
  status?: "default" | "success" | "warning" | "error" | "info" | string;
  isCliquable?: boolean;
  isMini?: boolean;
  activeAction?: "view" | "edit" | "delete";
  onEdit?: (item: T) => void;
  onView?: (item: T) => void;
  onDelete?: (item: T) => void;
  className?: string;
}

export interface extraActionsProps {
  id: string;
  label: string;
  icon: any;
  onClick: () => void;
  className?: string;
}

export function CardActionMenu({
  onEdit,
  onView,
  onDelete,
  extraActions = [],
  entityName = "cet élément",
}: {
  onEdit?: () => void;
  onView?: () => void;
  onDelete?: () => void;
  entityName?: string;
  extraActions?: extraActionsProps[];
}) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  if (!onEdit && !onView && !onDelete && extraActions.length === 0) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-primary/20 text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {onView && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
              <Eye className="h-4 w-4 mr-2" /> Voir
            </DropdownMenuItem>
          )}
          {onEdit && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Pencil className="h-4 w-4 mr-2" /> Modifier
            </DropdownMenuItem>
          )}
          {extraActions.map((action) => (
            <DropdownMenuItem
              key={action.id}
              onClick={(e) => { e.stopPropagation(); action.onClick(); }}
              className={action.className}
            >
              <action.icon className="h-4 w-4 mr-2" /> {action.label}
            </DropdownMenuItem>
          ))}
          {onDelete && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setIsConfirmOpen(true);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Supprimer
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer {entityName} ? Cette action est irréversible et supprimera définitivement toutes les données associées.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setIsConfirmOpen(false);
              }}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                setIsConfirmOpen(false);
                onDelete?.();
              }}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
