import { useCallback, useMemo, useState } from 'react';

export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

export interface ConsoleEntry {
  level: LogLevel;
  args: any[];
  timestamp: number;
  style?: string;
}

export type ThemeMode = 'light' | 'dark' | 'custom';

export interface ThemeConfig {
  log: string;
  info: string;
  warn: string;
  error: string;
  debug: string;
}

export interface UseConsoleOptions {
  maxEntries?: number;
  disabledLevels?: LogLevel[];
  onCapture?: (entry: ConsoleEntry) => void;
  theme?: ThemeMode;
  customTheme?: Partial<ThemeConfig>;
  silent?: boolean;
}

export interface UseConsoleReturn {
  logs: ConsoleEntry[];
  clear: () => void;
  logger: Record<LogLevel, (...args: any[]) => void>;
  count: (label?: string) => void;
  time: (label?: string) => void;
  timeEnd: (label?: string) => void;
}

// Themes
const themes: Record<ThemeMode, ThemeConfig> = {
  light: {
    log: 'color: black;',
    info: 'color: blue;',
    warn: 'color: orange;',
    error: 'color: red; font-weight: bold;',
    debug: 'color: gray;',
  },
  dark: {
    log: 'color: #ddd;',
    info: 'color: #4fc3f7;',
    warn: 'color: #ffb74d;',
    error: 'color: #ef5350; font-weight: bold;',
    debug: 'color: #9e9e9e;',
  },
  custom: {
    log: '',
    info: '',
    warn: '',
    error: '',
    debug: '',
  },
};

const useConsole = (options: UseConsoleOptions = {}): UseConsoleReturn => {
  const {
    maxEntries = 500,
    disabledLevels = [],
    onCapture,
    theme = 'light',
    customTheme = {},
    silent = false,
  } = options;

  const [logs, setLogs] = useState<ConsoleEntry[]>([]);
  const [counters, setCounters] = useState<Record<string, number>>({});
  const [timers, setTimers] = useState<Record<string, number>>({});

  const themeConfig = useMemo(() => {
    return {
      ...themes[theme],
      ...customTheme,
    };
  }, [theme, customTheme]);

  const isLevelEnabled = useCallback(
    (level: LogLevel) => !disabledLevels.includes(level),
    [disabledLevels]
  );

  const addLog = useCallback(
    (level: LogLevel, args: any[]) => {
      if (!isLevelEnabled(level)) return;

      const entry: ConsoleEntry = {
        level,
        args,
        timestamp: Date.now(),
        style: themeConfig[level],
      };

      setLogs(prev => [...prev, entry].slice(-maxEntries));
      onCapture?.(entry);

      if (!silent) {
        console[level](`%c${args.join(' ')}`, themeConfig[level]);
      }
    },
    [isLevelEnabled, maxEntries, onCapture, themeConfig, silent]
  );

  const logger = useMemo(() => {
    return {
      log: (...args: any[]) => addLog('log', args),
      info: (...args: any[]) => addLog('info', args),
      warn: (...args: any[]) => addLog('warn', args),
      error: (...args: any[]) => addLog('error', args),
      debug: (...args: any[]) => addLog('debug', args),
    };
  }, [addLog]);

  const clear = useCallback(() => {
    setLogs([]);
    setCounters({});
    setTimers({});
  }, []);

  const count = useCallback((label = 'default') => {
    setCounters(prev => {
      const next = { ...prev };
      next[label] = (next[label] || 0) + 1;
      logger.log(`${label}: ${next[label]}`);
      return next;
    });
  }, [logger]);

  const time = useCallback((label = 'default') => {
    setTimers(prev => ({ ...prev, [label]: Date.now() }));
  }, []);

  const timeEnd = useCallback((label = 'default') => {
    setTimers(prev => {
      const start = prev[label];
      if (start) {
        const duration = Date.now() - start;
        const next = { ...prev };
        delete next[label];
        logger.log(`${label}: ${duration}ms`);
        return next;
      }
      return prev;
    });
  }, [logger]);

  return {
    logs,
    clear,
    logger,
    count,
    time,
    timeEnd,
  };
};

export default useConsole;
