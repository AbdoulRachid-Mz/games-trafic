import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Book, Shield, Database } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Documentation
        </h1>
        <p className="text-xl text-muted-foreground">
          Welcome to the Games Trafic documentation.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/docs/legal/privacy"
          className="group relative rounded-lg border p-6 hover:bg-accent transition-colors"
        >
          <div className="flex flex-col gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h3 className="font-semibold leading-none tracking-tight">
              Privacy Policy
            </h3>
            <p className="text-sm text-muted-foreground">
              Learn how we handle your data.
            </p>
          </div>
        </Link>
        <Link
          href="/docs/legal/terms"
          className="group relative rounded-lg border p-6 hover:bg-accent transition-colors"
        >
          <div className="flex flex-col gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h3 className="font-semibold leading-none tracking-tight">
              Terms of Service
            </h3>
            <p className="text-sm text-muted-foreground">
              Read our terms and conditions.
            </p>
          </div>
        </Link>
        <Link
          href="/docs/guides"
          className="group relative rounded-lg border p-6 hover:bg-accent transition-colors"
        >
          <div className="flex flex-col gap-2">
            <Book className="h-8 w-8 text-primary" />
            <h3 className="font-semibold leading-none tracking-tight">
              Guides
            </h3>
            <p className="text-sm text-muted-foreground">
              Step-by-step tutorials and guides.
            </p>
          </div>
        </Link>
        <Link
          href="/docs/schema"
          className="group relative rounded-lg border p-6 hover:bg-accent transition-colors"
        >
          <div className="flex flex-col gap-2">
            <Database className="h-8 w-8 text-primary" />
            <h3 className="font-semibold leading-none tracking-tight">
              Schema
            </h3>
            <p className="text-sm text-muted-foreground">
              Explore the database schema.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
