import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Download, Trash2, Search, Filter, CheckCircle, AlertCircle, Info, Zap, Bug, ArrowDown } from 'lucide-react';
import type { LogEntry, LogFilter } from '../services/logging-service';
import { loggingService } from '../services/logging-service';

interface LogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogViewer: React.FC<LogViewerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedLevels, setSelectedLevels] = useState<Set<LogEntry['level']>>(
    new Set(['log', 'error', 'warn', 'info', 'debug'])
  );
  const [searchText, setSearchText] = useState('');
  const [showStackTrace, setShowStackTrace] = useState(false);
  const [newLogCount, setNewLogCount] = useState(0);
  
  // Ref for auto-scrolling
  const logsContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Get initial logs
    setLogs(loggingService.getAllLogs());

    // Subscribe to log updates
    const unsubscribe = loggingService.subscribe((newLogs) => {
      const previousCount = logs.length;
      setLogs(newLogs);
      
      // If not auto-scrolling, track new logs
      if (!autoScroll && newLogs.length > previousCount) {
        setNewLogCount(prev => prev + (newLogs.length - previousCount));
      }
    });

    return unsubscribe;
  }, [isOpen, autoScroll, logs.length]);

  const filteredLogs = useMemo(() => {
    const currentFilter: LogFilter = {
      level: Array.from(selectedLevels),
      searchText: searchText || undefined
    };
    
    return loggingService.getFilteredLogs(currentFilter);
  }, [selectedLevels, searchText, logs]); // Added logs as dependency to ensure real-time updates

  const stats = useMemo(() => loggingService.getLogStats(), [logs]); // Added logs dependency

  // Auto-scroll effect - should depend on filteredLogs, not just logs
  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      // Reset new log count when auto-scroll is active
      setNewLogCount(0);
      
      // Use requestAnimationFrame to ensure scroll happens after DOM update
      requestAnimationFrame(() => {
        if (logsContainerRef.current) {
          logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
        }
      });
    }
  }, [filteredLogs, autoScroll]);

  // Handle scroll events to disable auto-scroll when user scrolls up
  const handleScroll = useCallback(() => {
    if (!logsContainerRef.current || !autoScroll) return;
    
    const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20; // Increased threshold
    
    if (!isAtBottom) {
      setAutoScroll(false);
    }
  }, [autoScroll]);

  useEffect(() => {
    const container = logsContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Function to manually scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
      setAutoScroll(true);
      setNewLogCount(0); // Reset new log count when scrolling to bottom
    }
  }, []);

  const handleLevelToggle = (level: LogEntry['level']) => {
    const newSelected = new Set(selectedLevels);
    if (newSelected.has(level)) {
      newSelected.delete(level);
    } else {
      newSelected.add(level);
    }
    setSelectedLevels(newSelected);
  };

  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear all logs?')) {
      loggingService.clearLogs();
    }
  };

  const handleExportLogs = async (format: 'json' | 'csv' | 'txt') => {
    try {
      await loggingService.downloadLogs(undefined, format);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString() + '.' + timestamp.getMilliseconds().toString().padStart(3, '0');
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      case 'debug': return 'text-gray-400';
      default: return 'text-green-400';
    }
  };

  const getLevelBadgeColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'bg-red-500 text-white';
      case 'warn': return 'bg-yellow-500 text-black';
      case 'info': return 'bg-blue-500 text-white';
      case 'debug': return 'bg-gray-500 text-white';
      default: return 'bg-green-500 text-white';
    }
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return <AlertCircle className="w-4 h-4" />;
      case 'warn': return <AlertCircle className="w-4 h-4" />;
      case 'info': return <Info className="w-4 h-4" />;
      case 'debug': return <Bug className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-bold text-white">System Logs</h2>
            <span className="text-sm text-gray-400">
              ({logs.length} total, {filteredLogs.length} shown)
            </span>
            {!autoScroll && newLogCount > 0 && (
              <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full">
                {newLogCount} new
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-700 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400"
            />
          </div>

          {/* Level Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Levels:</span>
            </div>
            {(['error', 'warn', 'info', 'log', 'debug'] as const).map((level) => (
              <button
                key={level}
                onClick={() => handleLevelToggle(level)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedLevels.has(level)
                    ? getLevelBadgeColor(level)
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center space-x-1">
                  {getLevelIcon(level)}
                  <span>{level.toUpperCase()}</span>
                  <span className="bg-black bg-opacity-20 px-1 rounded">
                    {stats.byLevel[level] || 0}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded"
                />
                <span>Auto-scroll</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={showStackTrace}
                  onChange={(e) => setShowStackTrace(e.target.checked)}
                  className="rounded"
                />
                <span>Show stack traces</span>
              </label>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleExportLogs('json')}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>JSON</span>
              </button>
              <button
                onClick={() => handleExportLogs('csv')}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => handleExportLogs('txt')}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>TXT</span>
              </button>
              <button
                onClick={handleClearLogs}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm flex items-center space-x-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>

        {/* Logs Container */}
        <div 
          ref={logsContainerRef}
          className="flex-1 overflow-auto p-4 font-mono text-sm relative"
        >
          <div className="space-y-1">
            {filteredLogs.map((log) => (
              <div key={log.id} className="group hover:bg-gray-800 p-2 rounded">
                <div className="flex items-start space-x-3">
                  {/* Timestamp */}
                  <span className="text-gray-500 text-xs whitespace-nowrap">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  
                  {/* Level Badge */}
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getLevelBadgeColor(log.level)} whitespace-nowrap`}>
                    {log.level.toUpperCase()}
                  </span>
                  
                  {/* Source */}
                  {log.source && (
                    <span className="text-blue-400 text-xs whitespace-nowrap">
                      {log.source}
                    </span>
                  )}
                  
                  {/* Message */}
                  <div className="flex-1 min-w-0">
                    <div className={`${getLevelColor(log.level)} break-words`}>
                      {log.message}
                    </div>
                    
                    {/* Stack Trace */}
                    {showStackTrace && log.stack && (
                      <pre className="text-gray-400 text-xs mt-1 whitespace-pre-wrap overflow-auto">
                        {log.stack}
                      </pre>
                    )}
                    
                    {/* Raw Arguments (for debugging) */}
                    {log.args && log.args.length > 1 && (
                      <details className="mt-1">
                        <summary className="text-gray-500 text-xs cursor-pointer hover:text-gray-400">
                          Raw arguments ({log.args.length})
                        </summary>
                        <pre className="text-gray-400 text-xs mt-1 whitespace-pre-wrap overflow-auto">
                          {JSON.stringify(log.args, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredLogs.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                {logs.length === 0 ? 'No logs captured yet' : 'No logs match current filters'}
              </div>
            )}
          </div>
          
          {/* Scroll to Bottom Button */}
          {!autoScroll && filteredLogs.length > 0 && (
            <button
              onClick={scrollToBottom}
              className="fixed bottom-24 right-8 bg-lume-primary hover:bg-lume-primary-dark text-white p-2 rounded-full shadow-lg transition-all duration-200 z-10 flex items-center space-x-1"
              title="Scroll to bottom and enable auto-scroll"
            >
              <ArrowDown className="w-4 h-4" />
              {newLogCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
                  {newLogCount > 99 ? '99+' : newLogCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Footer Stats */}
        <div className="border-t border-gray-700 p-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div>
              Total: {stats.total} | 
              Errors: {stats.byLevel.error || 0} | 
              Warnings: {stats.byLevel.warn || 0} | 
              Info: {stats.byLevel.info || 0} | 
              Debug: {stats.byLevel.debug || 0}
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${autoScroll ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                <span>
                  {autoScroll ? 'Real-time updates active' : 'Auto-scroll disabled'}
                </span>
              </div>
              {!autoScroll && '• Scroll to bottom to re-enable'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogViewer;
