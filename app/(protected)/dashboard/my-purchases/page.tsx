import { UserOrdersPage } from "@/components/pages/dashboard/user-orders-page";

/**
 * Ancienne route conservée pour compatibilité.
 * La page canonique est désormais /dashboard/orders.
 */
export default function MyPurchasesPage() {
  return <UserOrdersPage />;
}
