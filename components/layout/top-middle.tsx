"use client";

import Image from "next/image";
import {
  Search,
  Menu,
  Bell,
  User,
  Sparkles,
  X,
  Settings,
  LogOut,
} from "lucide-react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { GlobalSearch } from "@/components/search/global-search";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "./breadcrumbs";
import { ThemeToggle } from "./ThemeToggle";
import { useAuthContext } from "@/contexts/auth-context";
import { useUserProfile } from "@/hooks/use-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TopMiddleProps {
  onToggleSidebar: () => void;
  onToggleRightBar: () => void;
  navigationLinks?: boolean;
  withLeft?: boolean;
  isSideBarOpen?: boolean;
  isRightBarOpen?: boolean;
  hideOnScroll?: boolean;
  breadcrumbItems?: Array<{ name: string; path: string }>;
}

const TopMiddle = ({
  onToggleSidebar,
  onToggleRightBar,
  navigationLinks,
  withLeft,
  isSideBarOpen,
  isRightBarOpen,
  hideOnScroll = false,
  breadcrumbItems = [],
}: TopMiddleProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const { user, isAuthenticated, isAdmin, isVip, signOut } = useAuthContext();
  const { data: completeData } = useUserProfile();

  const headerRef = useRef<HTMLDivElement>(null);

  // Track scroll direction and update visibility
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (hideOnScroll && latest > lastScrollY && latest > 100) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }

    if (latest > 10) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }

    setLastScrollY(latest);
  });

  // User menu items
  const userMenuItems = [
    { label: "Mon Profil", href: "/profile", icon: User },
    { label: "Paramètres", href: "/settings", icon: Settings },
    { label: "Déconnexion", action: signOut, icon: LogOut },
  ];

  return (
    <motion.div
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-50"
      initial={{ y: 0 }}
      animate={{
        y: isVisible ? 0 : -100,
        backdropFilter: isScrolled ? "blur(10px)" : "blur(0px)",
      }}
      transition={{ 
        type: "spring", 
        stiffness: 500, 
        damping: 30 
      }}
    >
      {/* Main Top Bar */}
      <div
        className={cn(
          "flex items-center justify-between px-4 lg:px-6 h-16 transition-all duration-300 relative",
          "bg-background/80 border-b border-border/50"
        )}
      >
        {/* Gradient overlay for scrolled state */}
        {isScrolled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-transparent"
          />
        )}

        {/* Left: Logo and Menu Toggle */}
        <div className="flex items-center gap-4 z-10">
          {withLeft && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-primary/10"
                onClick={onToggleSidebar}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </motion.div>
          )}

          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="relative w-10 h-10"
            >
              <Image
                src="/images/icons/logo/game_logo.png"
                alt="logo"
                fill
                className="object-contain drop-shadow-lg"
                priority
              />
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              GT-V2
            </span>
            {isVip && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 gap-1">
                <Sparkles className="h-3 w-3" />
                VIP
              </Badge>
            )}
          </Link>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-2xl mx-4 hidden md:block">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div 
              className="relative group"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <Input
                placeholder="Rechercher des boutiques, produits, tournois..."
                className="pl-10 pr-4 h-10 rounded-full bg-background border border-border/50 shadow-sm focus:shadow-lg focus:border-primary/50 transition-all cursor-pointer hover:border-primary/30"
                readOnly
              />
            </div>
          </motion.div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 z-10">
          {/* Mobile Search Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="md:hidden"
          >
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-primary/10"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
          </motion.div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-primary/10 relative"
              onClick={onToggleRightBar}
            >
              <Bell className="h-5 w-5" />
              {completeData?.notifications?.unread?.length ? (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs border-2 border-background"
                >
                  {Math.min(completeData.notifications.unread.length, 9)}
                  {completeData.notifications.unread.length > 9 && "+"}
                </Badge>
              ) : null}
            </Button>
          </motion.div>

          {/* User Menu */}
          <AnimatePresence mode="wait">
            {isAuthenticated ? (
              <DropdownMenu open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button variant="ghost" className="rounded-full p-1 gap-2 hover:bg-primary/10">
                      <Avatar className="h-8 w-8 border-2 border-primary/20">
                        <AvatarImage src={user?.profileImage || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white">
                          {user?.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:inline text-sm font-medium">
                        {user?.username || "Profil"}
                      </span>
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-56 mt-2 rounded-xl shadow-2xl border-border/50 bg-background/95 backdrop-blur-lg"
                >
                  <div className="px-4 py-3 border-b border-border/50">
                    <p className="text-sm font-semibold">{user?.fullName || user?.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    <div className="flex gap-1 mt-2">
                      {isVip && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-xs">
                          VIP
                        </Badge>
                      )}
                      {isAdmin && (
                        <Badge variant="outline" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                  {userMenuItems.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <DropdownMenuItem 
                        className="px-3 py-2.5 cursor-pointer hover:bg-primary/10"
                        onClick={item.action ? item.action : undefined}
                        asChild={!item.action}
                      >
                        {item.href ? (
                          <Link href={item.href} className="flex items-center gap-3">
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3">
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </div>
                        )}
                      </DropdownMenuItem>
                    </motion.div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Button
                  variant="ghost"
                  className="rounded-full gap-2 hover:bg-primary/10"
                  asChild
                >
                  <Link href="/sign-in">
                    <User className="h-4 w-4" />
                    <span className="hidden lg:inline">Connexion</span>
                  </Link>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Breadcrumbs */}
      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className={cn(
            "border-b border-border/50 bg-background/60 backdrop-blur-sm",
            isScrolled && "border-t border-border/30"
          )}
        >
          <div className="container mx-auto px-4 lg:px-6 py-2">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        </motion.div>
      )}

      {/* Global Search Dialog */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </motion.div>
  );
};

export default TopMiddle;