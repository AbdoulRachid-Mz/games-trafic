import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Info, AlertCircle, CheckCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const Callout = ({ children, type = "info", title }: { children: React.ReactNode; type?: "info" | "warning" | "success" | "tip"; title?: string }) => {
  const icons = {
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    tip: <Lightbulb className="w-5 h-5 text-indigo-500" />,
  };

  const styles = {
    info: "bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/30",
    warning: "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30",
    success: "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30",
    tip: "bg-indigo-50/50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900/30",
  };

  return (
    <div className={cn("my-6 p-4 rounded-xl border flex gap-3", styles[type])}>
      <div className="mt-0.5">{icons[type]}</div>
      <div className="flex-1">
        {title && <div className="font-semibold mb-1 text-sm uppercase tracking-wider opacity-80">{title}</div>}
        <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  );
};

const BeautifulMention = ({ children }: { children: string }) => {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium text-sm border border-primary/20 cursor-default hover:bg-primary/20 transition-colors">
      {children}
    </span>
  );
};

const Steps = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="steps-container ml-4 border-l-2 border-muted pl-8 py-2 my-8 space-y-8">
      {children}
    </div>
  );
};

const Step = ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <div className="relative">
      <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-background border-2 border-primary flex items-center justify-center text-[10px] font-bold text-primary shadow-sm">
        {/* Step icon or number can go here */}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
};

export const mdxComponents = {
  h1: (props: any) => <h1 className="text-3xl font-bold mt-12 mb-6 tracking-tight" {...props} />,
  h2: (props: any) => <h2 className="text-2xl font-bold mt-10 mb-4 border-b pb-2 tracking-tight" {...props} />,
  h3: (props: any) => <h3 className="text-xl font-bold mt-8 mb-3 tracking-tight" {...props} />,
  p: (props: any) => <p className="leading-7 mb-4 text-muted-foreground" {...props} />,
  ul: (props: any) => <ul className="list-disc ml-6 mb-4 space-y-2 text-muted-foreground" {...props} />,
  ol: (props: any) => <ol className="list-decimal ml-6 mb-4 space-y-2 text-muted-foreground" {...props} />,
  li: (props: any) => <li {...props} />,
  code: (props: any) => (
    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground" {...props} />
  ),
  pre: (props: any) => (
    <pre className="bg-muted/50 p-4 rounded-xl border overflow-x-auto my-6 font-mono text-sm leading-relaxed" {...props} />
  ),
  a: (props: any) => (
    <Link className="text-primary hover:underline font-medium decoration-primary/30 underline-offset-4" {...props} />
  ),
  img: (props: any) => (
    <div className="my-8 rounded-2xl overflow-hidden border shadow-lg bg-muted/30">
      <Image 
        width={1200}
        height={675}
        className="w-full h-auto object-cover" 
        {...props} 
        alt={props.alt || "Docs illustration"} 
      />
      {props.alt && (
        <div className="px-4 py-2 text-center text-xs text-muted-foreground italic border-t bg-background/50">
          {props.alt}
        </div>
      )}
    </div>
  ),
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-primary/30 pl-4 py-2 my-6 italic text-muted-foreground bg-primary/5 rounded-r-lg" {...props} />
  ),
  Callout,
  beautifulMention: BeautifulMention,
  Steps,
  Step,
};
