// lib/api-handler.ts - Unified facade delegating to canonical lib/api/handler.ts
import { APIHandler } from '@/lib/api/handler';

export { APIHandler, APIHandler as ApiHandler } from '@/lib/api/handler';
export type { HandlerConfig, HandlerContext } from '@/lib/api/handler';

/**
 * @deprecated Use APIHandler.create from '@/lib/api/handler' instead.
 */
export default APIHandler;
