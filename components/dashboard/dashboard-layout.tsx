// components/dashboard/dashboard-layout.tsx
"use client";

import { useState, useEffect, ReactNode, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Sparkles,
  Bell,
} from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { PageSkeleton } from "../ui/page-skeleton";
import { Sheet } from "@/components/ui/sheet";
import { SheetContent } from "@/components/ui/sheet";

interface DashboardTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  path?: string;
  content?: ReactNode;
  badge?: string;
  description?: string;
}

interface DashboardLayoutProps {
  title: string;
  shortTitle?: string | React.ReactNode;
  tabs?: DashboardTab[];
  children?: ReactNode;
  headerContent?: ReactNode;
  isLoading?: boolean;
  isAuthorized?: boolean;
  unauthorizedRedirect?: string;
  defaultTab?: string;
  mobileBreakpoint?: number;
  initialSidebarOpen?: boolean;
  sidebarBgType?: "gradient" | "glass" | "neuomorphic" | "solid" | "default";
  togglePosition?: "edge" | "top";
  user?: {
    username?: string;
    profileImage?: string;
    status?: "online" | "offline" | "busy";
    level?: string;
  };
}

export function DashboardLayout({
  title,
  shortTitle = title.substring(0, 2),
  tabs,
  children,
  headerContent,
  isLoading = false,
  isAuthorized = true,
  unauthorizedRedirect = "/",
  defaultTab = "overview",
  mobileBreakpoint = 768,
  initialSidebarOpen = false,
  sidebarBgType = "default",
  togglePosition = "edge",
  user,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isSidebarOpen, setIsSidebarOpen] = useState(initialSidebarOpen);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const router = useRouter();

  // Helper pour détecter les variants "light" (gradient/glass)
  const isVariantLight = sidebarBgType === "gradient" || sidebarBgType === "glass";

  // If the URL contains a `tab` query param and it matches a provided tab id, use it
  useEffect(() => {
    if (!tabs) return;
    const q = searchParams?.get("tab");
    if (q && tabs.some((t) => t.id === q)) {
      setActiveTab(q);
    }
  }, [searchParams, tabs]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < mobileBreakpoint;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(initialSidebarOpen);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileBreakpoint, initialSidebarOpen]);

  useEffect(() => {
    if (!isLoading && !isAuthorized) {
      window.location.href = unauthorizedRedirect;
    }
  }, [isLoading, isAuthorized, unauthorizedRedirect]);

  useEffect(() => {
    if (!tabs) return;

    const currentTab = tabs.find(
      (tab) => tab.path && pathname.startsWith(tab.path)
    );
    if (currentTab) {
      setActiveTab(currentTab.id);
    }
  }, [pathname, tabs]);

  const currentContent = useMemo(() => {
    if (!tabs) return children;
    const tab = tabs.find((t) => t.id === activeTab);
    return tab?.content || children;
  }, [activeTab, tabs, children]);

  // Styles dynamiques basés sur sidebarBgType
  const getSidebarStyles = () => {
    switch (sidebarBgType) {
      case "gradient":
        return "bg-gradient-to-br from-background via-muted to-background text-foreground border-r border-border";
      case "glass":
        return "bg-background/80 backdrop-blur-md text-foreground border-r border-border";
      case "neuomorphic":
        return "bg-sidebar neomorphic text-foreground border-r border-border";
      case "solid":
        return "bg-sidebar text-foreground border-r border-border";
      case "default":
      default:
        return "bg-sidebar text-foreground border-r border-border";
    }
  };

  const getItemStyles = (isActive: boolean) => {
    const baseStyles = "group relative overflow-hidden transition-all duration-300 p-3 rounded-lg cursor-pointer";
    
    switch (sidebarBgType) {
      case "gradient":
        return cn(
          baseStyles,
          "hover:scale-105 hover:shadow-lg",
          isActive
            ? "bg-primary/10 shadow-lg text-primary"
            : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
        );
      case "glass":
        return cn(
          baseStyles,
          "hover:scale-105 hover:shadow-lg",
          isActive
            ? "bg-primary/10 shadow-lg text-primary backdrop-blur-sm border border-primary/20"
            : "hover:bg-accent/50 text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
        );
      case "neuomorphic":
        return cn(
          baseStyles,
          "hover:scale-105 neomorphic",
          isActive
            ? "bg-primary/10 shadow-inner text-primary"
            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
        );
      case "solid":
        return cn(
          baseStyles,
          "hover:scale-105 hover:shadow-lg",
          isActive
            ? "bg-primary/10 shadow-md text-primary"
            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
        );
      case "default":
      default:
        return cn(
          baseStyles,
          "hover:scale-105 hover:shadow-lg",
          isActive
            ? "bg-primary text-primary-foreground shadow-md"
            : "hover:bg-accent text-accent-foreground hover:text-foreground"
        );
    }
  };

  const getIconStyles = (isActive: boolean) => {
    const baseStyles = "p-2 rounded-lg transition-all duration-300";
    
    switch (sidebarBgType) {
      case "gradient":
      case "glass":
        return cn(
          baseStyles,
          isActive
            ? "bg-primary/10 text-primary"
            : "group-hover:bg-accent/50 text-muted-foreground group-hover:text-foreground"
        );
      case "neuomorphic":
        return cn(
          baseStyles,
          isActive
            ? "bg-primary text-primary-foreground"
            : "group-hover:bg-primary/10 text-muted-foreground group-hover:text-foreground"
        );
      case "solid":
        return cn(
          baseStyles,
          isActive
            ? "bg-primary text-primary-foreground"
            : "group-hover:bg-primary/10 text-muted-foreground group-hover:text-foreground"
        );
      case "default":
      default:
        return cn(
          baseStyles,
          isActive
            ? "bg-primary text-primary-foreground"
            : "group-hover:bg-accent text-muted-foreground group-hover:text-foreground"
        );
    }
  };

  const getTextColor = () => {
    return "text-foreground";
  };

  if (isLoading) {
    return <PageSkeleton type="dashboard" />;
  }

  if (!isAuthorized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">
            Vous n'êtes pas autorisé à voir cette page
          </p>
          <Button asChild variant="default" onClick={() => router.back()}>
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar (Desktop) */}
      {!isMobile && (
        <AnimatePresence>
          <motion.div
            key="desktop-sidebar"
            initial={{ width: isSidebarOpen ? 280 : 80, opacity: 1 }}
            animate={{ width: isSidebarOpen ? 280 : 80, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={cn(
              "relative z-20 h-full shadow-lg",
              getSidebarStyles(),
              isSidebarOpen ? "w-72" : "w-20"
            )}
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-xl transition-all duration-300",
                      isVariantLight
                        ? "bg-primary/10 backdrop-blur-sm"
                        : "bg-primary/10"
                    )}
                  >
                    <Sparkles
                      className={cn(
                        "h-6 w-6",
                        isVariantLight
                          ? "text-primary"
                          : "text-primary"
                      )}
                    />
                  </div>
                  {isSidebarOpen && (
                    <Typography variant="h4" weight="bold" className={getTextColor()}>
                      {title}
                    </Typography>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {togglePosition === "top" && (
                    <button
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      className={cn(
                        "p-1 rounded-full hover:bg-accent transition-colors",
                        isVariantLight
                          ? "bg-accent/50 text-foreground"
                          : "bg-primary/10 text-primary"
                      )}
                    >
                      {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                  )}
                </div>
              </div>
              {!isMobile && togglePosition === "edge" && (
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={cn(
                    "absolute -right-3 top-6 rounded-full p-1 z-20 transition-colors",
                    isVariantLight
                      ? "bg-accent text-foreground hover:bg-accent/80"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
              )}
              {tabs && (
                <ScrollArea className="flex-1 p-4">
                  <TooltipProvider delayDuration={100}>
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <Tooltip key={tab.id}>
                          <TooltipTrigger asChild>
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={getItemStyles(isActive)}
                              onClick={() => {
                                if (tab.path) {
                                  window.location.href = tab.path;
                                } else {
                                  setActiveTab(tab.id);
                                }
                              }}
                            >
                              <div className="flex items-center gap-3 w-full">
                                <div className={getIconStyles(isActive)}>
                                  <tab.icon size={20} />
                                </div>
                                {isSidebarOpen && (
                                  <>
                                    <div className="flex-1 min-w-0">
                                      <Typography
                                        variant="body-sm"
                                        weight="medium"
                                        className={cn(
                                          "truncate",
                                          isActive ? "text-primary" : "text-foreground"
                                        )}
                                      >
                                        {tab.label}
                                      </Typography>
                                      {tab.description && (
                                        <Typography
                                          variant="caption2"
                                          className="text-xs text-muted-foreground"
                                        >
                                          {tab.description}
                                        </Typography>
                                      )}
                                    </div>
                                    {tab.badge && (
                                      <Badge
                                        variant={isActive ? "default" : "secondary"}
                                        className="text-xs px-1.5 py-0.5"
                                      >
                                        {tab.badge}
                                      </Badge>
                                    )}
                                  </>
                                )}
                              </div>
                            </motion.div>
                          </TooltipTrigger>
                          {!isSidebarOpen && (
                            <TooltipContent side="right">
                              <div className="text-center">
                                <p className="font-medium">{tab.label}</p>
                                {tab.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{tab.description}</p>
                                )}
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      );
                    })}
                  </TooltipProvider>
                </ScrollArea>
              )}
              {user && (
                <div
                  className={cn(
                    "p-4 border-t",
                    isVariantLight ? "border-border" : "border-border"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl",
                      isVariantLight
                        ? "bg-muted/50 backdrop-blur-sm border border-border"
                        : "bg-muted"
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImage} />
                      <AvatarFallback
                        className={cn(
                          "text-xs",
                          isVariantLight ? "bg-primary/10 text-primary" : "bg-muted-foreground/20"
                        )}
                      >
                        {user.username?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {isSidebarOpen && (
                      <div className="flex-1 min-w-0">
                        <Typography variant="body-sm" weight="medium" className="truncate text-foreground">
                          {user.username || "Utilisateur"}
                        </Typography>
                        {user.level && (
                          <Typography
                            variant="caption2"
                            className="text-muted-foreground"
                          >
                            Niveau {user.level}
                          </Typography>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Sidebar (Mobile Sheet) */}
      {isMobile && (
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetContent side="left" className="p-0" showCloseButton>
            <div className={cn("h-full", getSidebarStyles())}>
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-xl transition-all duration-300",
                        isVariantLight
                          ? "bg-primary/10 backdrop-blur-sm"
                          : "bg-primary/10"
                      )}
                    >
                      <Sparkles
                        className={cn(
                          "h-6 w-6",
                          isVariantLight
                            ? "text-primary"
                            : "text-primary"
                        )}
                      />
                    </div>
                    <Typography variant="h4" weight="bold" className={getTextColor()}>
                      {title}
                    </Typography>
                  </div>
                </div>
                {tabs && (
                  <ScrollArea className="flex-1 p-4">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <div
                          key={tab.id}
                          className={getItemStyles(isActive)}
                          onClick={() => {
                            if (tab.path) {
                              window.location.href = tab.path;
                            } else {
                              setActiveTab(tab.id);
                            }
                            setIsSidebarOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className={getIconStyles(isActive)}>
                              <tab.icon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <Typography
                                variant="body-sm"
                                weight="medium"
                                className={cn(
                                  "truncate",
                                  isActive ? "text-primary" : "text-foreground"
                                )}
                              >
                                {tab.label}
                              </Typography>
                              {tab.description && (
                                <Typography
                                  variant="caption2"
                                  className="text-xs text-muted-foreground"
                                >
                                  {tab.description}
                                </Typography>
                              )}
                            </div>
                            {tab.badge && <Badge variant={isActive ? "default" : "secondary"}>{tab.badge}</Badge>}
                          </div>
                        </div>
                      );
                    })}
                  </ScrollArea>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b p-4 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                  <Menu size={20} />
                </Button>
              )}
              {headerContent || (
                <div>
                  <Typography variant="h5" weight="semibold">
                    {tabs?.find((t) => t.id === activeTab)?.label || title}
                  </Typography>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <ScrollArea className="flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full p-6"
          >
            {currentContent}
          </motion.div>
        </ScrollArea>
      </div>
    </div>
  );
}