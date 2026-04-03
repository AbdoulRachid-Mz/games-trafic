// app/not-found.tsx

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

function NotFoundContent() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center p-4 text-center">
      <Empty className="border-0 p-0">
        <EmptyHeader>
          <div className="text-9xl font-extrabold tracking-tight text-primary/20">404</div>
          <EmptyTitle className="text-3xl">Page non trouvée</EmptyTitle>
          <EmptyDescription className="max-w-[400px] mx-auto">
            Désolé, nous n'avons pas pu trouver la page que vous recherchez. Elle a peut-être été déplacée ou supprimée.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex items-center gap-4 flex-col md:flex-row">
          <Button asChild size="lg">
            <Link href="/">Retour à l'accueil</Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/contact">Contacter le support</Link>
          </Button>
        </EmptyContent>
      </Empty>
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

// import Link from 'next/link'

// export default function NotFound() {
//   return (
//     <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
//       <div className="text-center">
//         <h1 className="text-6xl font-bold tracking-tight text-primary">
//           404
//         </h1>
//         <h2 className="mt-4 text-2xl font-semibold text-foreground">
//           Page non trouvée
//         </h2>
//         <p className="mt-2 text-muted-foreground">
//           La page que vous recherchez n'existe pas ou a été déplacée.
//         </p>
//         <div className="mt-6 flex justify-center gap-3">
//           <Link href="/" className="btn">
//             Retour à l'accueil
//           </Link>
//           <Link href="/contact" className="btn btn-outline">
//             Contacter le support
//           </Link>
//         </div>
//       </div>
//     </div>
//   )
// }