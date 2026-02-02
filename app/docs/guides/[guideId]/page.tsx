import {
  getGuideById,
  getGuideSteps,
  incrementGuideViewCount,
} from "@/actions/guides";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Eye, User, ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

interface GuidePageProps {
  params: Promise<{
    guideId: string;
  }>;
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { guideId } = await params;
  const guide = await getGuideById(guideId);

  if (!guide) {
    notFound();
  }

  // Increment view count (fire and forget)
  incrementGuideViewCount(guideId);

  const { data: steps } = await getGuideSteps(guideId);

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge>{guide.category}</Badge>
          {/* {guide.isPro && <Badge variant="secondary">PRO</Badge>} */}
        </div>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          {guide.title}
        </h1>
        {/* <p className="text-xl text-muted-foreground">{guide.description}</p> */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          {/* <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{guide.authorName || "Admin"}</span>
          </div> */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {guide.createdAt
                ? format(new Date(guide.createdAt), "MMMM d, yyyy")
                : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>{guide.viewCount} views</span>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-8">
        {steps?.map((step, index) => (
          <div
            key={step.id}
            className="relative pl-8 border-l-2 border-muted pb-8 last:pb-0"
          >
            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-background border-2 border-primary" />
            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                <span className="text-primary mr-2">
                  {(step.order || 0) + 1}.
                </span>
                {step.title}
              </h2>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                {step.content}
              </div>

              {/* Affichage des images si nécessaire - à adapter selon votre structure de données */}
              {step.images &&
                step.images.length > 0 &&
                step.images.map((image, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4">
                    <Image
                      src={image}
                      alt={step.title}
                      className="rounded-lg border shadow-sm"
                    />
                  </div>
                ))}
            </div>
          </div>
        ))}
        {(!steps || steps.length === 0) && (
          <p className="text-muted-foreground italic">
            No steps found for this guide.
          </p>
        )}
      </div>
    </div>
  );
}
