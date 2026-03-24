// app/global-not-found.tsx
"use client"

// Import global styles and fonts
import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: '404 - Page Non Trouvée',
    description: 'La page que vous recherchez n\'existe pas.',
}

export default function GlobalNotFound() {
    const router = useRouter();
    return (
        <html lang="fr" className={inter.className}>
            <body>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold">404 - Page Non Trouvée</h1>
                        <p className="text-lg">La page que vous recherchez n'existe pas.</p>
                        <Button onClick={() => router.push("/")}>Retour à l'accueil</Button>
                    </div>
                </div>
            </body>
        </html>
    )
}