"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { 
  Search, 
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  BookOpen,
  Sparkles,
  HelpCircle,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/use-debounce";

export interface NavItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string;
  children?: NavItem[];
}

interface DocsSidebarProps {
  navItems: NavItem[];
  children?: React.ReactNode;
}

export function DocsSidebar({ navItems, children }: DocsSidebarProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 200);

  // Filtrage réactif de la navigation
  const searchResults = useMemo(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) return [];
    const query = debouncedSearch.toLowerCase();
    const results: NavItem[] = [];

    const traverse = (items: NavItem[]) => {
      for (const item of items) {
        if (item.title.toLowerCase().includes(query)) {
          results.push(item);
        }
        if (item.children) {
          traverse(item.children);
        }
      }
    };

    traverse(navItems);
    return results;
  }, [debouncedSearch, navItems]);

  return (
    <>
      {/* Top Header Docs Premium */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between gap-4 px-4 sm:px-6 max-w-7xl mx-auto">
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-xl h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu de navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <Link href="/docs" className="flex items-center gap-2.5 group">
              <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
                <Image
                  src="/icons/gt-primary.png"
                  alt="Games-Trafics Logo"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-black uppercase tracking-tight text-base sm:text-lg bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                  Games-Trafics
                </span>
                <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 rounded-md border-primary/30 text-primary bg-primary/5 uppercase tracking-wider">
                  Docs
                </Badge>
              </div>
            </Link>
          </div>

          {/* Quick Search Bar */}
          <div className="flex-1 max-w-md mx-auto hidden md:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                placeholder="Rechercher une fonctionnalité, règle, guide..."
                className="pl-10 pr-16 bg-muted/30 border-border/50 focus:border-primary/50 focus:bg-background transition-all rounded-xl h-10 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border/60 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  Docs
                </kbd>
              </div>

              {/* Résultats de recherche flottants */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-popover/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl overflow-hidden z-50 p-2 space-y-1 max-h-[380px] overflow-y-auto"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                      {searchResults.length} résultat{searchResults.length > 1 ? "s" : ""} trouvé{searchResults.length > 1 ? "s" : ""}
                    </div>
                    {searchResults.slice(0, 8).map((result) => (
                      <Link
                        key={result.href}
                        href={result.href}
                        onClick={() => setSearchQuery("")}
                        className="flex items-center justify-between px-3.5 py-2.5 hover:bg-primary/10 hover:text-primary rounded-xl transition-colors text-xs font-semibold group"
                      >
                        <div className="flex items-center gap-2.5">
                          <BookOpen className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                          <span>{result.title}</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Quick Actions Links */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex rounded-xl text-xs font-bold gap-1.5 h-9">
              <Link href="/docs/guides">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Guides CMS
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex rounded-xl text-xs font-bold gap-1.5 h-9">
              <Link href="/signals">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Signaler un bug
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-bold gap-1.5 h-9 border-border/60">
              <Link href="/">
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Accueil</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Layout Wrapper : Sidebar Desktop + Contenu */}
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex-1 items-start lg:grid lg:grid-cols-[260px_minmax(0,1fr)] gap-8">
          {/* Desktop Sticky Sidebar */}
          <aside className="fixed top-16 z-30 -ml-2 hidden h-[calc(100vh-4rem)] w-full shrink-0 lg:sticky lg:block">
            <ScrollArea className="h-full py-6 pr-4">
              <nav className="space-y-6">
                {navItems.map((group) => (
                  <div key={group.title} className="space-y-1.5">
                    <h4 className="px-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground/70">
                      {group.title}
                    </h4>
                    <div className="space-y-0.5">
                      {group.children?.map((item) => (
                        <NavItemComp key={item.href} item={item} pathname={pathname} />
                      ))}
                      {!group.children && <NavItemComp item={group} pathname={pathname} />}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Mini Card d'aide dans la sidebar */}
              <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  <span>Besoin d'aide ?</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Notre équipe de support est à votre disposition pour vous assister.
                </p>
                <Button size="sm" variant="outline" asChild className="w-full rounded-xl text-[11px] h-8 font-bold border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground">
                  <Link href="/support">Contacter le support</Link>
                </Button>
              </div>
            </ScrollArea>
          </aside>

          {/* Mobile Drawer Sidebar */}
          <AnimatePresence>
            {sidebarOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-background/80 backdrop-blur-md z-[60] lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
                <motion.aside
                  initial={{ x: -300 }}
                  animate={{ x: 0 }}
                  exit={{ x: -300 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="fixed top-0 left-0 bottom-0 w-[300px] bg-card border-r border-border/60 z-[70] lg:hidden shadow-2xl flex flex-col"
                >
                  <div className="flex items-center justify-between p-4 border-b border-border/40">
                    <div className="flex items-center gap-2">
                      <Image
                        src="/icons/gt-primary.png"
                        alt="Games-Trafics"
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                      <span className="font-black text-sm uppercase tracking-tight">Navigation Docs</span>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => setSidebarOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="p-3 border-b border-border/40">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                      <Input
                        placeholder="Rechercher..."
                        className="pl-9 bg-muted/40 border-border/40 rounded-xl h-9 text-xs"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <ScrollArea className="flex-1 p-4">
                    <nav className="space-y-6 pb-6">
                      {navItems.map((group) => (
                        <div key={group.title} className="space-y-1.5">
                          <h4 className="px-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
                            {group.title}
                          </h4>
                          <div className="space-y-0.5">
                            {group.children?.map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                  "flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all font-medium",
                                  pathname === item.href
                                    ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                              >
                                <span>{item.title}</span>
                                {item.badge && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 rounded">
                                    {item.badge}
                                  </Badge>
                                )}
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

          {/* Main Content Slot */}
          <main className="min-w-0 w-full py-6">
            {children}
          </main>
        </div>
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
        "group flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all duration-200 font-medium",
        isActive
          ? "bg-primary/10 text-primary font-bold border-l-2 border-primary pl-2.5 shadow-sm"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground pl-3 hover:pl-3.5"
      )}
    >
      <span className="line-clamp-1">{item.title}</span>
      {item.badge ? (
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-md border-border/50 font-bold">
          {item.badge}
        </Badge>
      ) : (
        <ChevronRight className={cn(
          "h-3 w-3 transition-transform opacity-0 group-hover:opacity-100",
          isActive && "opacity-100 text-primary"
        )} />
      )}
    </Link>
  );
}
