import { Typography } from "@/components/ui/typography";
import { Button } from "@base-ui/react";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export default function UnauthorizedPage({ searchParams }: PageProps) {
  const redirectTo = Array.isArray(searchParams.redirectTo)
    ? searchParams.redirectTo[0]
    : searchParams.redirectTo ?? "/";
    const msg = searchParams.msg ?? "Vous n'avez pas la permission d'accéder à cette page.";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        {/* en: Non autorisé à accéder à cette page */}
      <Typography variant="h1">Non autorisé à accéder à cette page</Typography>
      <Typography variant="body-base">
        {msg}
      </Typography>
      <Button onClick={() => redirect(redirectTo)}>Retourner</Button>
    </div>
  );
}
