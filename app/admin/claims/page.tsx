// app/admin/claims/page.tsx

import { Suspense } from "react";
import ClientClaimsPage from "./client-page"

export default function ClaimsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientClaimsPage />
    </Suspense>
  );
}