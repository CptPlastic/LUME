import { getAppVersion, getBaseVersion } from '../utils/version';

// Simple fetch that works in both environments
async function hybridFetch(url: string, options?: RequestInit): Promise<Response> {
  // Just use browser fetch - it works perfectly in both web and Tauri
  const response = await fetch(url, options);
  return response;
}

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
  platforms?: {
    [key: string]: {
      signature?: string;
      url: string;
    };
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
  private static readonly UPDATE_CHECK_URL = import.meta.env.VITE_UPDATE_URL || 'https://api.p7n.co/tauri';
  private static readonly CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly STORAGE_KEY = 'lume-version-check';

  // Check for updates from remote server
  static async checkForUpdates(): Promise<UpdateStatus> {
    const currentVersion = getBaseVersion(); // Use semantic version for comparison
    const displayVersion = getAppVersion();  // Keep git hash for display

    try {
      const response = await hybridFetch(this.UPDATE_CHECK_URL, {
        method: 'GET',
        headers: {
          'X-Current-Version': currentVersion,
          'X-Platform': this.getPlatform()
          // Removed User-Agent header due to CORS restrictions
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse = await response.json();
      
      // Map API response to our VersionInfo interface
      const versionInfo: VersionInfo = {
        version: apiResponse.version,
        releaseDate: apiResponse.pub_date || apiResponse.releaseDate || new Date().toISOString(),
        changelog: apiResponse.notes || apiResponse.changelog || 'No changelog available',
        downloadUrl: apiResponse.downloadUrl,
        downloads: apiResponse.downloads,
        platforms: apiResponse.platforms,
        critical: apiResponse.critical || false
      };
      
      const compareResult = this.compareVersions(currentVersion, versionInfo.version);
      const hasUpdate = compareResult < 0;

      const updateStatus: UpdateStatus = {
        hasUpdate,
        currentVersion: currentVersion, // Show base version in UI (e.g., "1.3.0")
        latestVersion: versionInfo.version,
        versionInfo,
      };

      // Store the check result with timestamp
      this.storeCheckResult(updateStatus);

      return updateStatus;

    } catch (error) {
      // Try to return cached result if network fails
      const cached = this.getCachedCheckResult();
      if (cached && this.isCacheValid(cached.timestamp)) {
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
      return 'offline';
    }
    
    // Check browser's navigator.onLine first (basic connectivity check)
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'offline';
    }

    // Test connectivity using your API endpoint first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await hybridFetch('https://api.p7n.co/ping', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        // Even when online, check if we're also on LUME network for additional info
        try {
          // Try connecting to lume-base.local on HTTP port (not SSH port 22 which is restricted)
          await hybridFetch('http://lume-base.local:80', {
            method: 'HEAD',
            signal: AbortSignal.timeout(500),
            cache: 'no-cache'
          });
        } catch (error) {
          // Any network-level response (even connection refused) means host is reachable
          if (error instanceof Error && (error.message.includes('Failed to fetch') || error.name === 'TypeError')) {
            // Detected on LUME network while online
          }
        }
        
        return 'online';
      }
    } catch (error) {
      // Fallback to a reliable test endpoint if your API fails
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await hybridFetch('https://httpbin.org/status/200', {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          return 'online';
        }
      } catch (fallbackError) {
        // Fallback connectivity test also failed
      }
    }

    // If internet failed, check for local LUME network    
    // Try to detect LUME network by checking if we can resolve .local hostnames
    
    // First, try a simple connectivity test to lume-base.local
    try {
      // Use a very short timeout connection test - we just want to see if hostname resolves
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      
      await hybridFetch('http://lume-base.local:80', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      return 'lume';
      
    } catch (error) {
      // Even if connection fails, check if it's because hostname resolved
      if (error instanceof Error) {
        if (error.name === 'AbortError' || 
            error.message.includes('Failed to fetch') || 
            error.message.includes('fetch') ||
            error.message.includes('NetworkError')) {
          return 'lume';
        }
      }
    }
    
    // Fallback: try other LUME devices
    const lumeTests = [
      'http://lume-controller.local/status',
      'http://lume-lighting.local/status',
    ];
    
    for (const testUrl of lumeTests) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await hybridFetch(testUrl, {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          return 'lume';
        }
      } catch {
        // Continue to next test
      }
    }
    
    return 'offline';
  }

  // Get platform-specific download URL
  static getPlatformDownloadUrl(versionInfo: VersionInfo): string | null {
    const platform = this.getPlatform();
    
    // Try platform-specific downloads first
    let selectedUrl: string | null = null;
    
    // Handle Tauri platforms format
    if (versionInfo.platforms) {
      const arch = 'x86_64'; // Default to x86_64, could detect actual arch later
      switch (platform) {
        case 'darwin':
          selectedUrl = versionInfo.platforms[`darwin-${arch}`]?.url || versionInfo.platforms['darwin-aarch64']?.url || null;
          break;
        case 'windows':
          selectedUrl = versionInfo.platforms[`windows-${arch}`]?.url || null;
          break;
        case 'linux':
          selectedUrl = versionInfo.platforms[`linux-${arch}`]?.url || null;
          break;
      }
    } 
    // Handle legacy downloads format
    else if (versionInfo.downloads) {
      switch (platform) {
        case 'darwin':
          selectedUrl = versionInfo.downloads.macos || null;
          break;
        case 'windows':
          selectedUrl = versionInfo.downloads.windows || null;
          break;
        case 'linux':
          selectedUrl = versionInfo.downloads.linux || null;
          break;
        case 'web':
          selectedUrl = versionInfo.downloads.web || null;
          break;
      }
    }
    
    if (selectedUrl) {
      return selectedUrl;
    }
    
    // Fallback to generic downloadUrl
    const fallbackUrl = versionInfo.downloadUrl || null;
    return fallbackUrl;
  }

  // Download and install update (Tauri-specific)
  static async downloadUpdate(versionInfo: VersionInfo): Promise<boolean> {
    const downloadUrl = this.getPlatformDownloadUrl(versionInfo);
    if (!downloadUrl) {
      console.error('❌ No download URL available for current platform');
      return false;
    }
    console.log(`📥 Starting download from: ${downloadUrl}`);
    console.log(`🔍 URL validation:`, {
      url: downloadUrl,
      isString: typeof downloadUrl === 'string',
      length: downloadUrl.length,
      startsWithHttp: downloadUrl.startsWith('http'),
      hasSpaces: downloadUrl.includes(' '),
      encoded: encodeURI(downloadUrl)
    });
    
    try {
      // Simple approach: try shell.open with Tauri plugin
      console.log('� Attempting Tauri shell.open...');
      const { open } = await import('@tauri-apps/plugin-shell');
      await open(downloadUrl);
      console.log('✅ Download initiated through Tauri shell');
      return true;
    } catch (shellError) {
      console.log('⚠️ Tauri shell failed:', shellError);
      console.log('⚠️ Error details:', {
        name: shellError instanceof Error ? shellError.name : 'Unknown',
        message: shellError instanceof Error ? shellError.message : String(shellError),
        stack: shellError instanceof Error ? shellError.stack : 'No stack'
      });
      
      // Fallback to window.open
      console.log('🌐 Trying window.open fallback...');
      if (typeof window !== 'undefined') {
        const opened = window.open(downloadUrl, '_blank');
        if (opened) {
          console.log('✅ Download opened with window.open');
          return true;
        } else {
          console.log('❌ window.open failed (popup blocked)');
        }
      }
      
      console.log('❌ All download methods failed');
      return false;
    }
  }

  // Auto-check for updates on startup if online
  static async autoCheckForUpdates(): Promise<UpdateStatus | null> {
    const networkMode = await this.detectNetworkMode();
    
    if (networkMode !== 'online') {
      return null;
    }

    // Check if we've checked recently
    const cached = this.getCachedCheckResult();
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.result;
    }

    return await this.checkForUpdates();
  }

  // Enable offline show building mode
  static enableOfflineMode(): void {
    localStorage.setItem('lume-offline-mode', 'true');
  }

  // Disable offline show building mode
  static disableOfflineMode(): void {
    localStorage.removeItem('lume-offline-mode');
  }

  // Check if offline mode is enabled
  static isOfflineModeEnabled(): boolean {
    return localStorage.getItem('lume-offline-mode') === 'true';
  }

  // Compare semantic versions (returns -1, 0, or 1)
  private static compareVersions(version1: string, version2: string): number {
    // Handle development version
    if (version1.includes('dev')) {
      return -1; // Dev version is always considered older
    }
    
    const v1parts = version1.split('.').map(n => {
      const parsed = parseInt(n, 10);
      return isNaN(parsed) ? 0 : parsed;
    });
    const v2parts = version2.split('.').map(n => {
      const parsed = parseInt(n, 10);
      return isNaN(parsed) ? 0 : parsed;
    });
    
    const maxLength = Math.max(v1parts.length, v2parts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;
      
      if (v1part < v2part) {
        return -1;
      }
      if (v1part > v2part) {
        return 1;
      }
    }
    
    return 0;
  }

  // Get current platform for update targeting
  private static getPlatform(): string {
    // Always try to detect OS from user agent, regardless of Tauri detection
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();
      
      // macOS detection
      if (userAgent.includes('mac') || userAgent.includes('darwin')) {
        return 'darwin';
      }
      
      // Windows detection
      if (userAgent.includes('win')) {
        return 'windows';
      }
      
      // Linux detection
      if (userAgent.includes('linux') && !userAgent.includes('android')) {
        return 'linux';
      }
    }
    
    // Also try platform API if available (deprecated but still useful fallback)
    if (typeof navigator !== 'undefined' && 'platform' in navigator) {
      const platform = (navigator.platform)?.toLowerCase();
      
      if (platform?.includes('mac')) return 'darwin';
      if (platform?.includes('win')) return 'windows';
      if (platform?.includes('linux')) return 'linux';
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
  }
}