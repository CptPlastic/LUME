import React, { useState, useEffect } from 'react';
import { 
  Download, 
  X, 
  AlertCircle, 
  WifiOff, 
  Globe, 
  Zap,
  RefreshCw,
  Settings
} from 'lucide-react';
import { VersionService } from '../services/version-service';

interface UpdateNotificationProps {
  onDismiss?: () => void;
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
    critical: boolean;
  };
  error?: string;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onDismiss }) => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [networkMode, setNetworkMode] = useState<'online' | 'lume' | 'offline'>('offline');
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [offlineMode, setOfflineMode] = useState(VersionService.isOfflineModeEnabled());

  // Check network mode and updates on component mount
  useEffect(() => {
    checkNetworkAndUpdates();
  }, []);

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
    const status = await VersionService.checkForUpdates();
    setUpdateStatus(status);
    setIsChecking(false);
  };

  const handleDownloadUpdate = async () => {
    if (!updateStatus?.versionInfo?.downloadUrl) return;
    
    setIsDownloading(true);
    const success = await VersionService.downloadUpdate(updateStatus.versionInfo.downloadUrl);
    
    if (success) {
      console.log('✅ Update download started');
    } else {
      console.error('❌ Failed to start update download');
    }
    
    setIsDownloading(false);
  };

  const handleToggleOfflineMode = () => {
    const newOfflineMode = !offlineMode;
    if (newOfflineMode) {
      VersionService.enableOfflineMode();
    } else {
      VersionService.disableOfflineMode();
    }
    setOfflineMode(newOfflineMode);
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const getNetworkIcon = () => {
    switch (networkMode) {
      case 'online':
        return <Globe className="w-4 h-4 text-green-500" />;
      case 'lume':
        return <Zap className="w-4 h-4 text-lume-primary" />;
      case 'offline':
        return <WifiOff className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNetworkLabel = () => {
    switch (networkMode) {
      case 'online':
        return 'Online';
      case 'lume':
        return 'LUME Network';
      case 'offline':
        return 'Offline';
    }
  };

  const getNetworkDescription = () => {
    switch (networkMode) {
      case 'online':
        return 'Connected to internet - updates available';
      case 'lume':
        return 'Connected to LUME controllers - show building enabled';
      case 'offline':
        return offlineMode ? 'Offline mode - show building enabled' : 'Offline - show building limited';
    }
  };

  // Don't render if dismissed
  if (dismissed) return null;

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
                onClick={handleToggleOfflineMode}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  offlineMode
                    ? 'bg-lume-primary text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {offlineMode ? 'Offline Mode ON' : 'Enable Offline Mode'}
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
                  {offlineMode 
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
      {updateStatus?.hasUpdate && updateStatus.versionInfo && (
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
                    <p className="font-medium mb-1">What's New:</p>
                    <p>{updateStatus.versionInfo.changelog}</p>
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  Released: {new Date(updateStatus.versionInfo.releaseDate).toLocaleDateString()}
                </div>
                
                <div className="flex items-center space-x-2">
                  {updateStatus.versionInfo.downloadUrl && (
                    <button
                      onClick={handleDownloadUpdate}
                      disabled={isDownloading}
                      className={`px-4 py-2 font-medium rounded transition-colors disabled:opacity-50 ${
                        updateStatus.versionInfo.critical
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isDownloading ? (
                        <div className="flex items-center space-x-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Downloading...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Download className="w-4 h-4" />
                          <span>{updateStatus.versionInfo.critical ? 'Update Now' : 'Download Update'}</span>
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