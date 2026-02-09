import { getBlogById } from "@/actions/blogs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, User, ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import Image from "next/image";

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const {id} = await params
  const blog = await getBlogById(id, { populate: ["author"] });

  if (!blog || blog.isDeleted || !blog.isActive) {
    notFound();
  }

  // Calculate read time (rough estimate: 200 words per minute)
  const wordCount = blog.content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  const readTime = Math.ceil(wordCount / 200);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 to-background py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux articles
          </Link>

          <Typography
            variant="h1"
            weight="bold"
            className="mb-6 text-4xl lg:text-5xl"
          >
            {blog.title}
          </Typography>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
            {blog.author && (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={blog.author?.profileImage || ""} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{blog.author.username}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDate(blog.createdAt || new Date())}
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {readTime} min de lecture
            </div>

            <Button variant="ghost" size="sm" className="ml-auto">
              <Share2 className="h-4 w-4 mr-2" />
              Partager
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {blog.images && blog.images[0] && (
        <section className="container mx-auto px-4 max-w-5xl py-8">
          <div className="relative aspect-video rounded-xl overflow-hidden">
            <Image
              src={blog.images[0]}
              alt={blog.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </section>
      )}

      {/* Article Content */}
      <article className="container mx-auto px-4 max-w-4xl py-12">
        <div
          className="prose prose-lg max-w-none
            prose-headings:font-bold prose-headings:text-foreground
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground prose-strong:font-semibold
            prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-muted prose-pre:border prose-pre:border-border
            prose-img:rounded-lg prose-img:shadow-lg
            prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1
            prose-ul:text-muted-foreground prose-ol:text-muted-foreground
            prose-li:marker:text-primary"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </article>

      {/* Author Card */}
      {blog.author && (
        <section className="container mx-auto px-4 max-w-4xl py-12">
          <Card className="border-2">
            <CardContent className="p-8">
              <div className="flex items-start gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={blog.author.image || ""} />
                  <AvatarFallback className="text-2xl">
                    <User className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <Typography variant="h4" weight="bold" className="mb-2">
                    {blog.author.username}
                  </Typography>
                  <Typography variant="body-sm" theme="muted" className="mb-4">
                    Auteur
                  </Typography>
                  <Typography variant="body-base" theme="muted">
                    Passionné par le gaming et les nouvelles technologies, je
                    partage mes connaissances et mes découvertes à travers mes
                    articles.
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Share Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <Typography variant="h3" weight="bold" className="mb-4">
            Vous avez aimé cet article ?
          </Typography>
          <Typography variant="body-base" theme="muted" className="mb-8">
            Partagez-le avec vos amis et abonnez-vous pour ne rien manquer
          </Typography>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">
              <Share2 className="mr-2 h-4 w-4" />
              Partager l'article
            </Button>
            <Button size="lg" variant="outline">
              S'abonner au blog
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
