import { invoke } from '@tauri-apps/api/core';
import { sendNotification } from '@tauri-apps/plugin-notification';
import { useState, useEffect } from 'react';

// Type definitions matching Rust structs
export interface ShowStatus {
  is_running: boolean;
  current_time: number;
  total_duration: number;
  active_effects: string[];
}

export interface SystemInfo {
  app_version: string;
  platform: string;
  architecture: string;
  memory_usage: number;
}

// Show control API
export class TauriShowAPI {
  static async startShow(showData: string): Promise<string> {
    return await invoke('start_show', { showData });
  }

  static async stopShow(): Promise<void> {
    return await invoke('stop_show');
  }

  static async getShowStatus(): Promise<ShowStatus> {
    return await invoke('get_show_status');
  }

  static async validateShowData(showData: string): Promise<Record<string, boolean>> {
    return await invoke('validate_show_data', { showData });
  }

  static async exportShow(showData: string, format: string): Promise<string> {
    return await invoke('export_show', { showData, format });
  }
}

// Hardware control API
export class TauriHardwareAPI {
  static async scanControllers(): Promise<string[]> {
    return await invoke('scan_controllers');
  }

  static async testControllerConnection(address: string): Promise<boolean> {
    return await invoke('test_controller_connection', { address });
  }
}

// System information API
export class TauriSystemAPI {
  static async getSystemInfo(): Promise<SystemInfo> {
    return await invoke('get_system_info');
  }

  static async getPerformanceStats(): Promise<Record<string, number>> {
    return await invoke('get_performance_stats');
  }

  static async sendNotification(title: string, message: string): Promise<void> {
    // Use both Tauri command and native notification
    try {
      await sendNotification({ title, body: message });
    } catch (error) {
      // Fallback to Tauri command
      await invoke('send_system_notification', { title, message });
    }
  }
}

// Unified API class
export class TauriAPI {
  static show = TauriShowAPI;
  static hardware = TauriHardwareAPI;
  static system = TauriSystemAPI;

  // Utility methods
  static async isRunningInTauri(): Promise<boolean> {
    try {
      await invoke('get_system_info');
      return true;
    } catch {
      return false;
    }
  }
}

// React hook for Tauri features
export const useTauriFeatures = () => {
  const [isNative, setIsNative] = useState(false);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    const checkTauri = async () => {
      const native = await TauriAPI.isRunningInTauri();
      setIsNative(native);
      
      if (native) {
        try {
          const info = await TauriAPI.system.getSystemInfo();
          setSystemInfo(info);
        } catch (error) {
          console.error('Failed to get system info:', error);
        }
      }
    };

    checkTauri();
  }, []);

  return {
    isNative,
    systemInfo,
    showControls: isNative ? TauriAPI.show : null,
    hardwareControls: isNative ? TauriAPI.hardware : null,
    systemControls: isNative ? TauriAPI.system : null,
  };
};