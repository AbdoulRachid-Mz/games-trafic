"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Plus, LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type ActionOverlayType = "dialog" | "sheet" | "drawer" | "none";

export interface MenuItemAction {
  /** Un identifiant unique */
  id: string;
  /** Le texte affiché dans le menu */
  label: string;
  /** Une courte description (optionnelle) */
  description?: string;
  /** L'icône (lucide-react) */
  icon?: LucideIcon;
  /** Clé du paramètre d'URL à écouter (ex: 'action') */
  paramKey?: string;
  /** Valeur du paramètre qui déclenche cette action (ex: 'createGroup', 'true') */
  paramValue?: string;
  /** Lien direct ? Si oui, paramKey/paramValue sont ignorés. */
  href?: string;
  /** Action onClick personnalisée. */
  onClick?: () => void;
  /** Type d'overlay à afficher si le composant gère le rendu interne */
  overlayType?: ActionOverlayType;
  /** Le contenu React à rendre dans le Dialog/Sheet/Drawer si paramKey === paramValue */
  renderContent?: React.ReactNode;
  /** Classes CSS supplémentaires pour le style de l'item du menu (ex: text-red-500) */
  className?: string;
  /** Raccourcis clavier optionnels affichés */
  shortcut?: string;
  /** Sépare l'item avec un trait au-dessus */
  separatorBefore?: boolean;
  /** Variante visuelle (info seulement, pas utilisée directement par le menu) */
  variant?: string;
}

export interface DynamicActionMenuProps {
  /** La liste des actions */
  actions: MenuItemAction[];
  /** Le mode d'affichage: floating (fixe en bas à droite) ou inline (enfants personnalisés) */
  variant?: "floating" | "inline";
  /** Bouton déclencheur personnalisé (si variant = inline) */
  children?: React.ReactNode;
  /** Titre du Dropdown Menu */
  menuTitle?: string;
  /** Position custom pour le floating. Default: bottom-6 right-6 */
  floatingPosition?: string;
  /** Tooltip/Texte du bouton flottant si on ne veut pas juste une icône */
  floatingLabel?: string;
}

export function DynamicActionMenu({
  actions,
  variant = "floating",
  children,
  menuTitle = "Actions",
  floatingPosition = "bottom-6 right-6",
  floatingLabel
}: DynamicActionMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Update URL function
  const updateUrlParam = useCallback((key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
  }, [pathname, searchParams, router]);

  const handleActionClick = (action: MenuItemAction) => {
    if (action.href) {
      router.push(action.href);
      return;
    }
    if (action.onClick) {
      action.onClick();
    }
    if (action.paramKey && action.paramValue) {
      updateUrlParam(action.paramKey, action.paramValue);
    }
  };

  const closeOverlay = (action: MenuItemAction) => {
    if (action.paramKey) {
      updateUrlParam(action.paramKey, null);
    }
  };

  // Trouver l'action actuellement active basée sur les paramètres d'URL (pour afficher Dialog/Sheet)
  const activeAction = mounted ? actions.find(a => 
    a.paramKey && a.paramValue && 
    searchParams.get(a.paramKey) === a.paramValue && 
    a.renderContent
  ) : undefined;

  const trigger = variant === "inline" ? (
    children || <Button variant="outline">Actions</Button>
  ) : (
    <Button 
      className={cn(
        "fixed z-50 rounded-full shadow-lg h-14 transition-transform hover:scale-105 active:scale-95",
        floatingLabel ? "px-6" : "w-14",
        floatingPosition
      )}
      size={floatingLabel ? "default" : "icon"}
    >
      <Plus className={cn("h-6 w-6 text-white", floatingLabel && "mr-2")} />
      {floatingLabel && <span className="font-semibold text-white">{floatingLabel}</span>}
    </Button>
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56" sideOffset={12}>
          {menuTitle && (
            <>
              <DropdownMenuLabel>{menuTitle}</DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}
          {actions.map((action, index) => (
            <React.Fragment key={action.id || index}>
              {action.separatorBefore && <DropdownMenuSeparator />}
              <DropdownMenuItem 
                onClick={() => handleActionClick(action)}
                className={cn("cursor-pointer flex items-center justify-between", action.className)}
              >
                <div className="flex items-center gap-2">
                  {action.icon && <action.icon className="h-4 w-4" />}
                  <span>{action.label}</span>
                </div>
                {action.shortcut && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {action.shortcut}
                  </span>
                )}
              </DropdownMenuItem>
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rendu des Overlays Actifs (Dialog, Sheet, Drawer) */}
      {activeAction && activeAction.overlayType === "dialog" && (
        <Dialog open={true} onOpenChange={(open) => !open && closeOverlay(activeAction)}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{activeAction.label}</DialogTitle>
              {activeAction.description && <DialogDescription>{activeAction.description}</DialogDescription>}
            </DialogHeader>
            <div className="mt-4">
              {activeAction.renderContent}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {activeAction && activeAction.overlayType === "sheet" && (
        <Sheet open={true} onOpenChange={(open) => !open && closeOverlay(activeAction)}>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto border-l">
            <SheetHeader>
              <SheetTitle>{activeAction.label}</SheetTitle>
              {activeAction.description && <SheetDescription>{activeAction.description}</SheetDescription>}
            </SheetHeader>
            <div className="mt-6">
              {activeAction.renderContent}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {activeAction && activeAction.overlayType === "drawer" && (
        <Drawer open={true} onOpenChange={(open) => !open && closeOverlay(activeAction)}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>{activeAction.label}</DrawerTitle>
              {activeAction.description && <DrawerDescription>{activeAction.description}</DrawerDescription>}
            </DrawerHeader>
            <div className="p-4 overflow-y-auto">
              {activeAction.renderContent}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
