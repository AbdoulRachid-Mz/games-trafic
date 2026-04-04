"use client";

import React, { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Trash2,
  Plus,
  ChevronDown,
  AlertTriangle,
  Loader2,
  ShieldAlert,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useScreenSize } from "@/hooks/use-screen";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BulkAction<T = string> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "default" | "destructive" | "outline";
  confirm?: {
    title: string;
    description: string;
  };
  /** Validation à effectuer avant l'action */
  validate?: (selectedIds: T[]) => Promise<ValidationResult>;
  onClick: (selectedIds: T[]) => void | Promise<void>;
  /** Désactiver si condition non remplie */
  disabled?: boolean;
  disabledReason?: string;
}

export interface BulkActionsProps<T = string> {
  items: Array<{ id: T; label?: string }>;
  actions: BulkAction<T>[];
  onAdd?: () => void;
  addLabel?: string;
  className?: string;
  isLoading?: boolean;
  showCount?: boolean;
  /** Capacité maximale pour l'ajout (ex: max participants) */
  maxCapacity?: number;
  currentCount?: number;
  /** Message quand la limite est atteinte */
  capacityMessage?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BulkActions<T extends string = string>({
  items,
  actions,
  onAdd,
  addLabel = "Ajouter",
  className,
  isLoading = false,
  showCount = true,
  maxCapacity,
  currentCount = 0,
  capacityMessage = "Limite atteinte",
}: BulkActionsProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set());
  const [pendingAction, setPendingAction] = useState<BulkAction<T> | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const { isMobile } = useScreenSize();

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;
  const isPartialSelected = selectedIds.size > 0 && selectedIds.size < items.length;
  
  const isAddDisabled = maxCapacity !== undefined && currentCount >= maxCapacity;
  const addDisabledReason = isAddDisabled ? capacityMessage : undefined;

  // Reset selection when items change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [items.length]);

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
    
    // Vérifier si l'action est désactivée
    if (action.disabled) {
      toast.error(action.disabledReason || "Action non disponible");
      return;
    }
    
    // Validation pré-action
    if (action.validate) {
      setIsValidating(true);
      const result = await action.validate(Array.from(selectedIds));
      setIsValidating(false);
      
      if (!result.isValid) {
        setValidationErrors(result.errors);
        setValidationWarnings(result.warnings);
        return;
      }
    }
    
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

  const clearValidationDialog = () => {
    setValidationErrors([]);
    setValidationWarnings([]);
  };

  const hasDestructive = actions.some((a) => a.variant === "destructive");
  const isDisabled = isLoading || isValidating || items.length === 0;

  return (
    <>
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        {/* Select all */}
        <div className="flex items-center gap-2 mr-1">
          <Checkbox
            id="select-all"
            checked={isAllSelected}
            aria-checked={isPartialSelected ? "mixed" : isAllSelected}
            onCheckedChange={toggleAll}
            disabled={isDisabled}
          />
          {showCount && selectedIds.size > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedIds.size} sélectionné(s)
            </Badge>
          )}
        </div>

        {/* Add button with capacity check */}
        {onAdd && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={onAdd}
                    disabled={isDisabled || isAddDisabled}
                    className="gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {!isMobile && addLabel}
                    {maxCapacity !== undefined && (
                      <Badge variant="secondary" className="ml-1 text-[9px] h-4">
                        {currentCount}/{maxCapacity}
                      </Badge>
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              {isAddDisabled && addDisabledReason && (
                <TooltipContent>
                  <p className="text-xs">{addDisabledReason}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Bulk action buttons */}
        {selectedIds.size > 0 && (
          <>
            {actions.filter(a => !a.disabled).length <= 2 ? (
              actions
                .filter(a => !a.disabled)
                .map((action, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={action.variant || "outline"}
                    onClick={() => handleAction(action)}
                    disabled={isDisabled}
                    className="gap-1.5"
                  >
                    {action.icon && <action.icon className="h-3.5 w-3.5" />}
                    {!isMobile && action.label}
                  </Button>
                ))
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" disabled={isDisabled} className="gap-1.5">
                    Actions
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {actions.map((action, i) => (
                    <React.Fragment key={i}>
                      {action.variant === "destructive" && i > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuItem
                        onClick={() => handleAction(action)}
                        disabled={action.disabled}
                        className={cn(
                          action.variant === "destructive" && "text-destructive",
                          action.disabled && "opacity-50"
                        )}
                      >
                        {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                        {action.label}
                        {action.disabled && action.disabledReason && (
                          <span className="ml-2 text-[10px] text-muted-foreground">
                            ({action.disabledReason})
                          </span>
                        )}
                      </DropdownMenuItem>
                    </React.Fragment>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        )}
        
        {/* Loading indicator */}
        {isValidating && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Validation...
          </div>
        )}
      </div>

      {/* Validation Error Dialog */}
      <AlertDialog open={validationErrors.length > 0} onOpenChange={clearValidationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Action impossible
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {validationErrors.map((err, i) => (
                  <p key={i} className="text-sm text-destructive">{err}</p>
                ))}
                {validationWarnings.map((warn, i) => (
                  <p key={i} className="text-sm text-yellow-600">{warn}</p>
                ))}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Fermer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Dialog */}
      <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {pendingAction?.confirm?.title || "Confirmer l'action"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.confirm?.description ||
                `Cette action sera appliquée à ${selectedIds.size} élément(s).`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={pendingAction?.variant === "destructive" ? "bg-destructive" : ""}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Context Provider for children */}
      <BulkActionsSelectionContext.Provider
        value={{
          selectedIds: selectedIds as unknown as Set<string>,
          toggleItem: toggleItem as unknown as (id: string) => void,
          isSelected: (id: string) => selectedIds.has(id as unknown as T),
        }}
      />
    </>
  );
}

// ============================================================================
// CONTEXT
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
// SIMPLE BULK DELETE
// ============================================================================

interface BulkDeleteBarProps {
  items: Array<{ id: string; label?: string }>;
  onDeleteSelected: (ids: string[]) => Promise<void>;
  onAdd?: () => void;
  addLabel?: string;
  isLoading?: boolean;
  maxCapacity?: number;
  currentCount?: number;
  className?: string;
}

export function BulkDeleteBar({
  items,
  onDeleteSelected,
  onAdd,
  addLabel,
  isLoading,
  maxCapacity,
  currentCount,
  className,
}: BulkDeleteBarProps) {
  return (
    <BulkActions
      items={items}
      onAdd={onAdd}
      addLabel={addLabel}
      isLoading={isLoading}
      maxCapacity={maxCapacity}
      currentCount={currentCount}
      className={className}
      actions={[
        {
          label: "Supprimer la sélection",
          icon: Trash2,
          variant: "destructive",
          confirm: {
            title: "Supprimer les éléments sélectionnés",
            description: "Cette action est irréversible.",
          },
          onClick: onDeleteSelected,
        },
      ]}
    />
  );
}