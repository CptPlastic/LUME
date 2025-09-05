import axios from 'axios';
import { getAppVersion, getBaseVersion } from '../utils/version';

interface VersionInfo {
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
}

interface UpdateStatus {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  versionInfo?: VersionInfo;
  error?: string;
}

export class VersionService {
  private static readonly UPDATE_CHECK_URL = import.meta.env.VITE_UPDATE_URL || 'https://api.lume-controller.com/updates/latest';
  private static readonly CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly STORAGE_KEY = 'lume-version-check';

  // Check for updates from remote server
  static async checkForUpdates(): Promise<UpdateStatus> {
    const currentVersion = getBaseVersion(); // Use semantic version for comparison
    const displayVersion = getAppVersion();  // Keep git hash for display
    console.log(`🔍 Checking for updates... Current version: ${currentVersion} (display: ${displayVersion})`);

    try {
      const response = await axios.get<VersionInfo>(this.UPDATE_CHECK_URL, {
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
        currentVersion: displayVersion, // Show git hash version in UI
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
        currentVersion: displayVersion, // Show git hash version in UI
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Check if we're online or connected to LUME network
  static async detectNetworkMode(): Promise<'online' | 'lume' | 'offline'> {
    // First check if user has manually enabled offline mode
    if (this.isOfflineModeEnabled()) {
      console.log('🔧 User has offline mode enabled - returning offline');
      return 'offline';
    }

    console.log('🌐 Detecting network mode...');
    
    // Check browser's navigator.onLine first (basic connectivity check)
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('🔌 Browser reports offline - returning offline');
      return 'offline';
    }

    // Test connectivity using your API endpoint first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      console.log('🔍 Testing internet connectivity via your API...');
      const response = await fetch('https://api.p7n.co/ping', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('✅ Internet connectivity confirmed via api.p7n.co');
        
        // Even when online, check if we're also on LUME network for additional info
        try {
          // Try DNS resolution of lume-base.local to see if we're on the LUME network
          await fetch('http://lume-base.local:22', {  // Try SSH port as it's commonly open
            method: 'HEAD',
            signal: AbortSignal.timeout(500),
            cache: 'no-cache'
          });
        } catch (error) {
          // Any network-level response (even connection refused) means host is reachable
          if (error instanceof Error && (error.message.includes('Failed to fetch') || error.name === 'TypeError')) {
            console.log('📍 Also detected on LUME network while online');
          }
        }
        
        return 'online';
      } else {
        console.log('❌ Your API test failed with status:', response.status);
      }
    } catch (error) {
      console.log('❌ Your API connectivity test failed:', error instanceof Error ? error.message : 'Unknown error');
      
      // Fallback to a reliable test endpoint if your API fails
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        console.log('🔍 Fallback internet connectivity test...');
        const response = await fetch('https://httpbin.org/status/200', {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log('✅ Internet connectivity confirmed via fallback endpoint');
          return 'online';
        }
      } catch (fallbackError) {
        console.log('❌ Fallback connectivity test also failed:', fallbackError instanceof Error ? fallbackError.message : 'Unknown error');
      }
    }

    // If internet failed, check for local LUME network
    console.log('🔍 Checking for LUME network...');
    
    // Try to detect LUME network by checking if we can resolve .local hostnames
    console.log('🔍 Testing LUME base router hostname resolution...');
    
    // First, try a simple connectivity test to lume-base.local
    try {
      // Use a very short timeout connection test - we just want to see if hostname resolves
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      
      await fetch('http://lume-base.local:80', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      console.log('✅ LUME base router found and responding');
      return 'lume';
      
    } catch (error) {
      // Even if connection fails, check if it's because hostname resolved
      if (error instanceof Error) {
        if (error.name === 'AbortError' || 
            error.message.includes('Failed to fetch') || 
            error.message.includes('fetch') ||
            error.message.includes('NetworkError')) {
          console.log('🔧 LUME network detected - lume-base.local hostname resolves');
          return 'lume';
        }
      }
      console.log('❌ lume-base.local not reachable:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Fallback: try other LUME devices
    console.log('🔍 Checking for other LUME devices...');
    const lumeTests = [
      'http://lume-controller.local/status',
      'http://lume-lighting.local/status',
    ];
    
    for (const testUrl of lumeTests) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(testUrl, {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log('🔧 LUME network detected via:', testUrl);
          return 'lume';
        }
      } catch {
        // Continue to next test
      }
    }
    
    console.log('🌐 No LUME network connectivity detected');
    return 'offline';
  }

  // Get platform-specific download URL
  static getPlatformDownloadUrl(versionInfo: VersionInfo): string | null {
    const platform = this.getPlatform();
    
    // Try platform-specific downloads first
    if (versionInfo.downloads) {
      switch (platform) {
        case 'darwin':
          return versionInfo.downloads.macos || null;
        case 'windows':
          return versionInfo.downloads.windows || null;
        case 'linux':
          return versionInfo.downloads.linux || null;
        case 'web':
          return versionInfo.downloads.web || null;
      }
    }
    
    // Fallback to generic downloadUrl
    return versionInfo.downloadUrl || null;
  }

  // Download and install update (Tauri-specific)
  static async downloadUpdate(versionInfo: VersionInfo): Promise<boolean> {
    const downloadUrl = this.getPlatformDownloadUrl(versionInfo);
    if (!downloadUrl) {
      console.error('❌ No download URL available for current platform');
      return false;
    }
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