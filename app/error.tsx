// @/app/error.tsx
'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h2 className="text-2xl font-semibold">Quelque chose s’est mal passé !</h2>
        <p className="text-muted-foreground">
          Une erreur inattendue s’est produite. Veuillez réessayer.
        </p>
        <button
          onClick={
            // Attempt to recover by re-fetching and re-rendering the segment
            () => reset()
          }
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          Réessayer
        </button>
      </div>
    </div>
  )
}
