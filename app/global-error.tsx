// @/app/global-error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8 bg-card text-card-foreground shadow-lg rounded-lg max-w-md w-full border">
            <h2 className="text-2xl font-bold text-destructive mb-4">
              Oups, quelque chose s'est mal passé !
            </h2>
            <p className="text-muted-foreground mb-6">
              Une erreur inattendue s'est produite. Veuillez réessayer.
            </p>
            <button
              onClick={() => {
                reset();
                window.location.reload();
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition"
            >
              Réessayer
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
