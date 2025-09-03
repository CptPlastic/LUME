export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'log' | 'error' | 'warn' | 'info' | 'debug';
  message: string;
  args: unknown[];
  source?: string;
  stack?: string;
}

export interface LogFilter {
  level?: ('log' | 'error' | 'warn' | 'info' | 'debug')[];
  source?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  searchText?: string;
}

class LoggingService {
  private logs: LogEntry[] = [];
  private maxLogEntries = 10000; // Prevent memory overflow
  private listeners: ((logs: LogEntry[]) => void)[] = [];
  private originalConsole: {
    log: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    debug: (...args: unknown[]) => void;
  };

  constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      error: console.error.bind(console),
      warn: console.warn.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console)
    };

    this.interceptConsole();
  }

  private interceptConsole() {
    // Override console methods to capture logs
    console.log = (...args: unknown[]) => {
      this.addLog('log', this.formatMessage(args), args);
      this.originalConsole.log(...args);
    };

    console.error = (...args: unknown[]) => {
      this.addLog('error', this.formatMessage(args), args);
      this.originalConsole.error(...args);
    };

    console.warn = (...args: unknown[]) => {
      this.addLog('warn', this.formatMessage(args), args);
      this.originalConsole.warn(...args);
    };

    console.info = (...args: unknown[]) => {
      this.addLog('info', this.formatMessage(args), args);
      this.originalConsole.info(...args);
    };

    console.debug = (...args: unknown[]) => {
      this.addLog('debug', this.formatMessage(args), args);
      this.originalConsole.debug(...args);
    };
  }

  private formatMessage(args: unknown[]): string {
    return args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
  }

  private addLog(level: LogEntry['level'], message: string, args: unknown[]) {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      message,
      args,
      source: this.getSource(),
      stack: level === 'error' ? new Error().stack : undefined
    };

    this.logs.push(entry);

    // Keep only the latest entries to prevent memory issues
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }

    // Notify listeners
    this.notifyListeners();
  }

  private getSource(): string {
    const stack = new Error().stack;
    if (!stack) return 'unknown';

    const lines = stack.split('\n');
    // Skip the first few lines (Error, addLog, console method, our interceptor)
    for (let i = 4; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('.tsx') || line.includes('.ts')) {
        // Extract filename and line number
        const match = line.match(/([^/\\]+\.(tsx?|js)):(\d+)/);
        if (match) {
          return `${match[1]}:${match[3]}`;
        }
      }
    }
    return 'unknown';
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener([...this.logs]);
      } catch (error) {
        // Use original console to avoid infinite loop
        this.originalConsole.error('Error in log listener:', error);
      }
    });
  }

  // Public API
  public getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  public getFilteredLogs(filter: LogFilter): LogEntry[] {
    return this.logs.filter(log => {
      // Filter by level
      if (filter.level && !filter.level.includes(log.level)) {
        return false;
      }

      // Filter by source
      if (filter.source && !log.source?.includes(filter.source)) {
        return false;
      }

      // Filter by time range
      if (filter.timeRange) {
        if (log.timestamp < filter.timeRange.start || log.timestamp > filter.timeRange.end) {
          return false;
        }
      }

      // Filter by search text
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        if (!log.message.toLowerCase().includes(searchLower) &&
            !log.source?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }

  public subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public clearLogs() {
    this.logs = [];
    this.notifyListeners();
  }

  public exportLogs(format: 'json' | 'csv' | 'txt' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(this.logs, null, 2);
      
      case 'csv': {
        const headers = ['Timestamp', 'Level', 'Source', 'Message'];
        const rows = this.logs.map(log => [
          log.timestamp.toISOString(),
          log.level,
          log.source || 'unknown',
          `"${log.message.replace(/"/g, '""')}"`
        ]);
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      }
      
      case 'txt':
        return this.logs.map(log => 
          `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()} ${log.source ? `(${log.source})` : ''}: ${log.message}`
        ).join('\n');
      
      default:
        return JSON.stringify(this.logs, null, 2);
    }
  }

  public async downloadLogs(filename?: string, format: 'json' | 'csv' | 'txt' = 'json') {
    const content = this.exportLogs(format);
    const finalFilename = filename || `lume-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${format}`;
    
    // Simple browser download for now
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.originalConsole.log(`✅ Logs downloaded as: ${finalFilename}`);
  }

  public getLogStats(): {
    total: number;
    byLevel: Record<LogEntry['level'], number>;
    bySource: Record<string, number>;
    timeRange: { start: Date; end: Date } | null;
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {
        log: 0,
        error: 0,
        warn: 0,
        info: 0,
        debug: 0
      } as Record<LogEntry['level'], number>,
      bySource: {} as Record<string, number>,
      timeRange: this.logs.length > 0 ? {
        start: this.logs[0].timestamp,
        end: this.logs[this.logs.length - 1].timestamp
      } : null
    };

    this.logs.forEach(log => {
      stats.byLevel[log.level]++;
      const source = log.source || 'unknown';
      stats.bySource[source] = (stats.bySource[source] || 0) + 1;
    });

    return stats;
  }

  public restoreConsole() {
    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.info = this.originalConsole.info;
    console.debug = this.originalConsole.debug;
  }
}

// Create and export singleton instance
export const loggingService = new LoggingService();

// Helper function to get logs for React components
export const useLogs = () => {
  return loggingService;
};
