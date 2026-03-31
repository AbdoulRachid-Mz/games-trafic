// 404 Not Found Page

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <h1 className="text-3xl font-bold">404 - Page introuvable</h1>
    </div>
  );
}


// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import { Suspense } from "react";
// import {
//   Empty,
//   EmptyHeader,
//   EmptyTitle,
//   EmptyDescription,
//   EmptyContent,
// } from "@/components/ui/empty";

// function NotFoundContent() {
//   return (
//     <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center p-4 text-center">
//       <Empty className="border-0 p-0">
//         <EmptyHeader>
//           <div className="text-9xl font-extrabold tracking-tight text-primary/20">404</div>
//           <EmptyTitle className="text-3xl">Page non trouvée</EmptyTitle>
//           <EmptyDescription className="max-w-[400px] mx-auto">
//             Désolé, nous n'avons pas pu trouver la page que vous recherchez. Elle a peut-être été déplacée ou supprimée.
//           </EmptyDescription>
//         </EmptyHeader>
//         <EmptyContent>
//           <Button asChild size="lg">
//             <Link href="/">Retour à l'accueil</Link>
//           </Button>
//         </EmptyContent>
//       </Empty>
//     </div>
//   );
// }

// export default function NotFound() {
//   return (
//     <Suspense fallback={null}>
//       <NotFoundContent />
//     </Suspense>
//   );
// }