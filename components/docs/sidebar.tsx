"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Search, 
  ChevronRight,
  Menu,
  X,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/use-debounce";
import { useScreenSize } from "@/hooks/use-screen";

export interface NavItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}

interface DocsSidebarProps {
  navItems: NavItem[];
}

export function DocsSidebar({ navItems }: DocsSidebarProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NavItem[]>([]);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { isMediumScreen } = useScreenSize();

  useEffect(() => {
    if (debouncedSearch.length > 1) {
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
      setSearchResults(filterNav(navItems));
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch, navItems]);

  return (
    <>
      {/* Header (Included in sidebar component for layout consistency) */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4 px-4 max-w-7xl mx-auto font-sans">
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
            <span className="text-sm text-muted-foreground font-medium">/ Docs</span>
          </Link>

          <div className="flex-1 max-w-md mx-auto hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-9 bg-muted/40 border-muted focus:bg-background transition-all rounded-full h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-xl shadow-xl overflow-hidden z-50 py-2"
                  >
                    {searchResults.slice(0, 8).map((result) => (
                      <Link
                        key={result.href}
                        href={result.href}
                        onClick={() => setSearchQuery("")}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-sm"
                      >
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        <span>{result.title}</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden md:flex rounded-full">
              <Link href="/">
                <ExternalLink className="h-4 w-4 mr-2" />
                Site
              </Link>
            </Button>
            <Link href="/contact">
              <Button size="sm" className="rounded-full shadow-sm">Contact</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Sidebars */}
      <div className="container flex-1 items-start md:grid md:grid-cols-[260px_minmax(0,1fr)] gap-8 w-full max-w-7xl mx-auto px-4 font-sans">
        {/* Desktop Sidebar */}
        <aside className="fixed top-16 z-30 -ml-2 hidden h-[calc(100vh-4rem)] w-full shrink-0 md:sticky md:block">
          <ScrollArea className="h-full py-8 pr-6">
            <nav className="space-y-6">
              {navItems.map((group) => (
                <div key={group.title} className="space-y-2">
                  <h4 className="px-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                    {group.title}
                  </h4>
                  <div className="space-y-1">
                    {group.children?.map((item) => (
                      <NavItemComp key={item.href} item={item} pathname={pathname} />
                    ))}
                    {!group.children && <NavItemComp item={group} pathname={pathname} />}
                  </div>
                </div>
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
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                className="fixed top-0 left-0 bottom-0 w-[280px] bg-background border-r z-[70] md:hidden shadow-2xl"
              >
                <div className="flex items-center justify-between p-4 border-b">
                  <span className="font-bold">Navigation</span>
                  <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <ScrollArea className="h-[calc(100%-60px)] p-6">
                  <nav className="space-y-8">
                    {navItems.map((group) => (
                      <div key={group.title} className="space-y-2">
                        <h4 className="px-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                          {group.title}
                        </h4>
                        <div className="grid gap-1">
                          {group.children?.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setSidebarOpen(false)}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all",
                                pathname === item.href
                                  ? "bg-primary/10 text-primary font-semibold shadow-sm"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              )}
                            >
                              {item.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </nav>
                </ScrollArea>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Content Placeholder for layout structure */}
        <div /> 
      </div>
    </>
  );
}

function NavItemComp({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all duration-200",
        isActive
          ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary pl-2 shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground pl-3 hover:pl-4"
      )}
    >
      {item.title}
    </Link>
  );
}
