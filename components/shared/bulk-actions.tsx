"use client";

import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Trash2,
  Plus,
  Pencil,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useScreenSize } from "@/hooks/use-screen";

// ============================================================================
// TYPES
// ============================================================================

export interface BulkAction<T = string> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "default" | "destructive" | "outline";
  /** Confirm dialog before executing */
  confirm?: {
    title: string;
    description: string;
  };
  onClick: (selectedIds: T[]) => void | Promise<void>;
}

export interface BulkActionsProps<T = string> {
  /** All selectable item IDs */
  items: Array<{ id: T; label?: string }>;
  /** Custom bulk actions */
  actions: BulkAction<T>[];
  /** Called when add button clicked */
  onAdd?: () => void;
  /** Label for add button */
  addLabel?: string;
  /** Extra class for container */
  className?: string;
  /** Whether any mutation is loading */
  isLoading?: boolean;
  /** Show count badge */
  showCount?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * BulkActions — composant générique pour sélection multiple et actions en lot
 * Utilisé dans : matches, groupes, brackets, phases
 */
export function BulkActions<T extends string = string>({
  items,
  actions,
  onAdd,
  addLabel = "Ajouter",
  className,
  isLoading = false,
  showCount = true,
}: BulkActionsProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set());
  const [pendingAction, setPendingAction] = useState<BulkAction<T> | null>(
    null
  );
  const { isMobile } = useScreenSize();

  const isAllSelected =
    items.length > 0 && selectedIds.size === items.length;
  const isPartialSelected =
    selectedIds.size > 0 && selectedIds.size < items.length;

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const toggleItem = (id: T) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAction = async (action: BulkAction<T>) => {
    if (selectedIds.size === 0) return;
    if (action.confirm) {
      setPendingAction(action);
    } else {
      await action.onClick(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    await pendingAction.onClick(Array.from(selectedIds));
    setSelectedIds(new Set());
    setPendingAction(null);
  };

  const hasDestructive = actions.some((a) => a.variant === "destructive");

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2 flex-wrap",
          className
        )}
      >
        {/* Select all */}
        <div className="flex items-center gap-2 mr-1">
          <Checkbox
            id="select-all"
            checked={isAllSelected}
            aria-checked={isPartialSelected ? "mixed" : isAllSelected}
            onCheckedChange={toggleAll}
            disabled={isLoading || items.length === 0}
          />
          {showCount && selectedIds.size > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedIds.size} sélectionné(s)
            </Badge>
          )}
        </div>

        {/* Add button */}
        {onAdd && (
          <Button
            size="sm"
            variant="default"
            onClick={onAdd}
            disabled={isLoading}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            {!isMobile && addLabel}
          </Button>
        )}

        {/* Bulk action buttons */}
        {selectedIds.size > 0 && (
          <>
            {actions.length <= 2 ? (
              // Show as individual buttons if few actions
              actions.map((action, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant={action.variant || "outline"}
                  onClick={() => handleAction(action)}
                  disabled={isLoading}
                  className="gap-1.5"
                >
                  {action.icon && (
                    <action.icon className="h-3.5 w-3.5" />
                  )}
                  {!isMobile && action.label}
                </Button>
              ))
            ) : (
              // Show as dropdown if many actions
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isLoading}
                    className="gap-1.5"
                  >
                    Actions
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {actions.map((action, i) => (
                    <React.Fragment key={i}>
                      {action.variant === "destructive" &&
                        i > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuItem
                        onClick={() => handleAction(action)}
                        className={cn(
                          action.variant === "destructive" &&
                            "text-destructive"
                        )}
                      >
                        {action.icon && (
                          <action.icon className="h-4 w-4 mr-2" />
                        )}
                        {action.label}
                      </DropdownMenuItem>
                    </React.Fragment>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        )}
      </div>

      {/* Row checkboxes are rendered via a hook/context pattern — 
          expose toggleItem and isSelected for parent to use */}

      {/* Confirm dialog */}
      <AlertDialog
        open={!!pendingAction}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {pendingAction?.confirm?.title || "Confirmer l'action"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.confirm?.description ||
                `Cette action sera appliquée à ${selectedIds.size} élément(s). Cette opération est irréversible.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={
                pendingAction?.variant === "destructive"
                  ? "bg-destructive hover:bg-destructive/90"
                  : ""
              }
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Expose selection state via data attributes for child components */}
      <BulkActionsSelectionContext.Provider
        value={{ 
          selectedIds: selectedIds as unknown as Set<string>, 
          toggleItem: toggleItem as unknown as (id: string) => void, 
          isSelected: (id: string) => selectedIds.has(id as unknown as T) 
        }}
      >
        {/* Children would be rendered by the parent */}
      </BulkActionsSelectionContext.Provider>
    </>
  );
}

// ============================================================================
// CONTEXT for row-level checkboxes
// ============================================================================

const BulkActionsSelectionContext = React.createContext<{
  selectedIds: Set<string>;
  toggleItem: (id: string) => void;
  isSelected: (id: string) => boolean;
}>({
  selectedIds: new Set(),
  toggleItem: () => {},
  isSelected: () => false,
});

export function useBulkSelection() {
  return React.useContext(BulkActionsSelectionContext);
}

// ============================================================================
// SIMPLE BULK DELETE SHORTHAND
// ============================================================================

interface BulkDeleteBarProps {
  items: Array<{ id: string; label?: string }>;
  onDeleteSelected: (ids: string[]) => Promise<void>;
  onAdd?: () => void;
  addLabel?: string;
  isLoading?: boolean;
  className?: string;
}

export function BulkDeleteBar({
  items,
  onDeleteSelected,
  onAdd,
  addLabel,
  isLoading,
  className,
}: BulkDeleteBarProps) {
  return (
    <BulkActions
      items={items}
      onAdd={onAdd}
      addLabel={addLabel}
      isLoading={isLoading}
      className={className}
      actions={[
        {
          label: "Supprimer la sélection",
          icon: Trash2,
          variant: "destructive",
          confirm: {
            title: "Supprimer les éléments sélectionnés",
            description:
              "Êtes-vous sûr de vouloir supprimer les éléments sélectionnés ? Cette action est irréversible.",
          },
          onClick: onDeleteSelected,
        },
      ]}
    />
  );
}
