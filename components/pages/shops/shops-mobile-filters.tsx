// components/pages/shops/shops-mobile-filters.tsx
"use client";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShopsFilterSidebar } from "./shops-filter-sidebar";

interface ShopsMobileFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: any;
  updateFilter: (key: string, value: any) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

export function ShopsMobileFilters({
  open,
  onOpenChange,
  filters,
  updateFilter,
  resetFilters,
  hasActiveFilters,
}: ShopsMobileFiltersProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres
            </DrawerTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DrawerHeader>
        
        <div className="overflow-y-auto p-4">
          <ShopsFilterSidebar
            filters={filters}
            updateFilter={updateFilter}
            resetFilters={resetFilters}
            hasActiveFilters={hasActiveFilters}
          />
          
          <Button 
            className="w-full mt-4"
            onClick={() => onOpenChange(false)}
          >
            Appliquer les filtres
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}