// components/dashboard/enhanced-dashboard.tsx
"use client"

import React, { createContext, useContext } from "react"
import { cn } from "@/lib/utils"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Typography } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Sparkles, Menu, LayoutDashboard } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useScreenSize } from "@/hooks/use-screen"
import { ThemeToggle } from "../layout/ThemeToggle"

// Mobile sheet close context — allows SidebarItem to close the mobile Sheet when clicked
const MobileSheetContext = createContext<(() => void) | null>(null);

interface EnhancedDashboardProps {
  children: React.ReactNode
  sidebar: React.ReactNode
  header: React.ReactNode
  className?: string
  sidebarBgType?: "gradient" | "glass" | "neuomorphic" | "solid" | "default"
  showSidebarTrigger?: boolean
  mobileBreakpoint?: number
}

export function EnhancedDashboard({
  children,
  sidebar,
  header,
  className,
  sidebarBgType = "default",
  showSidebarTrigger = true,
  mobileBreakpoint = 768
}: EnhancedDashboardProps) {
  const { screenSize } = useScreenSize()
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)

  const isMobile = screenSize.width < mobileBreakpoint

  // Version mobile avec Sheet
  if (isMobile) {
    return (
      <div className={cn("flex min-h-screen w-full flex-col ", className)}>
        {/* Header mobile avec bouton menu */}
        <header className="flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
          <div className="flex items-center gap-2">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTitle className='hidden'>title</SheetTitle>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <LayoutDashboard className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[280px] overflow-y-auto">
                <MobileSheetContext.Provider value={() => setIsMobileOpen(false)}>
                  {sidebar}
                </MobileSheetContext.Provider>
              </SheetContent>
            </Sheet>
            <Typography variant="h6" weight="semibold">
              {typeof header === 'string' ? header : 'Dashboard'}
            </Typography>
          </div>
          <ThemeToggle />
        </header>

        {/* Contenu mobile */}
        <main className="flex-1 p-3">
          {children}
        </main>
      </div>
    )
  }

  // Version desktop avec SidebarProvider
  return (
    <SidebarProvider defaultOpen={true}>
      <div className={cn("flex min-h-screen w-full", className)}>
        {sidebar}
        <SidebarInset className="flex-1">
          {header}
          <main className="flex-1 p-6 max-md:p-3 max-md:space-y-4 space-y-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

// Composants pour les éléments de sidebar réutilisables
interface SidebarItemProps {
  title: string
  url?: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  description?: string
  isActive?: boolean
  onClick?: () => void
  sidebarBgType?: "gradient" | "glass" | "neuomorphic" | "solid" | "default"
}

export function SidebarItem({
  title,
  url,
  icon: Icon,
  badge,
  description,
  isActive = false,
  onClick,
  sidebarBgType = "default"
}: SidebarItemProps) {
  // Gestion du cas où useSidebar n'est pas disponible (mobile)
  let state = "expanded"
  try {
    const sidebarContext = useSidebar()
    state = sidebarContext.state
  } catch (e) {
    // En mode mobile, on considère que c'est toujours expanded
    state = "expanded"
  }

  const { theme } = useTheme()
  const isDark = theme === "dark"
  const isVariantLight = sidebarBgType === "gradient" || sidebarBgType === "glass"

  const getItemStyles = () => {
    const baseStyles = "group hover:border-l-4 hover:border-primary hover:bg-primary/10 overflow-hidden transition-all duration-300 p-2 rounded-lg hover:scale-105 hover:shadow-md cursor-pointer"
    
    switch (sidebarBgType) {
      case "gradient":
        return cn(
          baseStyles,
          isActive
            ? "bg-primary/10 text-primary shadow-md border-l-4 border-primary"
            : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
        )
      case "glass":
        return cn(
          "group relative overflow-hidden transition-all duration-300 p-2 rounded-lg",
          "hover:scale-105 hover:shadow-lg cursor-pointer",
          isActive
            ? "bg-primary/10 shadow-lg text-primary backdrop-blur-sm border border-primary/30 border-l-4 border-primary"
            : "hover:bg-accent/50 text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
        )
      case "neuomorphic":
        return cn(
          "group relative overflow-hidden transition-all duration-300 p-2 rounded-lg",
          "hover:scale-105 cursor-pointer neomorphic",
          isActive
            ? "bg-primary/20 shadow-inner text-primary border-l-4 border-primary"
            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
        )
      case "solid":
        return cn(
          "group relative overflow-hidden transition-all duration-300 p-2 rounded-lg",
          "hover:scale-105 hover:shadow-lg cursor-pointer",
          isActive
            ? "bg-primary/20 shadow-md text-primary border-l-4 border-primary"
            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
        )
      case "default":
      default:
        return cn(
          "group hover:border-l-4 hover:border-primary hover:bg-primary/10 overflow-hidden transition-all duration-300 p-2 rounded-lg",
          "hover:scale-105 hover:shadow-md cursor-pointer",
          isActive
            ? "bg-primary/10 text-primary shadow-md border-l-4 border-primary"
            : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
        )
    }
  }

  const getIconStyles = () => {
    const baseStyles = "p-1.5 rounded-lg transition-all duration-300"
    
    switch (sidebarBgType) {
      case "gradient":
      case "glass":
        return cn(
          baseStyles,
          isActive
            ? "bg-primary/10 text-primary"
            : "group-hover:bg-accent/50 text-muted-foreground group-hover:text-foreground"
        )
      case "neuomorphic":
        return cn(
          baseStyles,
          isActive
            ? "bg-primary text-primary-foreground"
            : "group-hover:bg-primary/10 text-muted-foreground group-hover:text-foreground"
        )
      case "solid":
        return cn(
          baseStyles,
          isActive
            ? "bg-primary text-primary-foreground"
            : "group-hover:bg-primary/10 text-muted-foreground group-hover:text-foreground"
        )
      case "default":
      default:
        return cn(
          baseStyles,
          isActive
            ? "bg-primary text-primary-foreground"
            : "group-hover:bg-accent text-muted-foreground group-hover:text-foreground"
        )
    }
  }

  const getTextColor = () => {
    if (isActive) return "text-primary"
    return "text-foreground"
  }

  const closeMobileSheet = useContext(MobileSheetContext);

  const content = (
    <div
      className={getItemStyles()}
      onClick={() => {
        if (onClick) onClick();
        if (closeMobileSheet) closeMobileSheet();
      }}
    >
      <div className="flex items-center gap-3 w-full">
        <div className={getIconStyles()}>
          <Icon className="h-4 w-4" />
        </div>

        {state === "expanded" && (
          <>
            <div className="flex-1 min-w-0">
              <Typography
                variant="body-sm"
                weight={isActive ? "semibold" : "medium"}
                className={cn(
                  "truncate",
                  getTextColor()
                )}
              >
                {title}
              </Typography>
              {description && (
                <Typography
                  variant="caption2"
                  className="text-xs text-muted-foreground"
                >
                  {description}
                </Typography>
              )}
            </div>

            {badge && (
              <Badge
                variant={isActive ? "default" : "secondary"}
                className="text-xs px-1.5 py-0.5"
              >
                {badge}
              </Badge>
            )}
          </>
        )}
      </div>

      {/* Animation pour l'item actif */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-0 right-0 w-2 h-2 rounded-full bg-primary"
        />
      )}
    </div>
  )

  // Si une URL est fournie, wrapper avec Link
  const wrappedContent = url ? (
    <Link href={url} passHref>
      {content}
    </Link>
  ) : content

  // Ne pas afficher de tooltip en mode mobile
  if (state === "expanded") {
    return wrappedContent
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {wrappedContent}
        </TooltipTrigger>
        {/* Afficher le tooltip seulement quand la sidebar est fermée */}
        {state === "collapsed" && (
          <TooltipContent side="right">
            <div className="text-center">
              <p className={cn("font-medium", isActive && "text-primary")}>
                {title}
                {isActive && " (actif)"}
              </p>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}

interface SidebarGroupProps {
  label: string
  children: React.ReactNode
  className?: string
  sidebarBgType?: "gradient" | "glass" | "neuomorphic" | "solid" | "default"
}

export function SidebarGroup({ label, children, className, sidebarBgType = "default" }: SidebarGroupProps) {
  let state = "expanded"
  try {
    const sidebarContext = useSidebar()
    state = sidebarContext.state
  } catch (e) {
    state = "expanded"
  }

  const { theme } = useTheme()
  const isDark = theme === "dark"

  const getLabelColor = () => {
    return "text-muted-foreground"
  }

  return (
    <div className={cn("mb-4", className)}>
      {state === "expanded" && (
        <Typography
          variant="body-sm"
          weight="semibold"
          className={cn(
            "text-xs uppercase tracking-wider mb-2 px-2",
            getLabelColor()
          )}
        >
          {label}
        </Typography>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  )
}

interface SidebarHeaderProps {
  title: string
  subtitle?: string
  user?: {
    username?: string
    profileImage?: string
    level?: string
  }
  className?: string
  sidebarBgType?: "gradient" | "glass" | "neuomorphic" | "solid" | "default"
}

export function SidebarHeader({ title, subtitle, user, className, sidebarBgType = "default" }: SidebarHeaderProps) {
  let state = "expanded"
  try {
    const sidebarContext = useSidebar()
    state = sidebarContext.state
  } catch (e) {
    state = "expanded"
  }

  const { theme } = useTheme()
  const isDark = theme === "dark"
  const isVariantLight = sidebarBgType === "gradient" || sidebarBgType === "glass"

  const getBackgroundStyles = () => {
    switch (sidebarBgType) {
      case "gradient":
        return cn(
          "bg-gradient-to-br from-background via-muted to-background",
          "text-foreground border-b border-border"
        )
      case "glass":
        return "bg-background/80 backdrop-blur-md border-b border-border text-foreground"
      case "neuomorphic":
        return "bg-sidebar neomorphic text-foreground border-b border-border"
      case "solid":
        return "bg-sidebar border-b border-border text-foreground"
      case "default":
      default:
        return "bg-sidebar border-b border-border text-foreground"
    }
  }

  const getTextColor = () => {
    return "text-foreground"
  }

  return (
    <div className={cn("px-4 py-6", getBackgroundStyles(), className)}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-xl transition-all duration-300",
          isVariantLight
            ? "bg-primary/10 backdrop-blur-sm"
            : "bg-primary/10"
        )}>
          <Sparkles className={cn(
            "h-6 w-6",
            "text-primary"
          )} />
        </div>
        {state === "expanded" && (
          <div className="animate-in slide-in-from-left-2 duration-300 min-w-0 flex-1 m">
            <Typography
              variant="h4"
              weight="bold"
              className={cn("truncate", getTextColor())}
              hasTooltip
              tooltipContent={title}
            >
              {title.length > 15 ? title.slice(0, 15) : title}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption1"
                className="truncate text-muted-foreground"
              >
                {subtitle}
              </Typography>
            )}
            {user && (
              <Typography
                variant="caption1"
                className="truncate text-muted-foreground"
              >
                Niveau {user.level} - {user.username}
              </Typography>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface SidebarFooterProps {
  user: {
    username?: string
    profileImage?: string
    status?: "online" | "offline" | "busy"
  }
  className?: string
  sidebarBgType?: "gradient" | "glass" | "neuomorphic" | "solid" | "default"
}

export function SidebarFooter({ user, className, sidebarBgType = "default" }: SidebarFooterProps) {
  let state = "expanded"
  try {
    const sidebarContext = useSidebar()
    state = sidebarContext.state
  } catch (e) {
    state = "expanded"
  }

  const { theme } = useTheme()
  const isDark = theme === "dark"
  const isVariantLight = sidebarBgType === "gradient" || sidebarBgType === "glass"

  const statusColors = {
    online: "bg-emerald-400",
    offline: "bg-gray-400",
    busy: "bg-amber-400"
  }

  const getBackgroundStyles = () => {
    switch (sidebarBgType) {
      case "gradient":
        return cn(
          "bg-gradient-to-t from-background via-muted to-background border-t",
          "text-foreground border-border"
        )
      case "glass":
        return "bg-background/80 backdrop-blur-md border-t border-border text-foreground"
      case "neuomorphic":
        return "bg-sidebar neomorphic border-t border-border text-foreground"
      case "solid":
        return "bg-sidebar border-t border-border text-foreground"
      case "default":
        return "bg-muted border-t border-border text-foreground"
      default:
        return "bg-sidebar border-t border-border text-foreground"
    }
  }

  const getContentStyles = () => {
    return cn(
      "flex items-center gap-3 p-3 rounded-xl",
      isVariantLight
        ? "bg-muted/50 backdrop-blur-sm border border-border"
        : "bg-muted"
    )
  }

  const getTextColor = () => {
    return "text-foreground"
  }

  return (
    <div className={cn("p-4", getBackgroundStyles(), className)}>
      <div className={getContentStyles()}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.profileImage} />
          <AvatarFallback className={cn(
            "text-xs",
            isVariantLight ? "bg-primary/10 text-primary" : "bg-muted-foreground/20"
          )}>
            {user?.username?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>

        {state === "expanded" && (
          <div className="flex-1 min-w-0">
            <Typography
              variant="body-sm"
              weight="medium"
              className={cn(
                "truncate",
                getTextColor()
              )}
            >
              {user?.username ? (user.username.length > 12 ? user.username.slice(0, 12) + "…" : user.username) : "Utilisateur"}
            </Typography>
            <div className="flex items-center gap-1">
              <Badge
                variant="secondary"
                className="text-xs px-1.5 py-0.5"
              >
                <div className={cn("w-1.5 h-1.5 rounded-full mr-1", statusColors[user?.status || "online"])} />
                {user?.status === "online" ? "En ligne" : user?.status === "busy" ? "Occupé" : "Hors ligne"}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface DashboardHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  showSidebarTrigger?: boolean
  className?: string
  onNotificationButtonClick?: () => void
  notificationCount?: number
  children?: React.ReactNode
  togglerComponent?: boolean;
}

export function DashboardHeader({
  title,
  description,
  actions,
  showSidebarTrigger = true,
  className,
  onNotificationButtonClick,
  notificationCount,
  togglerComponent,
  children
}: DashboardHeaderProps) {
  return (
    <header className={cn(
      "flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4",
      className
    )}>
      <div className="flex items-center gap-4">
        {showSidebarTrigger && <SidebarTrigger className="h-8 w-8" />}
        <div>
          <Typography variant="h5" weight="semibold">
            {title}
          </Typography>
          {description && (
            <Typography variant="body-sm" className="text-muted-foreground">
              {description}
            </Typography>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {children}
        {actions}
        {onNotificationButtonClick && (
          <Button variant="outline" size="sm" onClick={onNotificationButtonClick} className="relative">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            {typeof notificationCount === "number" && notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] h-4 min-w-4 px-1">
                {notificationCount}
              </span>
            )}
          </Button>
        )}
        {togglerComponent && <ThemeToggle />}
      </div>
    </header>
  )
}

// Composant de conteneur de sidebar avec styles dynamiques
interface SidebarContainerProps {
  children: React.ReactNode
  sidebarBgType?: "gradient" | "glass" | "neuomorphic" | "solid" | "default"
  className?: string
}

export function SidebarContainer({ children, sidebarBgType = "default", className }: SidebarContainerProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const getBackgroundStyles = () => {
    switch (sidebarBgType) {
      case "gradient":
        return cn(
          "bg-gradient-to-br from-background via-muted to-background",
          "text-foreground border-r border-border"
        )
      case "glass":
        return "bg-background/80 backdrop-blur-md text-foreground border-r border-border"
      case "neuomorphic":
        return "bg-sidebar neomorphic text-foreground border-r border-border"
      case "solid":
        return "bg-sidebar text-foreground border-r border-border"
      case "default":
      default:
        return "bg-background text-foreground border-r border-border"
    }
  }

  return (
    <div className={cn("flex flex-col h-full", getBackgroundStyles(), className)}>
      {children}
    </div>
  )
}