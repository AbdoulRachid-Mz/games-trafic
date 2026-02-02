import { getGuides } from "@/actions/guides";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, Eye, User } from "lucide-react";
import { format } from "date-fns";

export default async function GuidesPage() {
  const { data: guides } = await getGuides({
    pagination: { page: 1, limit: 50 },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Guides
        </h1>
        <p className="text-xl text-muted-foreground">
          Explore our latest guides and tutorials.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {guides?.map((guide) => (
          <Link key={guide.id} href={`/docs/guides/${guide.id}`}>
            <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <Badge variant="secondary">{guide.category}</Badge>
                  {/* {guide.isPro && <Badge variant="default">PRO</Badge>} */}
                </div>
                <CardTitle className="line-clamp-2 mt-2">
                  {guide.title}
                </CardTitle>
                {/* <CardDescription className="line-clamp-3">
                  {guide.description}
                </CardDescription> */}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto">
                  {/* <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{guide.authorName || "Admin"}</span>
                  </div> */}
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{guide.viewCount}</span>
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {guide.createdAt
                        ? format(new Date(guide.createdAt), "MMM d, yyyy")
                        : ""}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {(!guides || guides.length === 0) && (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            No guides available at the moment.
          </div>
        )}
      </div>
    </div>
  );
}
