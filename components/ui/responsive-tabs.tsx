"use client";

import React, { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { useScreenSize } from "@/hooks/use-screen";
import { cn } from "@/lib/utils";

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

            {/* Tab Contents */}
            {children
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
                )}
        </Tabs>
    );
}
