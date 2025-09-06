import React, { useState, useEffect } from 'react';
import { 
  Download, 
  X, 
  AlertCircle, 
  WifiOff, 
  Wifi,
  Globe, 
  RefreshCw,
  Settings
} from 'lucide-react';
import { VersionService } from '../services/version-service';
import { useLumeStore } from '../store/lume-store';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface UpdateNotificationProps {
  // No props needed - component manages its own state
}

interface UpdateStatus {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  versionInfo?: {
    version: string;
    releaseDate: string;
    changelog: string;
    downloadUrl?: string;
    downloads?: {
      macos?: string;
      linux?: string;
      windows?: string;
      web?: string;
    };
    platforms?: {
      [key: string]: {
        signature?: string;
        url: string;
      };
    };
    critical: boolean;
  };
  error?: string;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = () => {
  const { isOfflineMode, toggleOfflineMode } = useLumeStore();
  
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [networkMode, setNetworkMode] = useState<'online' | 'lume' | 'offline'>('offline');
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check network mode and updates on component mount and set up periodic checks
  useEffect(() => {
    checkNetworkAndUpdates();
    
    // Set up periodic network checks every 30 seconds
    const networkCheckInterval = setInterval(async () => {
      if (!isChecking) {
        const mode = await VersionService.detectNetworkMode();
        if (mode !== networkMode) {
          setNetworkMode(mode);
        }
      }
    }, 30000);

    // Listen for browser online/offline events
    const handleOnline = async () => {
      setTimeout(async () => {
        const mode = await VersionService.detectNetworkMode();
        setNetworkMode(mode);
      }, 1000);
    };

    const handleOffline = () => {
      setNetworkMode('offline');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    // Cleanup
    return () => {
      clearInterval(networkCheckInterval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkNetworkAndUpdates = async () => {
    setIsChecking(true);
    
    // Check network mode first
    const mode = await VersionService.detectNetworkMode();
    setNetworkMode(mode);
    
    // Only check for updates if online
    if (mode === 'online') {
      const status = await VersionService.autoCheckForUpdates();
      setUpdateStatus(status);
    }
    
    setIsChecking(false);
  };

  const handleCheckForUpdates = async () => {
    setIsChecking(true);
    setDismissed(false); // Reset dismissal state when manually checking
    VersionService.clearUpdateCache(); // Clear cache to force fresh check
    const status = await VersionService.checkForUpdates();
    setUpdateStatus(status);
    setIsChecking(false);
  };

  const handleDownloadUpdate = async () => {
    if (!updateStatus?.versionInfo) return;
    
    setIsDownloading(true);
    const success = await VersionService.downloadUpdate(updateStatus.versionInfo);
    
    if (!success) {
      // Could add user-friendly error handling here if needed
    }
    
    setIsDownloading(false);
  };

  const handleToggleOfflineMode = async () => {
    toggleOfflineMode();
    
    // Re-check network mode after toggle to update UI immediately
    setTimeout(async () => {
      const mode = await VersionService.detectNetworkMode();
      setNetworkMode(mode);
    }, 100);
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  // Simple Markdown renderer for changelog
  const renderMarkdown = (markdown: string) => {
    if (!markdown) return null;
    
    const lines = markdown.split('\n');
    const elements: React.ReactNode[] = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const key = `md-${index}-${trimmed.substring(0, 10)}`;
      
      if (trimmed.startsWith('## ')) {
        // H2 heading
        elements.push(
          <h3 key={key} className="font-semibold text-gray-200 mt-2 mb-1 text-sm">
            {trimmed.substring(3)}
          </h3>
        );
      } else if (trimmed.startsWith('# ')) {
        // H1 heading
        elements.push(
          <h2 key={key} className="font-bold text-gray-100 mt-2 mb-1">
            {trimmed.substring(2)}
          </h2>
        );
      } else if (trimmed.startsWith('- ')) {
        // Bullet point
        elements.push(
          <div key={key} className="flex items-start space-x-2 ml-2">
            <span className="text-gray-500 mt-0.5">•</span>
            <span className="text-gray-400 text-xs">{trimmed.substring(2)}</span>
          </div>
        );
      } else if (trimmed === '') {
        // Empty line
        elements.push(<div key={key} className="h-1" />);
      } else {
        // Regular text
        elements.push(
          <p key={key} className="text-gray-400 text-xs">
            {trimmed}
          </p>
        );
      }
    });
    
    return <div className="space-y-0.5">{elements}</div>;
  };

  const getNetworkIcon = () => {
    switch (networkMode) {
      case 'online':
        return <Globe className="w-4 h-4 text-green-500" />;
      case 'lume':
        return <Wifi className="w-4 h-4 text-orange-500" />;
      case 'offline':
        return <WifiOff className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNetworkLabel = () => {
    switch (networkMode) {
      case 'online':
        return 'Internet Connected';
      case 'lume':
        return 'LUME WiFi Connected';
      case 'offline':
        return 'Offline';
    }
  };

  const getNetworkDescription = () => {
    switch (networkMode) {
      case 'online':
        return 'Connected to internet - updates and show building available';
      case 'lume':
        return 'Connected to LUME show WiFi - controllers available, no internet updates';
      case 'offline':
        return isOfflineMode ? 'Offline mode enabled - show building without validation' : 'No network connection - limited functionality';
    }
  };

  // Reset dismissal if a new update is found
  React.useEffect(() => {
    if (updateStatus?.hasUpdate && updateStatus.versionInfo?.critical) {
      setDismissed(false); // Critical updates can't be permanently dismissed
    }
  }, [updateStatus]);

  return (
    <div className="space-y-3">
      {/* Network Status */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getNetworkIcon()}
            <span className="text-white font-medium">{getNetworkLabel()}</span>
            {isChecking && <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />}
          </div>
          
          <div className="flex items-center space-x-2">
            {networkMode === 'offline' && (
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isOfflineMode
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-gray-200'
                }`}
                onClick={handleToggleOfflineMode}
              >
                {isOfflineMode ? 'Offline Mode ON' : 'Enable Offline Mode'}
              </button>
            )}
            
            {networkMode === 'online' && (
              <button
                onClick={handleCheckForUpdates}
                disabled={isChecking}
                className="px-3 py-1 text-xs font-medium bg-lume-secondary hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
              >
                {isChecking ? 'Checking...' : 'Check Updates'}
              </button>
            )}
          </div>
        </div>
        
        <p className="text-sm text-gray-400">{getNetworkDescription()}</p>
        
        {/* Offline Mode Explanation */}
        {networkMode === 'offline' && (
          <div className="mt-2 p-2 bg-gray-900/50 rounded border border-gray-600">
            <div className="flex items-start space-x-2">
              <Settings className="w-4 h-4 text-lume-accent mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-300">
                <p className="font-medium">Offline Mode:</p>
                <p>
                  {isOfflineMode 
                    ? 'Build shows without controller validation. Shows can be saved and exported for later use when controllers are available.'
                    : 'Show building requires connected controllers. Enable offline mode to build shows without validation.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Update Available Notification */}
      {updateStatus?.hasUpdate && updateStatus.versionInfo && (!dismissed || updateStatus.versionInfo.critical) && (
        <div className={`bg-gradient-to-r p-4 rounded-lg border-l-4 ${
          updateStatus.versionInfo.critical 
            ? 'from-red-900/20 to-red-800/10 border-red-500' 
            : 'from-blue-900/20 to-blue-800/10 border-blue-500'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {updateStatus.versionInfo.critical ? (
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              ) : (
                <Download className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              )}
              
              <div className="space-y-2 flex-1">
                <div>
                  <h3 className="text-white font-semibold">
                    {updateStatus.versionInfo.critical ? 'Critical Update Available' : 'Update Available'}
                  </h3>
                  <p className="text-sm text-gray-300">
                    Version {updateStatus.latestVersion} is now available 
                    (current: {updateStatus.currentVersion})
                  </p>
                </div>
                
                {updateStatus.versionInfo.changelog && (
                  <div className="text-sm text-gray-400">
                    <p className="font-medium mb-2">What's New:</p>
                    {renderMarkdown(updateStatus.versionInfo.changelog)}
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  Released: {new Date(updateStatus.versionInfo.releaseDate).toLocaleDateString()}
                </div>
                
                <div className="flex items-center space-x-2">
                  {(updateStatus.versionInfo.downloadUrl || updateStatus.versionInfo.downloads || updateStatus.versionInfo.platforms) && (
                    <button
                      onClick={handleDownloadUpdate}
                      disabled={isDownloading}
                      className={`px-4 py-2 font-medium rounded transition-colors disabled:opacity-50 ${
                        updateStatus.versionInfo.critical
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                      title="Downloads the update file. Due to security requirements, you may need to manually install it."
                    >
                      {isDownloading ? (
                        <div className="flex items-center space-x-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Downloading...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Download className="w-4 h-4" />
                          <span>{updateStatus.versionInfo.critical ? 'Download Now' : 'Download Update'}</span>
                        </div>
                      )}
                    </button>
                  )}
                  
                  {!updateStatus.versionInfo.critical && (
                    <button
                      onClick={handleDismiss}
                      className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                      Later
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {!updateStatus.versionInfo.critical && (
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-white transition-colors ml-4"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Update Check Error */}
      {updateStatus?.error && (
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-200 font-medium">Update Check Failed</p>
              <p className="text-xs text-yellow-300">{updateStatus.error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};