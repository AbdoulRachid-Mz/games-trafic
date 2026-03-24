// @/docs/layout.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Book, 
  Shield, 
  FileText, 
  Menu, 
  X, 
  Search, 
  ChevronRight,
  Home,
  Compass,
  HelpCircle,
  Mail,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/use-debounce";
import { useScreenSize } from "@/hooks/use-screen";

interface NavItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}

const docsNav: NavItem[] = [
  {
    title: "Bienvenue",
    href: "/docs",
    icon: <Home className="h-4 w-4" />,
  },
  {
    title: "Guides",
    href: "/docs/guides",
    icon: <Book className="h-4 w-4" />,
    children: [
      { title: "Tous les guides", href: "/docs/guides" },
      { title: "Débuter", href: "/docs/guides?category=débutant" },
      { title: "Transactions", href: "/docs/guides?category=transaction" },
      { title: "Tournois", href: "/docs/guides?category=tournoi" },
      { title: "Boutique", href: "/docs/guides?category=boutique" },
    ],
  },
  {
    title: "Légal",
    href: "/docs/legal",
    icon: <Shield className="h-4 w-4" />,
    children: [
      { title: "Conditions d'utilisation", href: "/docs/legal/terms" },
      { title: "Politique de confidentialité", href: "/docs/legal/privacy" },
      { title: "Mentions légales", href: "/docs/legal/legal" },
      { title: "CGV", href: "/docs/legal/cgv" },
    ],
  },
  {
    title: "Support",
    href: "/support",
    icon: <HelpCircle className="h-4 w-4" />,
  },
  {
    title: "Contact",
    href: "/contact",
    icon: <Mail className="h-4 w-4" />,
  },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NavItem[]>([]);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { isMediumScreen } = useScreenSize();

  useEffect(() => {
    if (debouncedSearch.length > 2) {
      const filterNav = (items: NavItem[]): NavItem[] => {
        const results: NavItem[] = [];
        for (const item of items) {
          if (item.title.toLowerCase().includes(debouncedSearch.toLowerCase())) {
            results.push(item);
          }
          if (item.children) {
            const childResults = filterNav(item.children);
            results.push(...childResults);
          }
        }
        return results;
      };
      setSearchResults(filterNav(docsNav));
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4 px-4 max-w-7xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {isMediumScreen ? "Games Trafic" : "GT"}
            </span>
            <span className="text-sm text-muted-foreground">/ Docs</span>
          </Link>

          <div className="flex-1 max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans la documentation..."
                className="pl-9 bg-muted/50 border-muted"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg overflow-hidden z-50"
                  >
                    {searchResults.slice(0, 8).map((result) => (
                      <Link
                        key={result.href}
                        href={result.href}
                        onClick={() => setSearchQuery("")}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
                      >
                        {result.icon}
                        <span>{result.title}</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ExternalLink className="h-4 w-4 mr-2" />
              Retour au site
            </Link>
          </Button>
        </div>
      </header>

      <div className="container flex-1 items-start md:grid md:grid-cols-[280px_minmax(0,1fr)] gap-8 lg:gap-12 w-full max-w-7xl mx-auto px-4">
        {/* Desktop Sidebar */}
        <aside className="fixed top-16 z-30 -ml-2 hidden h-[calc(100vh-4rem)] w-full shrink-0 md:sticky md:block">
          <ScrollArea className="h-full py-6 pr-6">
            <nav className="space-y-1">
              {docsNav.map((item) => (
                <DesktopNavItem 
                  key={item.href} 
                  item={item} 
                  pathname={pathname}
                />
              ))}
            </nav>
          </ScrollArea>
        </aside>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                className="fixed top-0 left-0 bottom-0 w-[280px] bg-background border-r z-50 md:hidden"
              >
                <div className="flex items-center justify-between p-4 border-b">
                  <span className="font-bold">Navigation</span>
                  <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <ScrollArea className="h-[calc(100%-60px)] p-4">
                  <nav className="space-y-1">
                    {docsNav.map((item) => (
                      <MobileNavItem
                        key={item.href}
                        item={item}
                        pathname={pathname}
                        onClose={() => setSidebarOpen(false)}
                      />
                    ))}
                  </nav>
                </ScrollArea>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="relative py-8 lg:py-12">
          <div className="mx-auto w-full min-w-0 max-w-3xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function DesktopNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 px-2 py-2 text-sm font-medium text-muted-foreground">
          {item.icon}
          <span>{item.title}</span>
        </div>
        <div className="pl-6 space-y-1">
          {item.children!.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                pathname === child.href
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <ChevronRight className="h-3 w-3" />
              {child.title}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2 px-2 py-2 text-sm rounded-md transition-colors",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {item.icon}
      {item.title}
    </Link>
  );
}

function MobileNavItem({ 
  item, 
  pathname, 
  onClose 
}: { 
  item: NavItem; 
  pathname: string; 
  onClose: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-2 py-2 text-sm rounded-md hover:bg-muted"
        >
          <div className="flex items-center gap-2">
            {item.icon}
            <span>{item.title}</span>
          </div>
          <ChevronRight className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")} />
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="pl-6 space-y-1 overflow-hidden"
            >
              {item.children!.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                    pathname === child.href
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <ChevronRight className="h-3 w-3" />
                  {child.title}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-2 px-2 py-2 text-sm rounded-md transition-colors",
        pathname === item.href
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted"
      )}
    >
      {item.icon}
      {item.title}
    </Link>
  );
}