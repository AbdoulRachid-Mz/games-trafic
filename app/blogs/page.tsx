import { getBlogs } from "@/actions/blogs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import Image from "next/image";

export default async function BlogsPage() {
  const result = await getBlogs({
    pagination: { page: 1, limit: 12 },
    filters: {},
    options: { includeDeleted: false, includeInactive: false },
  });

  const blogs = result.data;

  // Featured blog (first one)
  const featuredBlog = blogs[0];
  const otherBlogs = blogs.slice(1);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-background py-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Typography
              variant="h1"
              weight="bold"
              className="mb-6 text-5xl lg:text-6xl"
            >
              Notre Blog
            </Typography>
            <Typography variant="lead" theme="muted" className="text-xl">
              Découvrez nos derniers articles, actualités et guides
            </Typography>
          </div>
        </div>
      </section>

      {/* Featured Article */}
      {featuredBlog && (
        <section className="container mx-auto px-4 py-16">
          <Typography variant="h2" weight="bold" className="mb-8">
            Article à la Une
          </Typography>

          <Link href={`/blogs/${featuredBlog.id}`}>
            <Card className="group overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/25">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Image */}
                {featuredBlog.images && featuredBlog.images[0] && (
                  <div className="relative aspect-video lg:aspect-auto">
                    <Image
                      src={featuredBlog.images[0]}
                      alt={featuredBlog.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}

                {/* Content */}
                <CardContent className="p-8 flex flex-col justify-center">
                  <Badge className="w-fit mb-4">À la une</Badge>

                  <Typography
                    variant="h2"
                    weight="bold"
                    className="mb-4 group-hover:text-primary transition-colors"
                  >
                    {featuredBlog.title}
                  </Typography>

                  <Typography
                    variant="body-base"
                    theme="muted"
                    className="mb-6 line-clamp-3"
                  >
                    {featuredBlog.content
                      .replace(/<[^>]*>/g, "")
                      .substring(0, 200)}
                    ...
                  </Typography>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(featuredBlog.createdAt ?? '')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />5 min de lecture
                    </div>
                  </div>

                  <Button className="mt-6 w-fit group-hover:gap-3 transition-all">
                    Lire l'article
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </div>
            </Card>
          </Link>
        </section>
      )}

      {/* Articles Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-8">
          <Typography variant="h2" weight="bold">
            Derniers Articles
          </Typography>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {otherBlogs.map((blog) => (
            <Link key={blog.id} href={`/blogs/${blog.id}`}>
              <Card className="group h-full overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-1">
                {/* Image */}
                {blog.images && blog.images[0] && (
                  <div className="relative aspect-video overflow-hidden">
                    <Image
                      src={blog.images[0]}
                      alt={blog.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                )}

                <CardContent className="p-6 space-y-4">
                  {/* Title */}
                  <Typography
                    variant="h4"
                    weight="bold"
                    className="group-hover:text-primary transition-colors line-clamp-2"
                  >
                    {blog.title}
                  </Typography>

                  {/* Excerpt */}
                  <Typography
                    variant="body-sm"
                    theme="muted"
                    className="line-clamp-3"
                  >
                    {blog.content.replace(/<[^>]*>/g, "").substring(0, 150)}...
                  </Typography>

                  {/* Meta */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(blog.createdAt ?? '')}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />5 min
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Pagination placeholder */}
        {result.pagination.totalPages > 1 && (
          <div className="flex justify-center mt-12">
            <Button variant="outline">Voir plus d'articles</Button>
          </div>
        )}
      </section>

      {/* Newsletter CTA */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <Typography variant="h2" weight="bold" className="mb-4">
            Restez informé
          </Typography>
          <Typography
            variant="lead"
            theme="muted"
            className="mb-8 max-w-2xl mx-auto"
          >
            Inscrivez-vous à notre newsletter pour recevoir nos derniers
            articles directement dans votre boîte mail
          </Typography>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Votre email"
              className="flex-1 px-4 py-3 rounded-lg border-2 border-border focus:border-primary outline-none transition-colors"
            />
            <Button size="lg">S'abonner</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
