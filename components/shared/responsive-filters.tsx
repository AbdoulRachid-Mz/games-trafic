"use client"

import * as React from "react"
import { Filter, X, Search, ChevronDown, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import { useScreenSize } from "@/hooks/use-screen"
import { Typography } from "@/components/ui/typography"
import { Badge } from "@/components/ui/badge"

export type FilterType = "simple" | "dialog" | "drawer" | "sheet"

interface ResponsiveFiltersProps {
  children?: React.ReactNode
  onReset?: () => void
  activeFiltersCount?: number
  searchTerm?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  showSearch?: boolean
  title?: string
  className?: string
  triggerLabel?: string
  type?: FilterType
}

export function ResponsiveFilters({
  children,
  onReset,
  activeFiltersCount = 0,
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Rechercher...",
  showSearch = true,
  title = "Filtres",
  className,
  triggerLabel = "Filtrer",
  type = "simple",
}: ResponsiveFiltersProps) {
  const { isMobile } = useScreenSize()
  const [isOpen, setIsOpen] = React.useState(false)

  const SearchBar = showSearch && onSearchChange && (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={searchPlaceholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-9 h-10"
      />
      {searchTerm && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 hover:bg-transparent"
          onClick={() => onSearchChange("")}
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </Button>
      )}
    </div>
  )

  const ResetButton = onReset && (
    <Button variant="ghost" size="sm" onClick={onReset} className="h-8 text-xs gap-2">
      <X className="h-3 w-3" />
      Réinitialiser
    </Button>
  )

  const FilterTrigger = (
    <Button variant="outline" className="h-10 relative gap-2">
      <SlidersHorizontal className="h-4 w-4" />
      {triggerLabel}
      {activeFiltersCount > 0 && (
        <Badge 
          variant="default" 
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full"
        >
          {activeFiltersCount}
        </Badge>
      )}
    </Button>
  )

  const HeaderContent = (
    <div className="flex items-center justify-between">
      <Typography variant="h4" weight="bold">{title}</Typography>
      {ResetButton}
    </div>
  )

  const FooterContent = (closeComponent: React.ComponentType<{ asChild?: boolean, children: React.ReactNode }>) => {
    const Close = closeComponent;
    return (
      <div className="flex flex-row gap-2 w-full">
        <Close asChild>
          <Button variant="outline" className="flex-1">Fermer</Button>
        </Close>
        <Close asChild>
          <Button className="flex-1">Appliquer</Button>
        </Close>
      </div>
    )
  }

  // MOBILE: Always use Sheet for better mobile experience
  if (isMobile) {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        <div className="flex items-center gap-2">
          {SearchBar}
          {children && (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                {FilterTrigger}
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] flex flex-col p-0">
                <SheetHeader className="p-4 border-b">
                  {HeaderContent}
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {children}
                </div>

                <SheetFooter className="p-4 border-t">
                  {FooterContent(SheetClose)}
                </SheetFooter>
              </SheetContent>
            </Sheet>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <Typography variant="caption2" theme="muted" className="shrink-0">
              {activeFiltersCount} filtre(s) actif(s)
            </Typography>
            {ResetButton}
          </div>
        )}
      </div>
    )
  }

  // DESKTOP MODES
  const renderDesktopFilters = () => {
    if (type === "simple") {
      return (
        <div className={cn("space-y-4", className)}>
          <div className="flex items-center justify-between gap-4">
            {SearchBar}
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="h-8">
                  {activeFiltersCount} filtre(s) actif(s)
                </Badge>
              )}
              {ResetButton}
            </div>
          </div>
          
          {children && (
            <div className="flex flex-wrap items-center gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
              <Typography variant="caption2" weight="medium" className="flex items-center gap-2 text-muted-foreground mr-2">
                <Filter className="h-3 w-3" />
                Filtrer par :
              </Typography>
              {children}
            </div>
          )}
        </div>
      )
    }

    if (type === "dialog") {
      return (
        <div className={cn("flex items-center gap-3", className)}>
          {SearchBar}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              {FilterTrigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                {HeaderContent}
              </DialogHeader>
              <div className="py-4 space-y-6">
                {children}
              </div>
              <DialogFooter>
                {FooterContent(DialogClose)}
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {ResetButton}
        </div>
      )
    }

    if (type === "drawer") {
      return (
        <div className={cn("flex items-center gap-3", className)}>
          {SearchBar}
          <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
              {FilterTrigger}
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-sm">
                <DrawerHeader>
                  <DrawerTitle>{title}</DrawerTitle>
                </DrawerHeader>
                <div className="p-4 space-y-6">
                  {children}
                </div>
                <DrawerFooter>
                  {FooterContent(DrawerClose)}
                  {ResetButton}
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      )
    }

    if (type === "sheet") {
      return (
        <div className={cn("flex items-center gap-3", className)}>
          {SearchBar}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              {FilterTrigger}
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-sm flex flex-col p-0">
              <SheetHeader className="p-4 border-b">
                {HeaderContent}
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {children}
              </div>
              <SheetFooter className="p-4 border-t">
                {FooterContent(SheetClose)}
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      )
    }

    return null
  }

  return renderDesktopFilters()
}
