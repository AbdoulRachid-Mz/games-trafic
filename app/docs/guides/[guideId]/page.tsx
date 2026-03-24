// @/docs/guides/[guideId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  BookOpen,
  CheckCircle,
  Circle,
  Clock,
  ArrowLeft,
  Share2,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useGuideById, useGuideSteps, useIncrementGuideView } from "@/hooks/use-guides";
// import { GuideAssistant } from "@/components/docs/guide-assistant";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { GuideAssistant } from "@/components/pages/docs/docs/guide-assistant";
import { ImageViewer } from "@/components/shared/image-viewer";
import Image from "next/image";

export default function GuidePage() {
  const params = useParams();
  const router = useRouter();
  const guideId = params.guideId as string;

  const { data: guide, isLoading: guideLoading } = useGuideById(guideId, { populate: ["steps"] });
  const { data: stepsData, isLoading: stepsLoading } = useGuideSteps(guideId);
  const incrementView = useIncrementGuideView();
  const [showAssistant, setShowAssistant] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps = stepsData?.data || guide?.steps || [];

  useEffect(() => {
    if (guide) {
      incrementView.mutate(guideId);
    }
  }, [guide]);

  const toggleStepComplete = (index: number) => {
    setCompletedSteps((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const progress = steps.length > 0 ? (completedSteps.length / steps.length) * 100 : 0;

  if (guideLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Guide non trouvé</h2>
        <p className="text-muted-foreground mb-4">
          Le guide que vous recherchez n'existe pas ou a été supprimé.
        </p>
        <Button asChild>
          <Link href="/docs/guides">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux guides
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/docs" className="hover:text-foreground">Docs</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/docs/guides" className="hover:text-foreground">Guides</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium line-clamp-1">{guide.title}</span>
      </div>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {guide.category}
          </Badge>
          {steps.length > 0 && (
            <Badge variant="outline" className="gap-1">
              <BookOpen className="h-3 w-3" />
              {steps.length} étapes
            </Badge>
          )}
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          {guide.title}
        </h1>
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {guide.createdAt ? format(new Date(guide.createdAt), "dd MMMM yyyy", { locale: fr }) : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>{guide.viewCount} vues</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>
              Mis à jour {guide.updatedAt ? formatDistanceToNow(new Date(guide.updatedAt), { addSuffix: true, locale: fr }) : "—"}
            </span>
          </div>
        </div>
        {guide.description && (
          <p className="text-lg text-muted-foreground border-l-4 border-primary pl-4 py-2 bg-muted/30 rounded-r-lg">
            {guide.description}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      {steps.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progression</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </div>
      )}

      <Separator />

      {/* Steps */}
      {steps.length > 0 ? (
        <div className="space-y-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "relative pl-8 pb-6 last:pb-0",
                index !== steps.length - 1 && "border-l-2 border-muted"
              )}
            >
              {/* Step Number */}
              <div className="absolute -left-[9px] top-0">
                <button
                  onClick={() => toggleStepComplete(index)}
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    completedSteps.includes(index)
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-muted-foreground/30 hover:border-primary"
                  )}
                >
                  {completedSteps.includes(index) && (
                    <CheckCircle className="h-3 w-3" />
                  )}
                </button>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <span className="text-primary">Étape {index + 1}.</span>
                  {step.title}
                </h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  {step.content.split("\n").map((paragraph, i) => (
                    <p key={i} className="mb-2">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {step.images && step.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 mt-4 relative">
                    {step.images.map((image, i) => (
                      <ImageViewer
                        key={i}
                        images={step.images || []}
                        initialIndex={i}
                        trigger={
                          <Image
                            src={image}
                            alt={`Étape ${index + 1} - ${step.title}`}
                            fill
                            className="rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer w-full h-full object-cover"
                          />
                        }
                        className="w-full h-full"
                      />
                    ))})
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune étape pour ce guide</h3>
          <p className="text-muted-foreground">
            Ce guide sera bientôt détaillé avec des instructions étape par étape.
          </p>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 pt-4">
        <Button variant="outline" className="gap-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <Button variant="outline" className="gap-2">
          <Share2 className="h-4 w-4" />
          Partager
        </Button>
        <Button className="gap-2" onClick={() => setShowAssistant(true)}>
          <MessageSquare className="h-4 w-4" />
          Assistance
        </Button>
      </div>

      {/* Assistant Modal */}
      <GuideAssistant
        open={showAssistant}
        onOpenChange={setShowAssistant}
        guide={guide}
      />
    </div>
  );
}