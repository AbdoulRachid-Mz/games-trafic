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
  X,
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
  // position of the sidebar toggle for desktop: 'edge' -> floating edge button, 'top' -> inside sidebar header
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
        return "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white border-r border-white/20";
      case "glass":
        return "glass text-white border-r border-white/20 backdrop-blur-md";
      case "neuomorphic":
        return "bg-sidebar neomorphic text-foreground border-r";
      case "solid":
        return "bg-sidebar text-foreground border-r";
      case "default":
      default:
        return "bg-sidebar text-foreground border-r";
    }
  };

  const getItemStyles = (isActive: boolean) => {
    switch (sidebarBgType) {
      case "gradient":
        return cn(
          "group relative overflow-hidden transition-all duration-300 p-3 rounded-lg",
          "hover:scale-105 hover:shadow-lg cursor-pointer",
          isActive
            ? "bg-white/20 shadow-lg text-white backdrop-blur-sm"
            : "hover:bg-white/10 text-white/80 hover:text-white"
        );
      case "glass":
        return cn(
          "group relative overflow-hidden transition-all duration-300 p-3 rounded-lg",
          "hover:scale-105 hover:shadow-lg cursor-pointer glass-shine",
          isActive
            ? "bg-white/20 shadow-lg text-white backdrop-blur-sm border border-white/20"
            : "hover:bg-white/10 text-white/80 hover:text-white border border-transparent hover:border-white/10"
        );
      case "neuomorphic":
        return cn(
          "group relative overflow-hidden transition-all duration-300 p-3 rounded-lg",
          "hover:scale-105 cursor-pointer neomorphic",
          isActive
            ? "bg-primary/10 shadow-inner text-primary"
            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
        );
      case "solid":
        return cn(
          "group relative overflow-hidden transition-all duration-300 p-3 rounded-lg",
          "hover:scale-105 hover:shadow-lg cursor-pointer",
          isActive
            ? "bg-primary/10 shadow-md text-primary"
            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
        );
      case "default":
      default:
        return cn(
          "group relative overflow-hidden transition-all duration-300 p-3 rounded-lg",
          "hover:scale-105 hover:shadow-lg cursor-pointer",
          isActive
            ? "bg-primary text-primary-foreground shadow-md"
            : "hover:bg-accent text-accent-foreground hover:text-foreground"
        );
    }
  };

  const getIconStyles = (isActive: boolean) => {
    switch (sidebarBgType) {
      case "gradient":
      case "glass":
        return cn(
          "p-2 rounded-lg transition-all duration-300",
          isActive
            ? "bg-white/20 text-yellow-400"
            : "group-hover:bg-white/10 text-white/70 group-hover:text-white"
        );
      case "neuomorphic":
        return cn(
          "p-2 rounded-lg transition-all duration-300",
          isActive
            ? "bg-primary text-primary-foreground"
            : "group-hover:bg-primary/10 text-muted-foreground group-hover:text-foreground"
        );
      case "solid":
        return cn(
          "p-2 rounded-lg transition-all duration-300",
          isActive
            ? "bg-primary text-primary-foreground"
            : "group-hover:bg-primary/10 text-muted-foreground group-hover:text-foreground"
        );
      case "default":
      default:
        return cn(
          "p-2 rounded-lg transition-all duration-300",
          isActive
            ? "bg-primary text-primary-foreground"
            : "group-hover:bg-accent text-muted-foreground group-hover:text-foreground"
        );
    }
  };

  const getTextColor = () => {
    switch (sidebarBgType) {
      case "gradient":
      case "glass":
        return "text-white";
      case "neuomorphic":
        return isDark ? "text-white" : "text-foreground";
      case "solid":
        return isDark ? "text-white" : "text-foreground";
      case "default":
      default:
        return "text-foreground";
    }
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
      {/* Mobile menu button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={cn(
          "fixed z-30 top-4 right-4 md:hidden",
          isSidebarOpen && "hidden"
        )}
      >
        <Menu size={24} />
      </Button>

      {/* Sidebar */}
      <AnimatePresence>
        {(!isMobile || isSidebarOpen) && (
          <motion.div
            initial={{
              width: isSidebarOpen ? 280 : 80,
              opacity: isMobile && !isSidebarOpen ? 0 : 1,
            }}
            animate={{
              width: isSidebarOpen ? 280 : 80,
              opacity: 1,
            }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={cn(
              "fixed md:relative z-20 h-full shadow-lg",
              getSidebarStyles(),
              isSidebarOpen ? "w-72" : "w-20"
            )}
          >
            <div className="h-full flex flex-col">
              {/* Sidebar header */}
              <div className="flex items-center justify-between p-6 border-b border-white/20">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-xl transition-all duration-300",
                      sidebarBgType === "gradient" || sidebarBgType === "glass"
                        ? "bg-white/20 backdrop-blur-sm"
                        : "bg-primary/10"
                    )}
                  >
                    <Sparkles
                      className={cn(
                        "h-6 w-6",
                        sidebarBgType === "gradient" ||
                          sidebarBgType === "glass"
                          ? "text-yellow-400"
                          : "text-primary"
                      )}
                    />
                  </div>
                  {isSidebarOpen && (
                    <Typography
                      variant="h4"
                      weight="bold"
                      className={getTextColor()}
                    >
                      {title}
                    </Typography>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Close button */}
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "p-1 rounded-full hover:bg-white/10 transition-colors",
                      getTextColor()
                    )}
                  >
                    <X size={18} />
                  </button>

                  {/* If togglePosition is 'top', show toggle here */}
                  {togglePosition === "top" && !isMobile && (
                    <button
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      className={cn(
                        "p-1 rounded-full hover:bg-white/10 transition-colors",
                        sidebarBgType === "gradient" || sidebarBgType === "glass"
                          ? "bg-white/10 text-white"
                          : "bg-primary/10 text-primary"
                      )}
                    >
                      {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Toggle button - desktop (edge) */}
              {!isMobile && togglePosition === "edge" && (
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={cn(
                    "absolute -right-3 top-6 rounded-full p-1 z-20 transition-colors",
                    sidebarBgType === "gradient" || sidebarBgType === "glass"
                      ? "bg-white/20 text-white hover:bg-white/30"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {isSidebarOpen ? (
                    <ChevronLeft size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
              )}

              {/* Navigation items */}
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
                                if (isMobile) setIsSidebarOpen(false);
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
                                          getTextColor()
                                        )}
                                      >
                                        {tab.label}
                                      </Typography>
                                      {tab.description && (
                                        <Typography
                                          variant="caption2"
                                          className={cn(
                                            "text-xs",
                                            sidebarBgType === "gradient" ||
                                              sidebarBgType === "glass"
                                              ? "text-white/60"
                                              : "text-muted-foreground"
                                          )}
                                        >
                                          {tab.description}
                                        </Typography>
                                      )}
                                    </div>

                                    {tab.badge && (
                                      <Badge
                                        variant="secondary"
                                        className={cn(
                                          "text-xs px-1.5 py-0.5",
                                          sidebarBgType === "gradient" ||
                                            sidebarBgType === "glass"
                                            ? "bg-yellow-400/20 text-yellow-300 border-yellow-400/30"
                                            : ""
                                        )}
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
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {tab.description}
                                  </p>
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

              {/* User footer */}
              {user && (
                <div
                  className={cn(
                    "p-4 border-t",
                    sidebarBgType === "gradient" || sidebarBgType === "glass"
                      ? "border-white/20"
                      : "border-border"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl",
                      sidebarBgType === "gradient" || sidebarBgType === "glass"
                        ? "bg-white/10 backdrop-blur-sm border border-white/20"
                        : "bg-muted"
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImage} />
                      <AvatarFallback
                        className={cn(
                          "text-xs",
                          sidebarBgType === "gradient" ||
                            sidebarBgType === "glass"
                            ? "bg-white/20 text-white"
                            : ""
                        )}
                      >
                        {user.username?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>

                    {isSidebarOpen && (
                      <div className="flex-1 min-w-0">
                        <Typography
                          variant="body-sm"
                          weight="medium"
                          className={cn("truncate", getTextColor())}
                        >
                          {user.username || "Utilisateur"}
                        </Typography>
                        {user.level && (
                          <Typography
                            variant="caption2"
                            className={cn(
                              sidebarBgType === "gradient" ||
                                sidebarBgType === "glass"
                                ? "text-white/60"
                                : "text-muted-foreground"
                            )}
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
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b p-4 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="md:hidden"
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
