"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { useScreenSize } from "@/hooks/use-screen";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Button } from "./button";

export interface ResponsiveTab {
  value: string;
  label: string;
  icon?: React.ReactNode;
  content?: React.ReactNode;
}

interface ResponsiveTabsProps {
  tabs: ResponsiveTab[];
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  desktopCount?: number;
  tabletCount?: number;
  mobileCount?: number;
  className?: string;
  children?: (tab: ResponsiveTab) => React.ReactNode;
  swipeable?: boolean;
  showNavButtons?: boolean;
}

export function ResponsiveTabs({
  tabs,
  defaultValue,
  onValueChange,
  desktopCount = tabs.length,
  tabletCount = 3,
  mobileCount = 2,
  className,
  children,
  swipeable = false,
  showNavButtons = false,
}: ResponsiveTabsProps) {
  const { screenSize, isMobile } = useScreenSize();
  const [activeTab, setActiveTab] = useState(defaultValue || tabs[0]?.value);
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Nombre de tabs visibles
  const visibleTabsCount = useMemo(() => {
    if (screenSize.width >= 1024) return desktopCount;
    if (screenSize.width >= 768) return tabletCount;
    return mobileCount;
  }, [screenSize.width, desktopCount, tabletCount, mobileCount]);

  const visibleTabs = useMemo(
    () => tabs.slice(0, visibleTabsCount),
    [tabs, visibleTabsCount],
  );

  const dropdownTabs = useMemo(
    () => tabs.slice(visibleTabsCount),
    [tabs, visibleTabsCount],
  );

  const activeTabInDropdown = dropdownTabs.some(
    (tab) => tab.value === activeTab,
  );

  const handleValueChange = (value: string) => {
    setActiveTab(value);
    onValueChange?.(value);
  };

  // Scroll horizontal pour les tabs
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -150, behavior: "smooth" });
      setScrollPosition(scrollContainerRef.current.scrollLeft - 150);
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 150, behavior: "smooth" });
      setScrollPosition(scrollContainerRef.current.scrollLeft + 150);
    }
  };

  const updateScrollPosition = useCallback(() => {
    if (scrollContainerRef.current) {
      setScrollPosition(scrollContainerRef.current.scrollLeft);
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && swipeable) {
      container.addEventListener("scroll", updateScrollPosition);
      return () => container.removeEventListener("scroll", updateScrollPosition);
    }
  }, [swipeable, updateScrollPosition]);

  const canScrollLeft = scrollPosition > 20;
  const canScrollRight = scrollContainerRef.current
    ? scrollPosition <
      scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth - 20
    : false;

  // Variante mobile avec swiping natif
  if (swipeable && isMobile) {
    return (
      <div className="w-full">
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 mb-4 gap-3"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {tabs.map((tab, idx) => (
            <button
              key={tab.value}
              onClick={() => handleValueChange(tab.value)}
              className={cn(
                "snap-start flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                activeTab === tab.value
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted",
              )}
            >
              {tab.icon}
              <span className="text-sm font-medium whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-4">
          {tabs.map((tab) => (
            <div
              key={tab.value}
              className={cn(
                "transition-all duration-300",
                activeTab === tab.value ? "block" : "hidden",
              )}
            >
              {children ? children(tab) : tab.content}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleValueChange}
      className={cn("w-full", className)}
    >
      <div className="relative flex items-center gap-2 mb-4">
        {showNavButtons && canScrollLeft && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 z-10 h-8 w-8 rounded-full bg-background shadow-md"
            onClick={scrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        <TabsList
          ref={scrollContainerRef}
          className={cn(
            "flex-1 justify-start overflow-x-auto scrollbar-hide",
            showNavButtons && "px-8",
          )}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {visibleTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {tab.icon}
              <span className="hidden xs:inline text-sm">{tab.label}</span>
              <span className="xs:hidden text-xs">{tab.label.slice(0, 3)}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {showNavButtons && canScrollRight && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 z-10 h-8 w-8 rounded-full bg-background shadow-md"
            onClick={scrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {dropdownTabs.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={activeTabInDropdown ? "default" : "outline"}
                size="icon"
                className="flex-shrink-0 h-9 w-9"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {dropdownTabs.map((tab) => (
                <DropdownMenuItem
                  key={tab.value}
                  onClick={() => handleValueChange(tab.value)}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer text-sm",
                    activeTab === tab.value && "bg-accent",
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {children ? (
        tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {children(tab)}
          </TabsContent>
        ))
      ) : (
        tabs.map(
          (tab) =>
            tab.content && (
              <TabsContent key={tab.value} value={tab.value}>
                {tab.content}
              </TabsContent>
            ),
        )
      )}
    </Tabs>
  );
}