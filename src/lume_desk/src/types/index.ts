// LUME ESP32 API Types
export interface ESP32Controller {
  id: string;
  name: string;
  type: 'firework' | 'lights';
  ip: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSeen: Date;
}

export interface FireworkController extends ESP32Controller {
  type: 'firework';
  currentArea: number;
  channels: ChannelStatus[];
  safetyStatus: SafetyStatus;
}

export interface ChannelStatus {
  id: number;
  name: string;
  status: 'ready' | 'fired' | 'error';
  lastFired?: Date;
}

export interface SafetyStatus {
  wifiConnected: boolean;
  interferenceProtection: boolean;
  emergencyStop: boolean;
  hardwareSafe: boolean;
}

export interface SystemStatus {
  // LUME Firework Controller API response structure
  softwareArea: number;
  hardwareArea: number;
  maxAreas: number;
  showRunning: boolean;
  showName: string;
  uptime: number;
  wifiRSSI: number;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// Firework Type System
export interface FireworkType {
  id: string;
  name: string;
  category: 'shell' | 'cake' | 'fountain' | 'rocket' | 'mine' | 'roman_candle' | 'sparkler' | 'wheel';
  duration: number; // milliseconds
  intensity: 'low' | 'medium' | 'high' | 'extreme';
  colors: string[]; // hex colors or names
  effects: string[]; // 'crackle', 'whistle', 'strobe', etc.
  safetyDelay: number; // minimum ms between this and next firework
  description?: string;
  tags?: string[]; // for searching/filtering
  channelCount?: number; // for multi-channel fireworks
}

// Enhanced Show sequencing types
export interface ShowSequence {
  id: string;
  name: string;
  description: string;
  duration: number;
  steps: SequenceStep[];
  controllers: string[]; // Controller IDs
  fireworkTypes: FireworkType[]; // Used firework types in this show
  createdAt: Date;
  modifiedAt: Date;
  version: string; // for compatibility
  metadata: {
    author?: string;
    bpm?: number;
    songName?: string;
    artist?: string;
    tags?: string[];
  };
}

export interface SequenceStep {
  id: string;
  time: number; // milliseconds from start
  controller: string;
  action: {
    type: 'fire_channel' | 'fire_multiple' | 'change_area' | 'delay' | 'fire_firework';
    data: Record<string, unknown>;
  };
  fireworkType?: string; // FireworkType ID if action is fire_firework
  description: string;
  safetyChecked?: boolean;
}

// Show File Format for Import/Export
export interface ShowFile {
  version: string;
  format: 'lume-show-v1';
  metadata: {
    name: string;
    description: string;
    author?: string;
    created: string; // ISO date string
    modified: string;
    tags?: string[];
  };
  show: ShowSequence;
  fireworkTypes: FireworkType[];
  controllers: {
    id: string;
    name: string;
    type: 'firework' | 'lights';
    channels?: number;
  }[];
}

// Store types
export interface LumeStore {
  controllers: ESP32Controller[];
  activeController: string | null;
  currentShow: ShowSequence | null;
  fireworkTypes: FireworkType[];
  isPlaying: boolean;
  connectionStatus: 'scanning' | 'connected' | 'disconnected';
  
  // Actions
  addController: (controller: ESP32Controller) => void;
  removeController: (id: string) => void;
  setActiveController: (id: string) => void;
  updateControllerStatus: (id: string, status: Partial<ESP32Controller>) => void;
  
  // Show management
  loadShow: (show: ShowSequence) => void;
  saveShow: (show: ShowSequence) => void;
  playShow: () => void;
  stopShow: () => void;
  
  // Firework type management
  addFireworkType: (fireworkType: FireworkType) => void;
  updateFireworkType: (id: string, updates: Partial<FireworkType>) => void;
  removeFireworkType: (id: string) => void;
  
  // Import/Export
  exportShow: (showId: string) => ShowFile;
  importShow: (showFile: ShowFile) => boolean;
}
