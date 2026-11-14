import { getDocBySlug, getAllDocs } from "@/lib/docs";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/docs/mdx-components";
import { ChevronRight, ChevronLeft, Home, Clock } from "lucide-react";
import Link from "next/link";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { cn } from "@/lib/utils";
import React from "react";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export async function generateStaticParams() {
  const docs = await getAllDocs();
  return docs.map((doc) => ({
    slug: doc.slug.split("/"),
  }));
}

function estimateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = await getDocBySlug(slug);

  if (!doc) {
    notFound();
  }

  const allDocs = await getAllDocs();
  const currentIndex = allDocs.findIndex((d) => d.slug === doc.meta.slug);
  const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;
  const readingTime = estimateReadingTime(doc.content);

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 sm:px-4 md:px-6">
      {/* Breadcrumbs Modernisés */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap pb-1 scrollbar-hide">
        <Link href="/docs" className="hover:text-foreground transition-colors flex items-center gap-1 font-bold">
          <Home className="w-3.5 h-3.5" />
          Docs
        </Link>
        {slug.map((segment, index) => (
          <React.Fragment key={segment}>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/40" />
            <span className={cn(
              "capitalize",
              index === slug.length - 1 ? "text-primary font-bold" : "hover:text-foreground transition-colors"
            )}>
              {segment.replace(/-/g, " ")}
            </span>
          </React.Fragment>
        ))}
      </nav>

      {/* Header Document Pro */}
      <header className="space-y-4 pb-8 mb-8 border-b border-border/50 text-start">
        <div className="flex flex-wrap items-center gap-2">
          {doc.meta.category && (
            <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
              {doc.meta.category}
            </Badge>
          )}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>~{readingTime} min de lecture</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground leading-tight">
          {doc.meta.title}
        </h1>

        {doc.meta.description && (
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-normal">
            {doc.meta.description}
          </p>
        )}
      </header>

      {/* Article Content Rendered via MDX */}
      <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight prose-headings:uppercase prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
        <MDXRemote 
          source={doc.content} 
          components={mdxComponents}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeSlug],
            }
          }}
        />
      </article>

      {/* Pagination Précédent / Suivant Premium */}
      <div className="mt-16 pt-8 border-t border-border/50 flex flex-col sm:flex-row gap-4 justify-between">
        {prevDoc ? (
          <Link 
            href={`/docs/${prevDoc.slug}`}
            className="group flex flex-col gap-1.5 p-4 rounded-2xl border border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all w-full sm:w-auto sm:max-w-[48%] text-left"
          >
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
              Article Précédent
            </span>
            <span className="text-sm font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {prevDoc.title}
            </span>
          </Link>
        ) : <div />}

        {nextDoc ? (
          <Link 
            href={`/docs/${nextDoc.slug}`}
            className="group flex flex-col gap-1.5 p-4 rounded-2xl border border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all text-right w-full sm:w-auto sm:max-w-[48%] sm:ml-auto"
          >
            <span className="flex items-center gap-1.5 justify-end text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Article Suivant
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </span>
            <span className="text-sm font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {nextDoc.title}
            </span>
          </Link>
        ) : <div />}
      </div>
    </div>
  );
}
