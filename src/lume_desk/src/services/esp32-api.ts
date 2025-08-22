import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { APIResponse, SystemStatus, ESP32Controller } from '../types';

export class ESP32API {
  private readonly client: AxiosInstance;
  
  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 3000, // Match discovery timeout
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  // System information
  async getStatus(): Promise<SystemStatus> {
    const response = await this.client.get<SystemStatus>('/status');
    return response.data;
  }

  async getVersion(): Promise<{ version: string; build: string }> {
    const response = await this.client.get('/version');
    return response.data;
  }

  async getWifiInfo(): Promise<{ ssid: string; ip: string; strength: number }> {
    const response = await this.client.get('/wifi/info');
    return response.data;
  }

  // Area control
  async setArea(area: number): Promise<APIResponse> {
    const response = await this.client.post(`/area?id=${area}`);
    return response.data;
  }

  async syncArea(area: number): Promise<APIResponse> {
    const response = await this.client.post(`/sync?id=${area}`);
    return response.data;
  }

  // Channel control
  async fireChannel(channel: number): Promise<APIResponse> {
    const response = await this.client.post(`/channel?id=${channel}`);
    return response.data;
  }

  async fireMultipleChannels(channels: number[]): Promise<APIResponse> {
    const response = await this.client.post('/channels/fire', { channels });
    return response.data;
  }

  async getChannelStatus(channel: number): Promise<{ status: string; lastFired?: string }> {
    const response = await this.client.get(`/channel/${channel}/status`);
    return response.data;
  }

  async setChannelDelay(channel: number, delayMs: number): Promise<APIResponse> {
    const response = await this.client.post(`/channel/${channel}/delay`, { delay: delayMs });
    return response.data;
  }

  // Button simulation
  async pressButton(buttonName: 'AREA_UP' | 'AREA_DOWN' | 'RAPID_FIRE' | 'ALL_FIRE'): Promise<APIResponse> {
    const response = await this.client.post(`/button?name=${buttonName}`);
    return response.data;
  }

  async pressButtonTimed(buttonName: 'AREA_UP' | 'AREA_DOWN' | 'RAPID_FIRE' | 'ALL_FIRE', durationMs: number): Promise<APIResponse> {
    const response = await this.client.post(`/button/timed`, { 
      button: buttonName, 
      duration: durationMs 
    });
    return response.data;
  }

  // Safety
  async emergencyStop(): Promise<APIResponse> {
    const response = await this.client.post('/emergency/stop');
    return response.data;
  }

  // Testing
  async testAllChannels(): Promise<APIResponse> {
    const response = await this.client.post('/test/all');
    return response.data;
  }

  // Lighting Controller Methods
  // Relay control
  async setRelay(relay: number, state: 'ON' | 'OFF'): Promise<APIResponse> {
    const response = await this.client.post(`/relay?id=${relay}&state=${state}`);
    return response.data;
  }

  async toggleRelay(relay: number): Promise<APIResponse> {
    const response = await this.client.post(`/relay/toggle?id=${relay}`);
    return response.data;
  }

  async setAllRelays(state: 'ON' | 'OFF'): Promise<APIResponse> {
    const response = await this.client.post(`/all?state=${state}`);
    return response.data;
  }

  // Lighting effects
  async startEffect(type: 'SOLID' | 'STROBE' | 'CHASE' | 'FADE' | 'RANDOM', interval?: number): Promise<APIResponse> {
    const params = new URLSearchParams({ type });
    if (interval) {
      params.append('interval', interval.toString());
    }
    const response = await this.client.post(`/effect?${params.toString()}`);
    return response.data;
  }

  async stopEffect(): Promise<APIResponse> {
    const response = await this.client.post('/effect/stop');
    return response.data;
  }

  async setBrightness(brightness: number): Promise<APIResponse> {
    const response = await this.client.post(`/brightness?level=${brightness}`);
    return response.data;
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      await this.client.get('/status');
      return true;
    } catch {
      return false;
    }
  }
}

// Controller discovery service
export class ControllerDiscovery {
  private scanning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly scanInterval = 30000; // 30 seconds

  async scanForControllers(): Promise<ESP32Controller[]> {
    console.log('🔍 Starting LUME controller discovery...');
    const foundControllers: ESP32Controller[] = [];
    
    // Scan for LUME-specific .local hostnames
    const lumeHostnames = [
      'lume-controller.local', // Firework controller
      'lume-lighting.local',   // Lighting controller (matches mDNS name)
    ];
    
    console.log('🏠 Checking LUME .local hostnames:', lumeHostnames);
    const results = await Promise.allSettled(
      lumeHostnames.map((hostname: string) => this.checkSingleController(hostname))
    );
    
    results.forEach((result: PromiseSettledResult<ESP32Controller | null>, index: number) => {
      if (result.status === 'fulfilled' && result.value) {
        const hostname = lumeHostnames[index];
        foundControllers.push(result.value);
        console.log(`✅ Found LUME controller via hostname: ${hostname}`, result.value);
      } else if (result.status === 'rejected') {
        console.log(`❌ Error checking ${lumeHostnames[index]}:`, result.reason);
      } else {
        console.log(`❌ No controller found at ${lumeHostnames[index]}`);
      }
    });
    
    console.log(`🎯 LUME discovery complete. Found ${foundControllers.length} controllers:`, foundControllers);
    return foundControllers;
  }

  async checkSingleController(ip: string): Promise<ESP32Controller | null> {
    console.log(`🔍 Checking specific IP/hostname: ${ip}`);
    
    // Determine type from hostname
    let controllerType: 'firework' | 'lights' | null = null;
    if (ip.includes('lume-controller')) {
      controllerType = 'firework';
    } else if (ip.includes('lume-lighting')) {
      controllerType = 'lights';
    }
    
    if (!controllerType) {
      console.log(`❌ Unknown hostname pattern: ${ip}`);
      return null;
    }
    
    // Try to connect to the controller - only create if it actually responds
    const isConnected = await this.checkController(ip);
    
    if (!isConnected) {
      console.log(`❌ Controller at ${ip} is not responding - skipping`);
      return null;
    }
    
    return {
      id: `esp32-${ip.replace(/\./g, '-').replace('.local', '')}`,
      name: `${controllerType.toUpperCase()} Controller (${ip})`,
      type: controllerType,
      ip: ip,
      status: 'connected',
      lastSeen: new Date()
    };
  }

  private async checkController(ip: string): Promise<boolean> {
    try {
      const controller = axios.create({
        baseURL: `http://${ip}`,
        timeout: 3000,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log(`🔍 Checking controller at ${ip}...`);

      // Try to get status first (most reliable)
      try {
        await controller.get('/status');
        return true;
      } catch {
        // Try version endpoint as fallback
        try {
          await controller.get('/version');
          return true;
        } catch {
          // Try wifi/info as last resort
          try {
            await controller.get('/wifi/info');
            return true;
          } catch {
            return false;
          }
        }
      }

    } catch (error) {
      console.log(`❌ Network error checking ${ip}:`, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  startScanning(onControllersFound: (controllers: ESP32Controller[]) => void): void {
    if (this.scanning) return;
    
    this.scanning = true;
    this.intervalId = setInterval(async () => {
      const controllers = await this.scanForControllers();
      onControllersFound(controllers);
    }, this.scanInterval);
  }

  stopScanning(): void {
    this.scanning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Export singleton instance
export const controllerDiscovery = new ControllerDiscovery();
