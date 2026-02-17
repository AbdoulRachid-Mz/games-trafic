import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OrderFilters, OrderStatus } from '@/types/api';
import { toast } from 'sonner';
import {
  createProductOrder,
  approveOrderShop,
  completeOrderAdmin,
  getOrders,
  getOrderStats,
  getOrderById,
  getOrdersByShopId} from '@/actions/orders';
const ORDERS_QUERY_KEY = 'orders';
const ORDER_STATS_QUERY_KEY = 'order-stats';

// ---------- QUERIES ----------
export function useOrders(filters?: OrderFilters) {
  return useQuery({
    queryKey: [ORDERS_QUERY_KEY, filters],
    queryFn: () => getOrders(filters),
    staleTime: 1000 * 60, // 1 min
  });
}

export function useOrderById(orderId: string) {
  return useQuery({
    queryKey: [ORDERS_QUERY_KEY, orderId],
    queryFn: () => getOrderById(orderId),
    enabled: !!orderId,
    staleTime: 1000 * 60,
  });
}

export function useOrdersByShopId(shopId: string, filters?: { status?: OrderStatus | OrderStatus[]; limit?: number; page?: number }) {
  return useQuery({
    queryKey: [ORDERS_QUERY_KEY, 'shop', shopId, filters],
    queryFn: () => getOrdersByShopId(shopId, filters),
    enabled: !!shopId,
    staleTime: 1000 * 60, // 1 min
  });
}


export function useOrderStats() {
  return useQuery({
    queryKey: [ORDER_STATS_QUERY_KEY],
    queryFn: getOrderStats,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

// ---------- MUTATIONS ----------
export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProductOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [ORDER_STATS_QUERY_KEY] });
      toast.success('Commande créée avec succès');
    },
    onError: (err: any) => toast.error(err.message || 'Erreur lors de la création'),
  });
}

export function useApproveOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, credentials }: { orderId: string; credentials: { login: string; pass: string } }) =>
      approveOrderShop(orderId, credentials),
    onSuccess: (_, { orderId }) => {
      qc.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY, orderId] });
      toast.success('Commande approuvée par la boutique');
    },
    onError: (err: any) => toast.error(err.message || 'Erreur lors de l’approbation'),
  });
}

export function useCompleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: completeOrderAdmin,
    onSuccess: (_, orderId) => {
      qc.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY, orderId] });
      qc.invalidateQueries({ queryKey: [ORDER_STATS_QUERY_KEY] });
      toast.success('Commande finalisée par l’admin');
    },
    onError: (err: any) => toast.error(err.message || 'Erreur lors de la finalisation'),
  });
}

//by shop


// export function useCancelOrder() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: cancelOrderAdmin,
//     onSuccess: (_, orderId) => {
//       qc.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] });
//       qc.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY, orderId] });
//       qc.invalidateQueries({ queryKey: [ORDER_STATS_QUERY_KEY] });
//       toast.success('Commande annulée');
//     },
//     onError: (err: any) => toast.error(err.message || 'Erreur lors de l’annulation'),
//   });
// }

// export function useDisputeOrder() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) => disputeOrder(orderId, reason),
//     onSuccess: (_, { orderId }) => {
//       qc.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] });
//       qc.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY, orderId] });
//       toast.success('Litige ouvert');
//     },
//     onError: (err: any) => toast.error(err.message || 'Erreur lors de l’ouverture du litige'),
//   });
// }

// export function useRefundOrder() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: refundOrder,
//     onSuccess: (_, orderId) => {
//       qc.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] });
//       qc.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY, orderId] });
//       qc.invalidateQueries({ queryKey: [ORDER_STATS_QUERY_KEY] });
//       toast.success('Remboursement effectué');
//     },
//     onError: (err: any) => toast.error(err.message || 'Erreur lors du remboursement'),
//   });
// }

// export function useDeliverOrder() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: deliverOrder,
//     onSuccess: (_, orderId) => {
//       qc.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] });
//       qc.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY, orderId] });
//       toast.success('Produit marqué comme livré');
//     },
//     onError: (err: any) => toast.error(err.message || 'Erreur lors de la livraison'),
//   });
// }
