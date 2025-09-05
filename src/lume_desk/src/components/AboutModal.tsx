import React, { useState, useEffect } from 'react';
import { X, Info, Download, CheckCircle, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { getVersionInfo } from '../utils/version';
import { VersionService } from '../services/version-service';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UpdateStatus {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  error?: string;
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
    critical: boolean;
  };
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const versionInfo = getVersionInfo();
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [networkMode, setNetworkMode] = useState<string>('unknown');

  useEffect(() => {
    if (isOpen) {
      // Detect network mode when modal opens
      VersionService.detectNetworkMode().then(mode => {
        setNetworkMode(mode);
      });
    }
  }, [isOpen]);

  const handleCheckForUpdates = async () => {
    setChecking(true);
    try {
      const status = await VersionService.checkForUpdates();
      setUpdateStatus(status);
    } catch (err) {
      console.error('Failed to check for updates:', err);
      setUpdateStatus({
        hasUpdate: false,
        currentVersion: versionInfo.app,
        error: 'Failed to check for updates'
      });
    } finally {
      setChecking(false);
    }
  };

  const handleDownloadUpdate = async () => {
    if (updateStatus?.versionInfo) {
      await VersionService.downloadUpdate(updateStatus.versionInfo);
    }
  };

  const formatBuildDate = (dateString: string) => {
    if (dateString === 'unknown') return 'Development build';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getNetworkModeInfo = () => {
    switch (networkMode) {
      case 'online':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          text: 'Online - Connected to internet',
          color: 'text-green-400'
        };
      case 'lume':
        return {
          icon: <AlertCircle className="w-4 h-4 text-yellow-500" />,
          text: 'LUME Network - Local controllers only',
          color: 'text-yellow-400'
        };
      case 'offline':
        return {
          icon: <AlertCircle className="w-4 h-4 text-red-500" />,
          text: 'Offline - No network connection',
          color: 'text-red-400'
        };
      default:
        return {
          icon: <Clock className="w-4 h-4 text-gray-500" />,
          text: 'Detecting network status...',
          color: 'text-gray-400'
        };
    }
  };

  const networkInfo = getNetworkModeInfo();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Info className="w-6 h-6 text-lume-primary" />
            <h3 className="text-xl font-semibold text-white">About LUME</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* App Info */}
        <div className="space-y-4 mb-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-lume-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">L</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">LUME Desktop Controller</h2>
            <p className="text-gray-400">Professional firework and lighting control application</p>
          </div>

          {/* Version Information */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-white mb-3">Version Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Version:</span>
                <span className="text-white font-mono">{versionInfo.app}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Base Version:</span>
                <span className="text-gray-300 font-mono">{versionInfo.base}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Git Commit:</span>
                <span className="text-gray-300 font-mono">
                  {versionInfo.isDev ? 'Development' : versionInfo.gitHash}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Build Date:</span>
                <span className="text-gray-300">{formatBuildDate(versionInfo.buildDate)}</span>
              </div>
            </div>
          </div>

          {/* Network Status */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-white mb-3">Network Status</h4>
            <div className="flex items-center space-x-2">
              {networkInfo.icon}
              <span className={networkInfo.color}>{networkInfo.text}</span>
            </div>
          </div>

          {/* Update Check */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-white">Updates</h4>
              <button
                onClick={handleCheckForUpdates}
                disabled={checking || networkMode === 'offline'}
                className="px-3 py-1 bg-lume-primary hover:bg-orange-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checking ? 'Checking...' : 'Check for Updates'}
              </button>
            </div>
            
            {updateStatus && (
              <div className="space-y-2">
                {updateStatus.hasUpdate && (
                  <div className="p-3 bg-green-900/20 border border-green-500/30 rounded">
                    <div className="flex items-center space-x-2 mb-2">
                      <Download className="w-4 h-4 text-green-500" />
                      <span className="text-green-300 font-medium">Update Available!</span>
                    </div>
                    <p className="text-sm text-green-200 mb-2">
                      Version {updateStatus.latestVersion} is now available.
                    </p>
                    {updateStatus.versionInfo?.downloadUrl && (
                      <button
                        onClick={handleDownloadUpdate}
                        className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Download Update</span>
                      </button>
                    )}
                  </div>
                )}
                
                {!updateStatus.hasUpdate && updateStatus.error && (
                  <div className="p-3 bg-red-900/20 border border-red-500/30 rounded">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-300 text-sm">{updateStatus.error}</span>
                    </div>
                  </div>
                )}
                
                {!updateStatus.hasUpdate && !updateStatus.error && (
                  <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      <span className="text-blue-300 text-sm">You're running the latest version!</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {networkMode === 'offline' && (
              <p className="text-xs text-gray-400 mt-2">
                Updates require an internet connection.
              </p>
            )}
          </div>

          {/* Additional Info */}
          <div className="text-xs text-gray-500 text-center">
            <p>© 2024 LUME Team. All rights reserved.</p>
            <p className="mt-1">Professional firework and lighting control system.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};