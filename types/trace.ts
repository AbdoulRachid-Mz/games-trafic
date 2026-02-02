// types/trace.ts
export type TraceType = 
  | 'SIGNIN'
  | 'SIGNOUT' 
  | 'REGISTER'
  | 'NAVIGATION'
  | 'PURCHASE'
  | 'TRANSFER'
  | 'DEPOSIT'
  | 'VIEW'
  | 'LIKE'
  | 'FOLLOW'
  | 'BOOKMARK'
  | 'CLAIM'
  | 'ERROR'
  | 'EXPLANATION_SHOWN'
  | 'EXPLANATION_COMPLETED'
  | 'EXPLANATION_SKIPPED'
  | 'UPDATE_SETTINGS'
  | 'OTHER'
  | 'ACTION'
  | 'REFRESH_DATA'
  | 'MARK_ANNOUNCEMENT_READ'
  | 'MARK_ALL_ANNOUNCEMENTS_READ'
  | 'MAINTENANCE_MODE_DISABLED'
  | 'MAINTENANCE_MODE_ENABLED'
  | 'UPDATE_EXCHANGE_RATES'



export interface TraceInput {
  id?: string;
  userId?: string | null;
  sessionId?: string | null;
  type: TraceType;
  entityId?: string | null;
  payload?: any;
  createdAt?: string;
}