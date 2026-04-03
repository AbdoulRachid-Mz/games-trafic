import { getDocBySlug, getAllDocs } from "@/lib/docs";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/docs/mdx-components";
import { Typography } from "@/components/ui/typography";
import { ChevronRight, ChevronLeft, Home } from "lucide-react";
import Link from "next/link";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { cn } from "@/lib/utils";

interface PageProps {
  params: {
    slug: string[];
  };
}

export async function generateStaticParams() {
  const docs = await getAllDocs();
  return docs.map((doc) => ({
    slug: doc.slug.split("/"),
  }));
}

export default async function DocPage({ params }: PageProps) {
  const doc = await getDocBySlug(params.slug);

  if (!doc) {
    notFound();
  }

  const allDocs = await getAllDocs();
  const currentIndex = allDocs.findIndex((d) => d.slug === doc.meta.slug);
  const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 md:px-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
        <Link href="/docs" className="hover:text-foreground transition-colors flex items-center gap-1">
          <Home className="w-4 h-4" />
          Docs
        </Link>
        {params.slug.map((segment, index) => (
          <React.Fragment key={segment}>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
            <span className={cn(
              "capitalize",
              index === params.slug.length - 1 ? "text-foreground font-medium" : "hover:text-foreground transition-colors"
            )}>
              {segment.replace(/-/g, " ")}
            </span>
          </React.Fragment>
        ))}
      </nav>

      <article className="prose prose-slate dark:prose-invert max-w-none">
        <Typography variant="h1" className="mb-2 tracking-tight underline-offset-8">
          {doc.meta.title}
        </Typography>
        {doc.meta.description && (
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
            {doc.meta.description}
          </p>
        )}

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

      {/* Pagination */}
      <div className="mt-16 pt-8 border-t flex flex-col sm:flex-row gap-4 justify-between">
        {prevDoc ? (
          <Link 
            href={`/docs/${prevDoc.slug}`}
            className="group flex flex-col gap-2 p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all w-full sm:w-auto sm:max-w-[45%]"
          >
            <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <ChevronLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
              Précédent
            </span>
            <span className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">
              {prevDoc.title}
            </span>
          </Link>
        ) : <div />}

        {nextDoc ? (
          <Link 
            href={`/docs/${nextDoc.slug}`}
            className="group flex flex-col gap-2 p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all text-right w-full sm:w-auto sm:max-w-[45%]"
          >
            <span className="flex items-center gap-2 justify-end text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Suivant
              <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </span>
            <span className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">
              {nextDoc.title}
            </span>
          </Link>
        ) : <div />}
      </div>
    </div>
  );
}

import React from "react";
