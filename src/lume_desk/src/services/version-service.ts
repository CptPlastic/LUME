import axios from 'axios';
import { getAppVersion } from '../utils/version';

interface VersionInfo {
  version: string;
  releaseDate: string;
  changelog: string;
  downloadUrl?: string;
  critical: boolean;
}

interface UpdateStatus {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  versionInfo?: VersionInfo;
  error?: string;
}

export class VersionService {
  private static readonly UPDATE_CHECK_URL = process.env.VITE_UPDATE_URL || 'https://api.lume-controller.com/updates';
  private static readonly CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly STORAGE_KEY = 'lume-version-check';

  // Check for updates from remote server
  static async checkForUpdates(): Promise<UpdateStatus> {
    const currentVersion = getAppVersion();
    console.log(`🔍 Checking for updates... Current version: ${currentVersion}`);

    try {
      const response = await axios.get<VersionInfo>(`${this.UPDATE_CHECK_URL}/latest`, {
        timeout: 10000,
        headers: {
          'X-Current-Version': currentVersion,
          'X-Platform': this.getPlatform()
        }
      });

      const versionInfo = response.data;
      const hasUpdate = this.compareVersions(currentVersion, versionInfo.version) < 0;

      const updateStatus: UpdateStatus = {
        hasUpdate,
        currentVersion,
        latestVersion: versionInfo.version,
        versionInfo,
      };

      // Store the check result with timestamp
      this.storeCheckResult(updateStatus);

      console.log(`✅ Update check complete:`, updateStatus);
      return updateStatus;

    } catch (error) {
      console.error('❌ Failed to check for updates:', error);
      
      // Try to return cached result if network fails
      const cached = this.getCachedCheckResult();
      if (cached && this.isCacheValid(cached.timestamp)) {
        console.log('📦 Using cached update check result');
        return cached.result;
      }

      return {
        hasUpdate: false,
        currentVersion,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Check if we're online or connected to LUME network
  static async detectNetworkMode(): Promise<'online' | 'lume' | 'offline'> {
    try {
      // First check if we can reach the internet
      const onlineTest = axios.create({ timeout: 5000 });
      try {
        await onlineTest.get('https://api.lume-controller.com/ping');
        return 'online';
      } catch {
        // Check if we're on LUME network by looking for controllers
        const lumeTest = axios.create({ timeout: 3000 });
        try {
          await lumeTest.get('http://lume-controller.local/status');
          return 'lume';
        } catch {
          try {
            await lumeTest.get('http://lume-lighting.local/status');
            return 'lume';
          } catch {
            return 'offline';
          }
        }
      }
    } catch {
      return 'offline';
    }
  }

  // Download and install update (Tauri-specific)
  static async downloadUpdate(downloadUrl: string): Promise<boolean> {
    console.log(`📥 Starting download from: ${downloadUrl}`);
    
    try {
      // Check if running in Tauri
      const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
      
      if (isTauri) {
        // Use Tauri updater if available
        try {
          // Dynamic import with error handling for missing modules
          const { check } = await import('@tauri-apps/plugin-updater').catch(() => ({ 
            check: null 
          }));
          
          if (check) {
            const update = await check();
            if (update) {
              console.log('🔄 Installing update...');
              await update.downloadAndInstall();
              return true;
            } else {
              console.log('ℹ️ No update available through Tauri updater');
            }
          }
        } catch {
          console.log('⚠️ Tauri updater not available, using manual download');
        }
        
        // Fallback to manual download with Tauri
        try {
          const { open } = await import('@tauri-apps/plugin-shell').catch(() => ({ open: null }));
          if (open) {
            await open(downloadUrl);
            return true;
          }
        } catch {
          console.log('⚠️ Tauri shell not available, falling back to browser');
        }
      }
      
      // Browser environment or Tauri fallback - open download link
      if (typeof window !== 'undefined') {
        window.open(downloadUrl, '_blank');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Failed to download update:', error);
      return false;
    }
  }

  // Auto-check for updates on startup if online
  static async autoCheckForUpdates(): Promise<UpdateStatus | null> {
    const networkMode = await this.detectNetworkMode();
    
    if (networkMode !== 'online') {
      console.log(`🌐 Network mode: ${networkMode} - skipping auto update check`);
      return null;
    }

    // Check if we've checked recently
    const cached = this.getCachedCheckResult();
    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log('⏰ Using cached update check (within 24h)');
      return cached.result;
    }

    console.log('🔄 Auto-checking for updates...');
    return await this.checkForUpdates();
  }

  // Enable offline show building mode
  static enableOfflineMode(): void {
    localStorage.setItem('lume-offline-mode', 'true');
    console.log('🔧 Offline mode enabled - show building without controller validation');
  }

  // Disable offline show building mode
  static disableOfflineMode(): void {
    localStorage.removeItem('lume-offline-mode');
    console.log('🔧 Offline mode disabled - normal operation');
  }

  // Check if offline mode is enabled
  static isOfflineModeEnabled(): boolean {
    return localStorage.getItem('lume-offline-mode') === 'true';
  }

  // Compare semantic versions (returns -1, 0, or 1)
  private static compareVersions(version1: string, version2: string): number {
    const v1parts = version1.split('.').map(n => parseInt(n, 10));
    const v2parts = version2.split('.').map(n => parseInt(n, 10));
    
    const maxLength = Math.max(v1parts.length, v2parts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;
      
      if (v1part < v2part) return -1;
      if (v1part > v2part) return 1;
    }
    
    return 0;
  }

  // Get current platform for update targeting
  private static getPlatform(): string {
    const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
    
    if (isTauri && typeof navigator !== 'undefined') {
      // Try to detect OS from user agent
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('mac')) return 'darwin';
      if (userAgent.includes('win')) return 'windows';
      if (userAgent.includes('linux')) return 'linux';
    }
    
    return 'web';
  }

  // Store update check result in localStorage
  private static storeCheckResult(result: UpdateStatus): void {
    try {
      const data = {
        result,
        timestamp: Date.now()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to store update check result:', error);
    }
  }

  // Get cached update check result
  private static getCachedCheckResult(): { result: UpdateStatus; timestamp: number } | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to get cached update check result:', error);
    }
    return null;
  }

  // Check if cached result is still valid (within CHECK_INTERVAL)
  private static isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CHECK_INTERVAL;
  }

  // Force clear update cache
  static clearUpdateCache(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🧹 Update check cache cleared');
  }
}