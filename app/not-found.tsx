// app/not-found.tsx

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold tracking-tight text-primary">
          404
        </h1>
        <h2 className="mt-4 text-2xl font-semibold text-foreground">
          Page non trouvée
        </h2>
        <p className="mt-2 text-muted-foreground">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="btn">
            Retour à l'accueil
          </Link>
          <Link href="/contact" className="btn btn-outline">
            Contacter le support
          </Link>
        </div>
      </div>
    </div>
  )
}