import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Suspense } from "react";

function NotFoundContent() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center p-4 text-center">
      <div className="space-y-6">
        <Typography variant="h1" className="text-9xl font-extrabold tracking-tight text-primary/20">
          404
        </Typography>
        <div className="space-y-2">
          <Typography variant="h2" className="text-3xl font-bold tracking-tight">
            Page non trouvée
          </Typography>
          <Typography className="text-muted-foreground max-w-[400px] mx-auto">
            Désolé, nous n'avons pas pu trouver la page que vous recherchez. Elle a peut-être été déplacée ou supprimée.
          </Typography>
        </div>
        <div className="flex justify-center gap-4 pt-4">
          <Button asChild size="lg">
            <Link href="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={null}>
      <NotFoundContent />
    </Suspense>
  );
}