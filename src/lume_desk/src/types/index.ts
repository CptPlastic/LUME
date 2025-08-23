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
  maxAreas: number; // Usually 99
  channelsPerArea: number; // Usually 12
  channels: ChannelStatus[];
  safetyStatus: SafetyStatus;
}

export interface LightingController extends ESP32Controller {
  type: 'lights';
  currentArea: number;
  maxAreas: number; // Usually 99
  relaysPerArea: number; // Usually 12
  relays: RelayStatus[];
  currentEffect: LightingEffect | null;
  brightness: number; // 0-255
}

export interface RelayStatus {
  id: number;
  area: number; // Which area this relay belongs to
  name: string;
  status: 'on' | 'off' | 'error';
  lastChanged?: Date;
}

export interface LightingEffect {
  type: 'solid' | 'strobe' | 'chase' | 'fade' | 'random';
  name: string;
  running: boolean;
  interval?: number; // milliseconds
  startTime?: Date;
}

export interface ChannelStatus {
  id: number;
  area: number; // Which area this channel belongs to
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
  // LUME Controller API response structure (both firework and lighting)
  // Firework controller fields
  softwareArea?: number;
  hardwareArea?: number;
  maxAreas: number;
  showRunning?: boolean;
  showName?: string;
  uptime: number;
  wifiRSSI: number;
  
  // Lighting controller fields
  area?: number;
  effectRunning?: boolean;
  effectName?: string;
  brightness?: number;
  relayStates?: boolean[];
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

// Lighting Effect Type System (similar to FireworkType)
export interface LightingEffectType {
  id: string;
  name: string;
  category: 'mood' | 'party' | 'strobe' | 'chase' | 'fade' | 'pattern' | 'special';
  duration: number; // milliseconds - how long the effect runs
  intensity: 'low' | 'medium' | 'high' | 'extreme';
  effectType: 'solid' | 'strobe' | 'chase' | 'fade' | 'random' | 'custom';
  colors: string[]; // hex colors or names for visual representation
  interval?: number; // milliseconds - for effects like strobe/chase
  pattern?: number[]; // relay pattern for custom effects [1,2,3] = activate relays 1,2,3
  description?: string;
  tags?: string[]; // for searching/filtering
  relayCount?: number; // how many relays this effect uses (1-12)
}

// Enhanced Show sequencing types to support lighting
export interface Show {
  id: string;
  name: string;
  description: string;
  sequences: ShowSequence[];
  lightingSequences: LightingShowSequence[]; // New lighting sequences
  audio?: AudioTrack; // Optional audio track for synchronization
  createdAt: Date;
  modifiedAt: Date;
  version: string; // for compatibility
  metadata: {
    author?: string;
    bpm?: number;
    songName?: string;
    artist?: string;
    tags?: string[];
    duration?: number; // Total show duration in milliseconds
  };
}

export interface AudioTrack {
  id: string;
  name: string;
  file?: File; // For uploaded files
  url?: string; // For linked audio (URL/streaming)
  duration: number; // Duration in milliseconds
  format: string; // 'mp3', 'wav', 'ogg', etc.
  size?: number; // File size in bytes
  uploadedAt: Date;
  waveformData?: number[]; // Pre-computed waveform for visualization
}

export interface LightingShowSequence {
  id: string;
  timestamp: number; // milliseconds from start
  lightingEffectTypeId: string;
  lightingEffectType?: LightingEffectType; // Populated for display
  controllerId: string;
  area: number; // Which area on the controller (1-99)
  relays: number[]; // Which relays to use [1,2,3] or [] for all
  duration: number; // How long to run this effect (can override effectType duration)
  intensity?: number; // Override default intensity (0-100)
  repeat: number; // How many times to repeat
}

// Enhanced Show sequence to include lighting
export interface ShowSequence {
  id: string;
  timestamp: number; // milliseconds from start
  type: 'firework' | 'lighting'; // New type field
  
  // Firework fields (when type === 'firework')
  fireworkTypeId?: string;
  fireworkType?: FireworkType; // Populated for display
  channel?: number; // Which channel in that area (1-12)
  delay?: number; // Additional delay before firing
  
  // Lighting fields (when type === 'lighting')
  lightingEffectTypeId?: string;
  lightingEffectType?: LightingEffectType; // Populated for display
  relays?: number[]; // Which relays to use
  duration?: number; // How long to run
  intensity?: number; // Override intensity
  
  // Common fields
  controllerId: string;
  area: number; // Which area on the controller (1-99)
  repeat: number; // How many times to repeat
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

// Enhanced Show File Format for Import/Export with audio support
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
  show: Show;
  fireworkTypes: FireworkType[];
  lightingEffectTypes?: LightingEffectType[]; // Enhanced to support lighting effects
  controllers: {
    id: string;
    name: string;
    type: 'firework' | 'lights';
    channels?: number;
  }[];
  audioData?: {
    id: string;
    name: string;
    type: string;
    base64: string;
    size: number;
    duration: number;
  };
}

// Store types
export interface LumeStore {
  controllers: ESP32Controller[];
  activeController: string | null;
  currentShow: Show | null;
  fireworkTypes: FireworkType[];
  lightingEffectTypes: LightingEffectType[]; // New lighting effect types
  isPlaying: boolean;
  connectionStatus: 'scanning' | 'connected' | 'disconnected';
  
  // Actions
  addController: (controller: ESP32Controller) => void;
  removeController: (id: string) => void;
  setActiveController: (id: string) => void;
  updateControllerStatus: (id: string, status: Partial<ESP32Controller>) => void;
  
  // Show management
  loadShow: (show: Show) => void;
  saveShow: (show: Show) => void;
  playShow: () => void;
  stopShow: () => void;
  createShow: (name: string, description: string) => void;
  deleteShow: (id: string) => void;
  
  // Show sequence management
  addShowSequence: (sequence: Omit<ShowSequence, 'id'>) => void;
  removeShowSequence: (sequenceId: string) => void;
  updateShowSequence: (sequenceId: string, updates: Partial<ShowSequence>) => void;
  
  // Controller area management
  fireChannel: (controllerId: string, area: number, channel: number) => Promise<boolean>;
  setControllerArea: (controllerId: string, area: number) => Promise<boolean>;
  syncControllerArea: (controllerId: string, area: number) => Promise<boolean>;
  
  // Firework type management
  addFireworkType: (fireworkType: FireworkType) => void;
  updateFireworkType: (id: string, updates: Partial<FireworkType>) => void;
  removeFireworkType: (id: string) => void;
  
  // Lighting effect type management
  addLightingEffectType: (effectType: LightingEffectType) => void;
  updateLightingEffectType: (id: string, updates: Partial<LightingEffectType>) => void;
  removeLightingEffectType: (id: string) => void;
  
  // Enhanced Import/Export with async support
  exportShow: (showId: string) => Promise<ShowFile>;
  importShow: (showFile: ShowFile) => Promise<boolean>;
  downloadShow: (showId?: string) => Promise<void>;
}
