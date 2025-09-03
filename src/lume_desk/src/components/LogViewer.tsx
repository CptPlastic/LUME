import React, { useState, useEffect, useMemo } from 'react';
import type { LogEntry, LogFilter } from '../services/logging-service';
import { loggingService } from '../services/logging-service';

interface LogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedLevels, setSelectedLevels] = useState<Set<LogEntry['level']>>(
    new Set(['log', 'error', 'warn', 'info', 'debug'])
  );
  const [searchText, setSearchText] = useState('');
  const [showStackTrace, setShowStackTrace] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Get initial logs
    setLogs(loggingService.getAllLogs());

    // Subscribe to log updates
    const unsubscribe = loggingService.subscribe((newLogs) => {
      setLogs(newLogs);
    });

    return unsubscribe;
  }, [isOpen]);

  const filteredLogs = useMemo(() => {
    const currentFilter: LogFilter = {
      level: Array.from(selectedLevels),
      searchText: searchText || undefined
    };
    
    return loggingService.getFilteredLogs(currentFilter);
  }, [logs, selectedLevels, searchText]);

  const stats = useMemo(() => loggingService.getLogStats(), [logs]);

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
      case 'error': return 'bg-red-100 text-red-800';
      case 'warn': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'debug': return 'bg-gray-100 text-gray-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-lg w-full h-full max-w-6xl max-h-[90vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-white">Log Viewer</h2>
            <div className="text-sm text-gray-400">
              {filteredLogs.length} of {stats.total} logs
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-700 bg-gray-800 space-y-4">
          {/* Search and Actions */}
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400"
            />
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
              <span className="text-sm text-gray-300">Auto-scroll</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showStackTrace}
                onChange={(e) => setShowStackTrace(e.target.checked)}
              />
              <span className="text-sm text-gray-300">Stack traces</span>
            </label>
          </div>

          {/* Level Filters */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-300">Levels:</span>
            {(['log', 'error', 'warn', 'info', 'debug'] as const).map(level => (
              <label key={level} className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={selectedLevels.has(level)}
                  onChange={() => handleLevelToggle(level)}
                />
                <span className={`text-sm px-2 py-1 rounded ${getLevelBadgeColor(level)}`}>
                  {level} ({stats.byLevel[level]})
                </span>
              </label>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClearLogs}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Clear Logs
            </button>
            <button
              onClick={() => handleExportLogs('json')}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Export JSON
            </button>
            <button
              onClick={() => handleExportLogs('csv')}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              Export CSV
            </button>
            <button
              onClick={() => handleExportLogs('txt')}
              className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
            >
              Export TXT
            </button>
          </div>
        </div>

        {/* Log List */}
        <div className="flex-1 overflow-auto p-4 bg-gray-900">
          <div className="space-y-1 font-mono text-sm">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-2 rounded border-l-4 ${
                  log.level === 'error' ? 'border-red-500 bg-red-900/20' :
                  log.level === 'warn' ? 'border-yellow-500 bg-yellow-900/20' :
                  log.level === 'info' ? 'border-blue-500 bg-blue-900/20' :
                  log.level === 'debug' ? 'border-gray-500 bg-gray-800/50' :
                  'border-green-500 bg-green-900/20'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-gray-400 text-xs whitespace-nowrap">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <span className={`text-xs font-medium uppercase ${getLevelColor(log.level)}`}>
                    {log.level}
                  </span>
                  {log.source && (
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {log.source}
                    </span>
                  )}
                  <div className="flex-1">
                    <div className={`${getLevelColor(log.level)}`}>
                      {log.message}
                    </div>
                    {showStackTrace && log.stack && log.level === 'error' && (
                      <pre className="mt-2 text-xs text-gray-400 bg-gray-800 p-2 rounded overflow-x-auto">
                        {log.stack}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filteredLogs.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                No logs match the current filters
              </div>
            )}
          </div>
        </div>

        {/* Stats Footer */}
        <div className="p-3 border-t border-gray-700 bg-gray-800 text-xs text-gray-400">
          <div className="flex justify-between">
            <div>
              Total: {stats.total} | 
              Errors: {stats.byLevel.error} | 
              Warnings: {stats.byLevel.warn} | 
              Info: {stats.byLevel.info} | 
              Debug: {stats.byLevel.debug}
            </div>
            {stats.timeRange && (
              <div>
                {formatTimestamp(stats.timeRange.start)} - {formatTimestamp(stats.timeRange.end)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
