"use client";

import { Typography } from "@/components/ui/typography";
import { Button } from "@base-ui/react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

type PageProps = {
    searchParams: { [key: string]: string | string[] | undefined };
};

function UnauthorizedContent({ searchParams }: PageProps) {
    const router = useRouter();
    const redirectTo = Array.isArray(searchParams.redirectTo)
        ? searchParams.redirectTo[0]
        : (searchParams.redirectTo ?? "/");
    const msg =
        searchParams.msg ?? "Vous n'avez pas la permission d'accéder à cette page.";

    const handleReturn = () => {
        router.push(redirectTo);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            {/* en: Non autorisé à accéder à cette page */}
            <Typography variant="h1">
                Non autorisé à accéder à cette page
            </Typography>
            <Typography variant="body-base">{msg}</Typography>
            <Button onClick={handleReturn}>Retourner</Button>
        </div>
    );
}

export default function UnauthorizedPage({ searchParams }: PageProps) {
    return (
        <Suspense fallback={<Loading />}>
            <UnauthorizedContent searchParams={searchParams} />
        </Suspense>
    );
}

const Loading = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <Typography variant="h1">Loading...</Typography>
        </div>
    );
};
