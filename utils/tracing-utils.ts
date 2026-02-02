import { LocalStorageData } from "@/types/tracing";

// utils/tracing-utils.ts
export const getDefaultStorageData = (): LocalStorageData => ({
  sessions: {},
  currentSessionId: '',
  traceQueue: [],
  explanations: {},
  pageVisits: {},
  metadata: {
    totalSessions: 0,
    firstVisitDate: new Date(),
    lastVisitDate: new Date(),
  }
});

export const compressTraces = (traces: any[]): any[] => {
  return traces.map(trace => ({
    t: trace.type.substring(0, 3), // "SIG" pour SIGNIN, etc.
    e: trace.entityId || null,
    p: compressPayload(trace.payload),
    ts: trace.timestamp,
  }));
};

export const compressPayload = (payload: any): any => {
  if (!payload) return null;
  
  // Compression simple
  if (typeof payload === 'object') {
    const compressed: any = {};
    for (const key in payload) {
      if (key.length <= 3) {
        compressed[key] = payload[key];
      } else {
        // Utiliser des clés courtes pour les champs communs
        const shortKey = COMMON_FIELD_MAP[key] || key.substring(0, 3);
        compressed[shortKey] = payload[key];
      }
    }
    return compressed;
  }
  
  return payload;
};

const COMMON_FIELD_MAP: Record<string, string> = {
  'page': 'p',
  'error': 'e',
  'userId': 'u',
  'sessionId': 's',
  'timestamp': 't',
  'duration': 'd',
  'type': 'ty',
};