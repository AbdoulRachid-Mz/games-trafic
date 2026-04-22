"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { useScreenSize } from "@/hooks/use-screen";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";
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
    desktopCount?: number; // Default: all tabs
    tabletCount?: number; // Default: 4 tabs
    mobileCount?: number; // Default: 2 tabs
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
    tabletCount = 4,
    mobileCount = 2,
    className,
    children,
    swipeable = false,
    showNavButtons = false,
}: ResponsiveTabsProps) {
    const { screenSize } = useScreenSize();
    const [activeTab, setActiveTab] = useState(defaultValue || tabs[0]?.value);

    // Déterminer le nombre de tabs visibles selon la taille d'écran
    const visibleTabsCount = useMemo(() => {
        if (screenSize.width >= 1024) return desktopCount; // Desktop
        if (screenSize.width >= 768) return tabletCount; // Tablet
        return mobileCount; // Mobile
    }, [screenSize.width, desktopCount, tabletCount, mobileCount]);

    // Séparer les tabs visibles et ceux dans le dropdown
    const visibleTabs = useMemo(
        () => tabs.slice(0, visibleTabsCount),
        [tabs, visibleTabsCount]
    );

    const dropdownTabs = useMemo(
        () => tabs.slice(visibleTabsCount),
        [tabs, visibleTabsCount]
    );

    const handleValueChange = (value: string) => {
        setActiveTab(value);
        onValueChange?.(value);
    };

    // Embla Carousel Integration
    const initialIndex = tabs.findIndex(t => t.value === activeTab);
    const [emblaRef, emblaApi] = useEmblaCarousel({
        startIndex: initialIndex !== -1 ? initialIndex : 0,
        loop: false,
        active: swipeable,
        watchDrag: swipeable,
    });

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        const selectedIndex = emblaApi.selectedScrollSnap();
        const selectedTab = tabs[selectedIndex];
        if (selectedTab && selectedTab.value !== activeTab) {
            handleValueChange(selectedTab.value);
        }
    }, [emblaApi, tabs, activeTab]);

    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on("select", onSelect);
        return () => {
            emblaApi.off("select", onSelect);
        };
    }, [emblaApi, onSelect]);

    useEffect(() => {
        if (emblaApi && swipeable) {
            const index = tabs.findIndex(t => t.value === activeTab);
            if (index !== -1 && index !== emblaApi.selectedScrollSnap()) {
                emblaApi.scrollTo(index);
            }
        }
    }, [activeTab, emblaApi, swipeable, tabs]);

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

    // Vérifier si le tab actif est dans le dropdown
    const activeTabInDropdown = dropdownTabs.some((tab) => tab.value === activeTab);

    return (
        <Tabs
            value={activeTab}
            onValueChange={handleValueChange}
            className={cn("w-full", className)}
        >
            <div className="flex items-center gap-2">
                <TabsList className="flex-1 justify-start">
                    {visibleTabs.map((tab) => (
                        <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className="flex items-center gap-2"
                        >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className="sm:hidden">{tab.label.slice(0, 3)}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* Dropdown pour les tabs cachés */}
                {dropdownTabs.length > 0 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant={activeTabInDropdown ? "default" : "outline"}
                                size="icon"
                                className="flex-shrink-0"
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
                                        "flex items-center gap-2 cursor-pointer",
                                        activeTab === tab.value && "bg-accent"
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

            {/* Tab Contents with Swiping support */}
            <div className="relative mt-4">
                {showNavButtons && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex rounded-full bg-background/50 hover:bg-background shadow-md"
                            onClick={scrollPrev}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex rounded-full bg-background/50 hover:bg-background shadow-md"
                            onClick={scrollNext}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </>
                )}

                {swipeable ? (
                    <div className="overflow-hidden" ref={emblaRef}>
                        <div className="flex">
                            {tabs.map((tab) => (
                                <div key={tab.value} className="flex-[0_0_100%] min-w-0">
                                    <div className={cn("w-full transition-opacity duration-300", activeTab === tab.value ? "opacity-100" : "opacity-0 pointer-events-none")}>
                                        {children ? children(tab) : tab.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    children
                        ? tabs.map((tab) => (
                            <TabsContent key={tab.value} value={tab.value}>
                                {children(tab)}
                            </TabsContent>
                        ))
                        : tabs.map(
                            (tab) =>
                                tab.content && (
                                    <TabsContent key={tab.value} value={tab.value}>
                                        {tab.content}
                                    </TabsContent>
                                )
                        )
                )}
            </div>
        </Tabs>
    );
}
