// @/docs/guides/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Book, 
  Calendar, 
  Eye, 
  Search, 
  Filter, 
  X,
  ChevronRight,
  Sparkles,
  MessageSquare,
  HelpCircle,
  ArrowRight,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useInfiniteGuides } from "@/hooks/use-guides";
// import { GuideAssistant } from "@/components/docs/guide-assistant";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { GuideAssistant } from "@/components/pages/docs/docs/guide-assistant";

const categories = [
  { value: "all", label: "Tous les guides" },
  { value: "débutant", label: "Débutant", color: "bg-green-500/10 text-green-600" },
  { value: "transaction", label: "Transactions", color: "bg-blue-500/10 text-blue-600" },
  { value: "tournoi", label: "Tournois", color: "bg-purple-500/10 text-purple-600" },
  { value: "boutique", label: "Boutique", color: "bg-orange-500/10 text-orange-600" },
  { value: "vip", label: "VIP", color: "bg-amber-500/10 text-amber-600" },
  { value: "profil", label: "Profil", color: "bg-pink-500/10 text-pink-600" },
];

export default function GuidesPage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState("");
  const [showAssistant, setShowAssistant] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<any>(null);
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteGuides({
    category: category !== "all" ? category : undefined,
    title: search || undefined,
  });

  const guides = data?.pages.flatMap((page) => page.data) || [];

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setCategory(categoryParam);
    }
  }, [searchParams]);

  const handleAssistantOpen = (guide: any) => {
    setSelectedGuide(guide);
    setShowAssistant(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <Badge variant="secondary" className="mb-2">
              <Book className="h-3 w-3 mr-1" />
              Guides & Tutoriels
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Apprenez à maîtriser Games Trafic
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Des tutoriels étape par étape pour vous guider dans l'utilisation de la plateforme
            </p>
          </div>
          <Button 
            variant="outline" 
            className="gap-2 border-primary/20 hover:border-primary"
            onClick={() => setShowAssistant(true)}
          >
            <MessageSquare className="h-4 w-4" />
            Assistant virtuel
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un guide..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 bg-background"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearch("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2 h-11">
              <Filter className="h-4 w-4" />
              Catégories
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>Filtrer par catégorie</SheetTitle>
              <SheetDescription>
                Sélectionnez une catégorie pour affiner les résultats
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => {
                    setCategory(cat.value);
                    setSearch("");
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left",
                    category === cat.value
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted"
                  )}
                >
                  <span>{cat.label}</span>
                  {category === cat.value && (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Category Chips */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              category === cat.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Guides Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-6 w-3/4 bg-muted rounded mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-2/3 bg-muted rounded mt-2" />
                <div className="flex gap-4 mt-4">
                  <div className="h-3 w-16 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : guides.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Book className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Aucun guide trouvé</h3>
          <p className="text-muted-foreground">
            Essayez de modifier vos critères de recherche
          </p>
          <Button
            variant="link"
            onClick={() => {
              setCategory("all");
              setSearch("");
            }}
            className="mt-4"
          >
            Réinitialiser les filtres
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide, index) => (
              <motion.div
                key={guide.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className={cn(
                        "capitalize",
                        categories.find(c => c.value === guide.category)?.color
                      )}>
                        {guide.category}
                      </Badge>
                      {guide.images && guide.images.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Avec images
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="mt-3 line-clamp-2 group-hover:text-primary transition-colors">
                      {guide.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {guide.description || "Découvrez ce guide pour apprendre étape par étape."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{guide.viewCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {guide.createdAt
                              ? formatDistanceToNow(new Date(guide.createdAt), { 
                                  addSuffix: true, 
                                  locale: fr 
                                })
                              : "Date inconnue"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.preventDefault();
                            handleAssistantOpen(guide);
                          }}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Aide
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          asChild
                        >
                          <Link href={`/docs/guides/${guide.id}`}>
                            Lire
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Load More */}
          {hasNextPage && (
            <div className="flex justify-center pt-8">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="gap-2"
              >
                {isFetchingNextPage ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Chargement...
                  </>
                ) : (
                  <>
                    Voir plus de guides
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Guide Assistant Modal */}
      <GuideAssistant
        open={showAssistant}
        onOpenChange={setShowAssistant}
        guide={selectedGuide}
      />
    </div>
  );
}