// app/admin/claims/create/page.tsx

import { Suspense } from "react";
import ClientCreateClaimPage from "./client-page"

export default function CreateClaimPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientCreateClaimPage />
    </Suspense>
  );
}