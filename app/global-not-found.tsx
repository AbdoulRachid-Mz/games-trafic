// app/global-not-found.tsx

import Link from "next/link";
import type { Metadata } from "next";
import { Inter, Roboto } from "next/font/google";

export const metadata: Metadata = {
  title: '404 - Page Non Trouvée',
  description: 'La page que vous recherchez n\'existe pas.',
}

const roboto = Roboto({ subsets: ['latin'] })


export default function GlobalNotFound() {
  return (
    <html lang="fr" className={roboto.className}>
      <body>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-bold">
              404 - Page Non Trouvée
            </h1>
            <p className="text-lg">
              La page que vous recherchez n'existe pas.
            </p>

            <Link
              href="/"
              className="mt-4 inline-block px-4 py-2 border rounded"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}