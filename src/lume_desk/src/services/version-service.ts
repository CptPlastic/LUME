import { getAppVersion, getBaseVersion } from '../utils/version';

// Hybrid fetch: Try multiple HTTP libraries for maximum compatibility
async function hybridFetch(url: string, options?: RequestInit): Promise<Response> {
  console.log(`🔍 hybridFetch called for: ${url}`);
  
  // First, try axios if available (converts to Response-like object)
  try {
    console.log('📡 Trying axios...');
    const axios = await import('axios');
    const axiosResponse = await axios.default.get(url, {
      headers: options?.headers as Record<string, string>,
      timeout: 10000,
    });
    
    console.log('✅ axios request successful');
    
    // Convert axios response to Response-like object
    return {
      ok: axiosResponse.status >= 200 && axiosResponse.status < 300,
      status: axiosResponse.status,
      statusText: axiosResponse.statusText,
      headers: new Headers(axiosResponse.headers as Record<string, string>),
      json: async () => axiosResponse.data,
      text: async () => JSON.stringify(axiosResponse.data),
    } as Response;
  } catch (axiosError) {
    console.log('⚠️ axios failed:', axiosError);
  }
  
  // Second, try Tauri's HTTP plugin if in Tauri environment
  try {
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      console.log('🚀 Trying Tauri HTTP plugin...');
      const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
      const response = await tauriFetch(url, options);
      console.log('✅ Tauri HTTP request successful');
      return response;
    }
  } catch (tauriError) {
    console.log('⚠️ Tauri HTTP failed:', tauriError);
  }
  
  // Finally, fall back to browser's native fetch
  console.log('🌐 Using browser fetch');
  return fetch(url, options);
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
    console.log(`🔍 Checking for updates... Current version: ${currentVersion} (display: ${displayVersion})`);
    console.log(`📡 Using update URL: ${this.UPDATE_CHECK_URL}`);

    try {
      console.log('🌐 Making request to update server...');
      const response = await hybridFetch(this.UPDATE_CHECK_URL, {
        method: 'GET',
        headers: {
          'X-Current-Version': currentVersion,
          'X-Platform': this.getPlatform(),
          'User-Agent': `LUME-Controller/${currentVersion} (${this.getPlatform()})`
        }
      });

      console.log(`📨 Response status: ${response.status}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('📊 Parsing response JSON...');
      const versionInfo = await response.json() as VersionInfo;
      console.log('📦 Received version info:', versionInfo);
      
      const compareResult = this.compareVersions(currentVersion, versionInfo.version);
      const hasUpdate = compareResult < 0;
      
      console.log(`📊 Version comparison: ${currentVersion} vs ${versionInfo.version}`);
      console.log(`📊 Compare result: ${compareResult} (${compareResult < 0 ? 'UPDATE AVAILABLE' : 'UP TO DATE'})`);

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
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
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
      const response = await hybridFetch('https://api.p7n.co/ping', {
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
          await hybridFetch('http://lume-base.local:22', {  // Try SSH port as it's commonly open
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
        const response = await hybridFetch('https://httpbin.org/status/200', {
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
      
      await hybridFetch('http://lume-base.local:80', {
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
        
        const response = await hybridFetch(testUrl, {
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
    console.log(`🖥️ Detected platform: ${platform}`);
    console.log(`📦 Available downloads:`, versionInfo.downloads);
    console.log(`📦 Available platforms:`, versionInfo.platforms);
    
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
      console.log(`✅ Using platform-specific download: ${selectedUrl}`);
      return selectedUrl;
    }
    
    // Fallback to generic downloadUrl
    const fallbackUrl = versionInfo.downloadUrl || null;
    console.log(`🔄 Using fallback download URL: ${fallbackUrl}`);
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
    
    try {
      // Check if running in Tauri (multiple detection methods)
      const hasWindow = typeof window !== 'undefined';
      const hasTauriGlobal = hasWindow && '__TAURI__' in window;
      const hasTauriInvoke = hasWindow && '__TAURI_INVOKE__' in window;
      const hasTauriAPI = hasWindow && '__TAURI_INTERNALS__' in window;
      const isFileProtocol = hasWindow && window.location.protocol === 'tauri:';
      
      const isTauri = hasTauriGlobal || hasTauriInvoke || hasTauriAPI || isFileProtocol;
      
      console.log(`🔍 Tauri detection debug:`, {
        hasWindow,
        hasTauriGlobal,
        hasTauriInvoke, 
        hasTauriAPI,
        isFileProtocol,
        protocol: hasWindow ? window.location.protocol : 'no-window',
        isTauri
      });
      
      if (isTauri) {
        console.log('🚀 Using Tauri download methods...');
        // Use Tauri updater if available
        try {
          console.log('🔍 Attempting to import Tauri updater...');
          const updaterModule = await import('@tauri-apps/plugin-updater').catch((error) => {
            console.log('❌ Failed to import updater module:', error);
            return null;
          });
          
          if (updaterModule?.check) {
            console.log('✅ Tauri updater module loaded, checking for update...');
            
            try {
              const update = await updaterModule.check();
              console.log('🔍 Tauri updater check result:', update);
              
              if (update) {
                console.log('🔄 Update found via Tauri updater, starting download and install...');
                console.log('📋 Update details:', {
                  version: update.version,
                  date: update.date,
                  body: update.body
                });
                
                await update.downloadAndInstall();
                console.log('✅ Tauri updater installation complete - app will restart');
                return true;
              } else {
                console.log('ℹ️ No update available through Tauri updater, trying manual download');
              }
            } catch (checkError) {
              console.log('❌ Tauri updater check failed:', checkError);
            }
          } else {
            console.log('❌ Tauri updater check function not available');
          }
        } catch (importError) {
          console.log('⚠️ Tauri updater not available:', importError);
        }
        
        // Fallback to manual download with Tauri
        console.log('🔄 Trying Tauri shell to open download URL...');
        try {
          const { open } = await import('@tauri-apps/plugin-shell').catch(() => ({ open: null }));
          if (open) {
            console.log('✅ Tauri shell available, opening download URL...');
            await open(downloadUrl);
            console.log('✅ Download initiated through Tauri shell');
            return true;
          } else {
            console.log('❌ Tauri shell open function not available');
          }
        } catch (error) {
          console.log('⚠️ Tauri shell error:', error);
          console.log('⚠️ Falling back to browser download');
        }
      } else {
        console.log('🌐 Not in Tauri environment, using browser download...');
      }
      
      // Browser environment or Tauri fallback - try direct download
      if (typeof window !== 'undefined') {
        console.log('🌐 Attempting direct download...');
        
        try {
          // Try to create a direct download link
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = downloadUrl.split('/').pop() || 'update.dmg';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          console.log('✅ Direct download link clicked');
          return true;
        } catch (directError) {
          console.log('⚠️ Direct download failed, trying window.open:', directError);
          
          // Fallback to window.open
          const result = window.open(downloadUrl, '_blank');
          if (result) {
            console.log('✅ Browser download initiated via window.open');
            return true;
          } else {
            console.log('❌ window.open was blocked by popup blocker');
            
            // Final fallback - try to navigate to the URL
            try {
              window.location.href = downloadUrl;
              console.log('✅ Navigating to download URL');
              return true;
            } catch (navError) {
              console.log('❌ Navigation fallback failed:', navError);
            }
          }
        }
      } else {
        console.log('❌ No window object available');
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
    console.log(`🔍 Comparing versions: "${version1}" vs "${version2}"`);
    
    // Handle development version
    if (version1.includes('dev')) {
      console.log('🔧 Development version detected, treating as older than release');
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
    
    console.log(`🔍 Parsed versions: [${v1parts.join(',')}] vs [${v2parts.join(',')}]`);
    
    const maxLength = Math.max(v1parts.length, v2parts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;
      
      if (v1part < v2part) {
        console.log(`🔍 Part ${i}: ${v1part} < ${v2part} = UPDATE NEEDED`);
        return -1;
      }
      if (v1part > v2part) {
        console.log(`🔍 Part ${i}: ${v1part} > ${v2part} = CURRENT IS NEWER`);
        return 1;
      }
    }
    
    console.log(`🔍 Versions are equal`);
    return 0;
  }

  // Get current platform for update targeting
  private static getPlatform(): string {
    const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
    console.log(`🔍 Platform detection - isTauri: ${isTauri}`);
    
    // Always try to detect OS from user agent, regardless of Tauri detection
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();
      console.log(`🔍 User agent: ${userAgent}`);
      
      // macOS detection
      if (userAgent.includes('mac') || userAgent.includes('darwin')) {
        console.log(`✅ Detected macOS`);
        return 'darwin';
      }
      
      // Windows detection
      if (userAgent.includes('win')) {
        console.log(`✅ Detected Windows`);
        return 'windows';
      }
      
      // Linux detection
      if (userAgent.includes('linux') && !userAgent.includes('android')) {
        console.log(`✅ Detected Linux`);
        return 'linux';
      }
    }
    
    // Also try platform API if available (deprecated but still useful fallback)
    if (typeof navigator !== 'undefined' && 'platform' in navigator) {
      const platform = (navigator.platform)?.toLowerCase();
      console.log(`🔍 Navigator platform: ${platform}`);
      
      if (platform && platform.includes('mac')) return 'darwin';
      if (platform && platform.includes('win')) return 'windows';
      if (platform && platform.includes('linux')) return 'linux';
    }
    
    console.log(`⚠️ Falling back to web platform`);
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