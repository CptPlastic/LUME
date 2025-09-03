import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ESP32Controller, Show, ShowSequence, LumeStore, FireworkType, ShowFile, LightingEffectType, AudioTrack, SystemStatus } from '../types';
import { ESP32API, controllerDiscovery } from '../services/esp32-api';
import { FireworkService } from '../services/firework-service';
import { LightingEffectService } from '../services/lighting-effect-service';
import { audioStorageService } from '../services/audio-storage';
import { ShowService } from '../services/show-service';

interface LumeStoreImpl extends LumeStore {
  // Additional internal state
  apis: Map<string, ESP32API>;
  lastScanTime: Date | null;
  showTimeouts: NodeJS.Timeout[];
  currentPlaybackTime: number; // Current playback position in milliseconds
  currentAudio: HTMLAudioElement | null; // Current audio element for playback
  statusRefreshInterval: NodeJS.Timeout | null; // For periodic status checking
  
  // Enhanced controller actions
  scanForControllers: () => Promise<void>;
  addManualController: (ip: string, type?: 'firework' | 'lights') => Promise<boolean>;
  connectToController: (id: string) => Promise<boolean>;
  disconnectFromController: (id: string) => void;
  fireChannel: (controllerId: string, area: number, channel: number) => Promise<boolean>;
  setControllerArea: (controllerId: string, area: number) => Promise<boolean>;
  syncControllerArea: (controllerId: string, area: number) => Promise<boolean>;
  testAllChannels: (controllerId: string) => Promise<boolean>;
  emergencyStopAll: () => Promise<void>;
  
  // Lighting controller actions
  toggleRelay: (controllerId: string, relay: number) => Promise<boolean>;
  setAllRelays: (controllerId: string, state: 'ON' | 'OFF') => Promise<boolean>;
  startLightingEffect: (controllerId: string, effect: 'SOLID' | 'STROBE' | 'CHASE' | 'WAVE' | 'RANDOM', interval?: number) => Promise<boolean>;
  startSelectiveLightingEffect: (controllerId: string, effect: 'SOLID' | 'STROBE' | 'CHASE' | 'WAVE' | 'RANDOM', relays: number[], interval?: number) => Promise<boolean>;
  stopLightingEffect: (controllerId: string) => Promise<boolean>;
  getLightingStatus: (controllerId: string) => Promise<SystemStatus | Record<string, unknown>>;
  
  // Show management
  createShow: (name: string, description: string) => void;
  deleteShow: (id: string) => void;
  
  // Audio and timeline management
  setShowAudio: (audioTrack: AudioTrack) => Promise<void>;
  removeShowAudio: () => void;
  moveShowAudio: (newStartOffset: number) => void;
  restoreShowAudio: () => Promise<void>;
  moveSequence: (sequenceId: string, newTimestamp: number) => void;
  seekTo: (timestamp: number) => void;
  
  // Status refresh management
  startStatusRefresh: () => void;
  stopStatusRefresh: () => void;
  refreshControllerStatus: () => Promise<void>;
}

export const useLumeStore = create<LumeStoreImpl>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        controllers: [],
        activeController: null,
        currentShow: null,
        fireworkTypes: FireworkService.getDefaultFireworkTypes(),
        lightingEffectTypes: LightingEffectService.getDefaultLightingEffectTypes(),
        isPlaying: false,
        connectionStatus: 'disconnected',
        systemArmed: false, // Default to DISARMED for safety
        apis: new Map(),
        lastScanTime: null,
        showTimeouts: [],
        currentPlaybackTime: 0,
        currentAudio: null,
        statusRefreshInterval: null,

        // Basic controller management
        addController: (controller: ESP32Controller) => {
          set((state) => ({
            controllers: [...state.controllers.filter(c => c.id !== controller.id), controller],
            apis: new Map(state.apis).set(controller.id, new ESP32API(`http://${controller.ip}`))
          }));
        },

        removeController: (id: string) => {
          set((state) => {
            const newApis = new Map(state.apis);
            newApis.delete(id);
            return {
              controllers: state.controllers.filter(c => c.id !== id),
              activeController: state.activeController === id ? null : state.activeController,
              apis: newApis
            };
          });
        },

        setActiveController: (id: string) => {
          set({ activeController: id });
        },

        updateControllerStatus: (id: string, updates: Partial<ESP32Controller>) => {
          set((state) => ({
            controllers: state.controllers.map(c => 
              c.id === id ? { ...c, ...updates, lastSeen: new Date() } : c
            )
          }));
        },

  // Enhanced controller actions
  scanForControllers: async () => {
    set({ connectionStatus: 'scanning' });
    
    try {
      const discoveredControllers = await controllerDiscovery.scanForControllers();
      
      // Replace all controllers with discovered ones
      // This removes old controllers that are no longer found
      const newApis = new Map();
      discoveredControllers.forEach(controller => {
        newApis.set(controller.id, new ESP32API(`http://${controller.ip}`));
      });
      
      set({
        controllers: discoveredControllers,
        apis: newApis,
        connectionStatus: discoveredControllers.length > 0 ? 'connected' : 'disconnected',
        lastScanTime: new Date()
      });
    } catch (error) {
      console.error('Failed to scan for controllers:', error);
      set({ connectionStatus: 'disconnected' });
    }
  },

  addManualController: async (ip: string, type?: 'firework' | 'lights'): Promise<boolean> => {
    console.log(`🔍 Adding manual controller at ${ip}`);
    try {
      // First try to detect the controller
      const discoveredController = await controllerDiscovery.checkSingleController(ip);
      
      if (discoveredController) {
        get().addController(discoveredController);
        return true;
      } else if (type) {
        // If detection failed but user specified type, add anyway
        const manualController: ESP32Controller = {
          id: `manual-${ip.replace(/\./g, '-')}`,
          name: `Manual ${type.toUpperCase()} Controller (${ip})`,
          type,
          ip,
          status: 'disconnected',
          lastSeen: new Date()
        };
        get().addController(manualController);
        
        // Try to connect to verify
        const connected = await get().connectToController(manualController.id);
        if (connected) {
          get().updateControllerStatus(manualController.id, { status: 'connected' });
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Failed to add manual controller ${ip}:`, error);
      return false;
    }
  },        connectToController: async (id: string): Promise<boolean> => {
          const { apis, updateControllerStatus } = get();
          const api = apis.get(id);
          
          if (!api) return false;
          
          try {
            const isConnected = await api.ping();
            updateControllerStatus(id, { 
              status: isConnected ? 'connected' : 'disconnected' 
            });
            return isConnected;
          } catch {
            updateControllerStatus(id, { status: 'error' });
            return false;
          }
        },

        disconnectFromController: (id: string) => {
          get().updateControllerStatus(id, { status: 'disconnected' });
        },

        fireChannel: async (controllerId: string, area: number, channel: number): Promise<boolean> => {
          const { apis, systemArmed } = get();
          
          // Check if system is armed before firing
          if (!systemArmed) {
            console.warn('🚫 DISARMED: Cannot fire fireworks when system is DISARMED');
            return false;
          }
          
          const api = apis.get(controllerId);
          
          if (!api) return false;
          
          try {
            // First ensure we're on the correct area
            await api.setArea(area);
            await api.syncArea(area);
            
            // Then fire the channel
            console.log(`🎆 ARMED: Firing area ${area} channel ${channel}`);
            const result = await api.fireChannel(channel);
            return result.success;
          } catch (error) {
            console.error(`Failed to fire area ${area} channel ${channel} on controller ${controllerId}:`, error);
            // Only mark as disconnected on network timeout/connection errors
            if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('ECONNABORTED'))) {
              get().updateControllerStatus(controllerId, { status: 'disconnected' });
            }
            return false;
          }
        },

        setControllerArea: async (controllerId: string, area: number): Promise<boolean> => {
          const { apis } = get();
          const api = apis.get(controllerId);
          
          if (!api) return false;
          
          try {
            const result = await api.setArea(area);
            return result.success;
          } catch (error) {
            console.error(`Failed to set area ${area} on controller ${controllerId}:`, error);
            if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('ECONNABORTED'))) {
              get().updateControllerStatus(controllerId, { status: 'disconnected' });
            }
            return false;
          }
        },

        syncControllerArea: async (controllerId: string, area: number): Promise<boolean> => {
          const { apis } = get();
          const api = apis.get(controllerId);
          
          if (!api) return false;
          
          try {
            const result = await api.syncArea(area);
            return result.success;
          } catch (error) {
            console.error(`Failed to sync area ${area} on controller ${controllerId}:`, error);
            if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('ECONNABORTED'))) {
              get().updateControllerStatus(controllerId, { status: 'disconnected' });
            }
            return false;
          }
        },

        testAllChannels: async (controllerId: string): Promise<boolean> => {
          const { apis, systemArmed } = get();
          
          // Check if system is armed before testing
          if (!systemArmed) {
            console.warn('🚫 DISARMED: Cannot test firework channels when system is DISARMED');
            return false;
          }
          
          const api = apis.get(controllerId);
          
          if (!api) return false;
          
          try {
            console.log(`📝 ARMED: Testing all channels on controller ${controllerId}`);
            const result = await api.testAllChannels();
            return result.success;
          } catch (error) {
            console.error(`Failed to test all channels on controller ${controllerId}:`, error);
            // Only mark as disconnected on network timeout/connection errors
            if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('ECONNABORTED'))) {
              get().updateControllerStatus(controllerId, { status: 'disconnected' });
            }
            return false;
          }
        },

        emergencyStopAll: async () => {
          const { apis, controllers, updateControllerStatus } = get();
          
          const stopPromises = controllers.map(async (controller) => {
            const api = apis.get(controller.id);
            if (api) {
              try {
                await api.emergencyStop();
              } catch (error) {
                console.error(`Emergency stop failed for controller ${controller.id}:`, error);
                // Mark controller as disconnected on network errors
                updateControllerStatus(controller.id, { status: 'disconnected' });
              }
            }
          });

          await Promise.all(stopPromises);
          set({ isPlaying: false });
        },

        // Lighting controller actions
        toggleRelay: async (controllerId: string, relay: number): Promise<boolean> => {
          const { apis } = get();
          const api = apis.get(controllerId);
          
          if (!api) return false;
          
          try {
            const result = await api.toggleRelay(relay);
            return result.success;
          } catch (error) {
            console.error(`Failed to toggle relay ${relay} on controller ${controllerId}:`, error);
            if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('ECONNABORTED'))) {
              get().updateControllerStatus(controllerId, { status: 'disconnected' });
            }
            return false;
          }
        },

        setAllRelays: async (controllerId: string, state: 'ON' | 'OFF'): Promise<boolean> => {
          const { apis } = get();
          const api = apis.get(controllerId);
          
          if (!api) return false;
          
          try {
            const result = await api.setAllRelays(state);
            return result.success;
          } catch (error) {
            console.error(`Failed to set all relays ${state} on controller ${controllerId}:`, error);
            if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('ECONNABORTED'))) {
              get().updateControllerStatus(controllerId, { status: 'disconnected' });
            }
            return false;
          }
        },

        startLightingEffect: async (controllerId: string, effect: 'SOLID' | 'STROBE' | 'CHASE' | 'WAVE' | 'RANDOM', interval?: number): Promise<boolean> => {
          const { apis } = get();
          const api = apis.get(controllerId);
          
          if (!api) return false;
          
          try {
            const result = await api.startEffect(effect, interval);
            return result.success;
          } catch (error) {
            console.error(`Failed to start effect ${effect} on controller ${controllerId}:`, error);
            if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('ECONNABORTED'))) {
              get().updateControllerStatus(controllerId, { status: 'disconnected' });
            }
            return false;
          }
        },

        startSelectiveLightingEffect: async (controllerId: string, effect: 'SOLID' | 'STROBE' | 'CHASE' | 'WAVE' | 'RANDOM', relays: number[], interval?: number): Promise<boolean> => {
          const { apis } = get();
          const api = apis.get(controllerId);
          
          if (!api) return false;
          
          try {
            // Use manual approach like LightingEffectManager (more reliable than selective endpoint)
            console.log('🔘 Starting selective lighting effect using manual approach');
            console.log('   📍 Effect:', effect);
            console.log('   📍 Target Relays:', relays);
            console.log('   📍 Controller:', controllerId);
            
            // Step 1: Turn off all relays
            await api.setAllRelays('OFF');
            
            // Step 2: Turn on target relays
            for (const relay of relays) {
              await api.setRelay(relay, 'ON');
            }
            
            // Step 3: Start regular effect (which respects currently ON relays)
            const result = await api.startEffect(effect, interval);
            return result.success;
          } catch (error) {
            console.error(`Failed to start selective effect ${effect} on relays ${relays.join(',')} for controller ${controllerId}:`, error);
            if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('ECONNABORTED'))) {
              get().updateControllerStatus(controllerId, { status: 'disconnected' });
            }
            return false;
          }
        },

        stopLightingEffect: async (controllerId: string): Promise<boolean> => {
          const { apis } = get();
          const api = apis.get(controllerId);
          
          if (!api) return false;
          
          try {
            const result = await api.stopEffect();
            return result.success;
          } catch (error) {
            console.error(`Failed to stop effect on controller ${controllerId}:`, error);
            if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('ECONNABORTED'))) {
              get().updateControllerStatus(controllerId, { status: 'disconnected' });
            }
            return false;
          }
        },

        getLightingStatus: async (controllerId: string): Promise<SystemStatus | Record<string, unknown>> => {
          const { apis } = get();
          const api = apis.get(controllerId);
          
          if (!api) return {};
          
          try {
            const status = await api.getStatus();
            return status;
          } catch (error) {
            console.error(`Failed to get lighting status from controller ${controllerId}:`, error);
            if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('ECONNABORTED'))) {
              get().updateControllerStatus(controllerId, { status: 'disconnected' });
            }
            return {};
          }
        },

        // Show management
        loadShow: (show: Show) => {
          // Ensure Date objects are properly restored if they were serialized as strings
          const restoredShow = {
            ...show,
            createdAt: show.createdAt instanceof Date ? show.createdAt : new Date(show.createdAt),
            modifiedAt: show.modifiedAt instanceof Date ? show.modifiedAt : new Date(show.modifiedAt),
          };
          set({ currentShow: restoredShow, isPlaying: false });
        },

        saveShow: (show: Show) => {
          // In a real app, this would save to local storage or server
          console.log('Saving show:', show);
          set({ currentShow: show });
        },

        createShow: (name: string, description: string) => {
          const newShow: Show = {
            id: `show-${Date.now()}`,
            name,
            description,
            sequences: [],
            lightingSequences: [],
            createdAt: new Date(),
            modifiedAt: new Date(),
            version: '1.0.0',
            metadata: {}
          };
          set({ currentShow: newShow });
        },

        deleteShow: (id: string) => {
          const { currentShow } = get();
          if (currentShow?.id === id) {
            set({ currentShow: null });
          }
        },

        // Show sequence management
        addShowSequence: (sequence: Omit<ShowSequence, 'id'>) => {
          const { currentShow } = get();
          if (!currentShow) {
            console.warn('❌ Cannot add sequence: No current show selected');
            return;
          }

          const newSequence: ShowSequence = {
            ...sequence,
            id: `seq-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
          };

          console.log('✅ Adding sequence to show:', newSequence);

          const updatedShow: Show = {
            ...currentShow,
            sequences: [...currentShow.sequences, newSequence],
            modifiedAt: new Date()
          };

          set({ currentShow: updatedShow });
          console.log(`📋 Show now has ${updatedShow.sequences.length} sequences total`);
        },

        removeShowSequence: (sequenceId: string) => {
          console.log('🗑️ Store removeShowSequence called with ID:', sequenceId);
          const { currentShow } = get();
          if (!currentShow) {
            console.log('❌ No current show to remove from');
            return;
          }

          console.log('📊 Before removal - sequences:', currentShow.sequences.length);
          const filteredSequences = currentShow.sequences.filter(seq => seq.id !== sequenceId);
          console.log('📊 After filtering - sequences:', filteredSequences.length);

          const updatedShow: Show = {
            ...currentShow,
            sequences: filteredSequences,
            modifiedAt: new Date()
          };

          console.log('✅ Setting updated show with', updatedShow.sequences.length, 'sequences');
          set({ currentShow: updatedShow });
        },

        updateShowSequence: (sequenceId: string, updates: Partial<ShowSequence>) => {
          const { currentShow } = get();
          if (!currentShow) return;

          const updatedShow: Show = {
            ...currentShow,
            sequences: currentShow.sequences.map(seq => 
              seq.id === sequenceId ? { ...seq, ...updates } : seq
            ),
            modifiedAt: new Date()
          };

          set({ currentShow: updatedShow });
        },

        // Firework type management
        addFireworkType: (fireworkType: FireworkType) => {
          set((state) => ({
            fireworkTypes: [...state.fireworkTypes.filter(ft => ft.id !== fireworkType.id), fireworkType]
          }));
        },

        updateFireworkType: (id: string, updates: Partial<FireworkType>) => {
          set((state) => ({
            fireworkTypes: state.fireworkTypes.map(ft => 
              ft.id === id ? { ...ft, ...updates } : ft
            )
          }));
        },

        removeFireworkType: (id: string) => {
          set((state) => ({
            fireworkTypes: state.fireworkTypes.filter(ft => ft.id !== id)
          }));
        },

        // Lighting effect type management
        addLightingEffectType: (effectType: LightingEffectType) => {
          set((state) => ({
            lightingEffectTypes: [...state.lightingEffectTypes.filter(et => et.id !== effectType.id), effectType]
          }));
        },

        updateLightingEffectType: (id: string, updates: Partial<LightingEffectType>) => {
          set((state) => ({
            lightingEffectTypes: state.lightingEffectTypes.map(et => 
              et.id === id ? { ...et, ...updates } : et
            )
          }));
        },

        removeLightingEffectType: (id: string) => {
          set((state) => ({
            lightingEffectTypes: state.lightingEffectTypes.filter(et => et.id !== id)
          }));
        },

        // System armed/disarmed state management
        toggleSystemArmed: () => {
          set((state) => ({ systemArmed: !state.systemArmed }));
        },

        setSystemArmed: (armed: boolean) => {
          set(() => ({ systemArmed: armed }));
        },

        // Enhanced Import/Export with audio support
        exportShow: async (showId: string): Promise<ShowFile> => {
          const { currentShow, fireworkTypes, lightingEffectTypes, controllers } = get();
          if (!currentShow || currentShow.id !== showId) {
            throw new Error('Show not found');
          }
          
          // Create backup before any operations
          await ShowService.createShowBackup(currentShow);
          
          return ShowService.exportShow(currentShow, fireworkTypes, lightingEffectTypes, controllers);
        },

        importShow: async (showFile: ShowFile): Promise<boolean> => {
          try {
            const result = await ShowService.importShow(showFile);
            if (result.success && result.show) {
              
              // Backup current show if one exists
              const { currentShow } = get();
              if (currentShow) {
                await ShowService.createShowBackup(currentShow);
              }

              set({ currentShow: result.show });
              
              // Add imported firework types
              if (result.fireworkTypes) {
                result.fireworkTypes.forEach(ft => {
                  get().addFireworkType(ft);
                });
              }
              
              // Add imported lighting effect types
              if (result.lightingEffectTypes) {
                result.lightingEffectTypes.forEach(lt => {
                  get().addLightingEffectType(lt);
                });
              }
              
              // Restore audio if imported
              if (result.audioRestored && result.show.audio) {
                console.log('🎵 Audio imported with show, restoring...');
                await get().restoreShowAudio();
              }
              
              // Clean up old backups
              ShowService.cleanupBackups();
              
              console.log(`📥 Successfully imported show: ${result.show.name}`);
              return true;
            } else {
              console.error('❌ Import failed:', result.errors);
              return false;
            }
          } catch (error) {
            console.error('❌ Import error:', error);
            return false;
          }
        },

        downloadShow: async (showId?: string) => {
          try {
            const { currentShow, fireworkTypes, lightingEffectTypes, controllers } = get();
            const id = showId || currentShow?.id;
            if (!id || !currentShow) {
              console.error('No show to download');
              alert('No show to export');
              return;
            }
            
            console.log('📤 Preparing show download...');
            
            // Create backup before export
            await ShowService.createShowBackup(currentShow);
            
            // Export the show directly
            const showFile = await ShowService.exportShow(currentShow, fireworkTypes, lightingEffectTypes, controllers);
            await ShowService.downloadShowFile(showFile);
            
            console.log('✅ Show export completed');
          } catch (error) {
            console.error('❌ Download failed:', error);
            alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        },

        playShow: () => {
          console.log('🎮 PlayShow method called!');
          const { currentShow } = get();
          console.log('🎮 Current show:', currentShow);
          console.log('🎮 Show sequences count:', currentShow?.sequences?.length || 0);
          if (!currentShow) {
            console.warn('❌ No current show selected');
            alert('❌ No show selected. Please create a show first.');
            return;
          }
          if (currentShow.sequences.length === 0) {
            console.warn('❌ No sequences in the current show');
            alert('❌ No sequences in show. Please add firework or lighting sequences using "Add to Show" button.');
            return;
          }

          // Clear any existing timeouts
          get().showTimeouts.forEach(timeout => clearTimeout(timeout));
          set({ isPlaying: true, showTimeouts: [] });

          console.log(`🎬 Starting show "${currentShow.name}" with ${currentShow.sequences.length} sequences`);
          console.log(`🎬 Sequences:`, currentShow.sequences.map(s => ({
            id: s.id,
            type: s.type,
            timestamp: s.timestamp,
            name: s.fireworkType?.name || s.lightingEffectType?.name
          })));

          // Start audio playback if available
          if (currentShow.audio) {
            console.log(`🎵 Starting audio playback: ${currentShow.audio.name}`);
            console.log(`🎵 Audio has file:`, !!currentShow.audio.file);
            console.log(`🎵 Audio has URL:`, !!currentShow.audio.url);
            console.log(`🎵 Audio start offset:`, currentShow.audio.startOffset || 0);
            
            try {
              const audio = new Audio();
              
              if (currentShow.audio.file) {
                // For uploaded files, create object URL
                console.log(`🎵 Creating object URL for file...`);
                const audioUrl = URL.createObjectURL(currentShow.audio.file);
                audio.src = audioUrl;
                console.log(`🎵 Audio src set to:`, audioUrl);
              } else if (currentShow.audio.url) {
                // For linked URLs
                console.log(`🎵 Using direct URL:`, currentShow.audio.url);
                audio.src = currentShow.audio.url;
              } else {
                console.error(`❌ No audio file or URL available!`);
                return;
              }
              
              if (audio.src) {
                const { currentPlaybackTime } = get();
                const audioStartOffset = currentShow.audio.startOffset || 0;
                
                // Only start audio if we're at or past the audio start time
                if (currentPlaybackTime >= audioStartOffset) {
                  // Calculate how far into the audio file we should be
                  const audioFilePosition = (currentPlaybackTime - audioStartOffset) / 1000; // Convert ms to seconds
                  audio.currentTime = Math.max(0, audioFilePosition);
                  console.log(`🎵 Starting audio from timeline position: ${currentPlaybackTime}ms, audio file position: ${audioFilePosition}s`);
                  
                  audio.play().then(() => {
                    console.log(`✅ Audio playback started successfully`);
                  }).catch((error) => {
                    console.error(`❌ Failed to start audio playback:`, error);
                    alert(`Failed to play audio: ${error.message}`);
                  });
                } else {
                  // Audio hasn't started yet, set up to start it when timeline reaches the start offset
                  console.log(`🎵 Audio will start at ${audioStartOffset}ms (timeline is at ${currentPlaybackTime}ms)`);
                  audio.currentTime = 0; // Ready to play from beginning when time comes
                }
                
                // Store audio reference for potential stopping later
                set({ currentAudio: audio });
              }
            } catch (error) {
              console.error(`💥 Error setting up audio playback:`, error);
            }
          } else {
            console.log(`🔇 No audio track for this show`);
          }

          // Start playback time tracking from current position
          const { currentPlaybackTime } = get();
          const startTime = Date.now();
          const initialOffset = currentPlaybackTime; // Remember where we started
          console.log(`⏰ Starting playback timer from ${initialOffset}ms`);
          
          const playbackTimer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newPlaybackTime = initialOffset + elapsed;
            set({ currentPlaybackTime: newPlaybackTime });
            
            // Check if audio should start playing now
            const { currentShow, currentAudio } = get();
            if (currentShow?.audio && currentAudio) {
              const audioStartOffset = currentShow.audio.startOffset || 0;
              const audioEndTime = audioStartOffset + (currentShow.audio.duration || 0);
              
              // If timeline just reached audio start time and audio isn't playing
              if (newPlaybackTime >= audioStartOffset && 
                  newPlaybackTime < audioEndTime && 
                  currentAudio.paused) {
                const audioFilePosition = (newPlaybackTime - audioStartOffset) / 1000;
                currentAudio.currentTime = Math.max(0, audioFilePosition);
                currentAudio.play().then(() => {
                  console.log(`🎵 Audio started at timeline ${newPlaybackTime}ms, audio file position ${audioFilePosition}s`);
                }).catch(error => {
                  console.error(`❌ Failed to start delayed audio:`, error);
                });
              }
              
              // If timeline moved past audio end time, pause audio
              if (newPlaybackTime >= audioEndTime && !currentAudio.paused) {
                currentAudio.pause();
                console.log(`🎵 Audio stopped at timeline ${newPlaybackTime}ms (audio ended)`);
              }
            }
          }, 100); // Update every 100ms for smooth progress

          // Store timer for cleanup
          get().showTimeouts.push(playbackTimer as NodeJS.Timeout);

          // Sort sequences by timestamp and filter out sequences that should have already fired
          const { currentPlaybackTime: playbackPosition } = get();
          const sortedSequences = [...currentShow.sequences]
            .filter(sequence => sequence.timestamp >= playbackPosition) // Only future sequences
            .sort((a, b) => a.timestamp - b.timestamp);

          console.log(`🎯 Filtering sequences: ${currentShow.sequences.length} total, ${sortedSequences.length} remaining from ${playbackPosition}ms`);

          sortedSequences.forEach((sequence) => {
            const delay = sequence.timestamp - playbackPosition; // Relative delay from current position
            console.log(`⏱️ Scheduling ${sequence.fireworkType?.name || sequence.lightingEffectType?.name} in ${delay}ms (at ${sequence.timestamp}ms)`);
            
            const timeout = setTimeout(async () => {
              console.log(`🎆 Firing sequence at ${sequence.timestamp}ms: ${sequence.fireworkType?.name || sequence.lightingEffectType?.name} on ${sequence.controllerId} Area ${sequence.area}`);
              
              try {
                if (sequence.type === 'firework' && sequence.channel) {
                  const success = await get().fireChannel(sequence.controllerId, sequence.area, sequence.channel);
                  if (success) {
                    console.log(`✅ Successfully fired ${sequence.fireworkType?.name}`);
                  } else {
                    console.error(`❌ Failed to fire ${sequence.fireworkType?.name}`);
                  }
                } else if (sequence.type === 'lighting' && sequence.lightingEffectType) {
                  // Start lighting effect with proper relay targeting
                  const effect = sequence.lightingEffectType.effectType.toUpperCase() as 'SOLID' | 'STROBE' | 'CHASE' | 'WAVE' | 'RANDOM';
                  
                  let success: boolean;
                  
                  // Check if lighting effect has a pattern (specific relays) or sequence overrides relays
                  const targetRelays = sequence.relays && sequence.relays.length > 0 
                    ? sequence.relays 
                    : sequence.lightingEffectType.pattern;
                  
                  if (targetRelays && targetRelays.length > 0) {
                    // Use selective lighting effect for specific relays
                    console.log(`🎯 Starting selective lighting effect "${sequence.lightingEffectType.name}" on relays:`, targetRelays);
                    success = await get().startSelectiveLightingEffect(
                      sequence.controllerId, 
                      effect, 
                      targetRelays,
                      sequence.lightingEffectType.interval
                    );
                  } else {
                    // Use regular lighting effect for all relays
                    console.log(`💡 Starting regular lighting effect "${sequence.lightingEffectType.name}" on all relays`);
                    success = await get().startLightingEffect(
                      sequence.controllerId, 
                      effect, 
                      sequence.lightingEffectType.interval
                    );
                  }
                  if (success) {
                    console.log(`✅ Successfully started lighting effect ${sequence.lightingEffectType.name}`);
                    
                    // Schedule stop after duration
                    const duration = sequence.duration || sequence.lightingEffectType.duration;
                    setTimeout(async () => {
                      await get().stopLightingEffect(sequence.controllerId);
                      console.log(`� Stopped lighting effect ${sequence.lightingEffectType?.name}`);
                    }, duration);
                  } else {
                    console.error(`❌ Failed to start lighting effect ${sequence.lightingEffectType.name}`);
                  }
                }
              } catch (error) {
                console.error(`💥 Error firing sequence:`, error);
              }
            }, delay);

            // Store timeout for cleanup
            get().showTimeouts.push(timeout);
          });

          // Auto-stop when show is complete
          // If there's audio, use audio duration. Otherwise, use sequence timings with buffer
          const sequenceDuration = sortedSequences.length > 0 
            ? Math.max(...sortedSequences.map(s => s.timestamp)) + 5000 
            : 5000; // Default 5 seconds if no sequences
          
          const showDuration = currentShow.audio?.duration || sequenceDuration;
          
          console.log(`🎬 Show will run for ${showDuration}ms (${showDuration/1000}s)`, {
            hasAudio: !!currentShow.audio,
            audioDuration: currentShow.audio?.duration,
            sequenceDuration,
            finalDuration: showDuration
          });
          
          const stopTimeout = setTimeout(() => {
            console.log('🎬 Show completed');
            get().stopShow();
          }, showDuration);
          
          get().showTimeouts.push(stopTimeout);
        },

        stopShow: () => {
          console.log('🛑 StopShow method called!');
          console.log('🛑 Stopping show');
          
          // Stop audio playback if playing
          const { currentAudio } = get();
          if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            console.log('🔇 Stopped audio playback');
            set({ currentAudio: null });
          }
          
          // Clear all timeouts
          get().showTimeouts.forEach(timeout => clearTimeout(timeout));
          set({ isPlaying: false, showTimeouts: [], currentPlaybackTime: 0 });

          // Emergency stop all controllers as safety measure
          get().emergencyStopAll();
        },

        // Audio and timeline management
        setShowAudio: async (audioTrack: AudioTrack) => {
          const { currentShow } = get();
          if (!currentShow) return;

          // Ensure audio has a startOffset (default to 0 if not set)
          const audioWithOffset: AudioTrack = {
            ...audioTrack,
            startOffset: audioTrack.startOffset ?? 0
          };

          // Store uploaded files persistently
          if (audioWithOffset.file) {
            try {
              await audioStorageService.storeAudioFile(audioWithOffset);
              console.log(`💾 Audio file stored: ${audioWithOffset.name}`);
            } catch (error) {
              console.error('Failed to store audio file:', error);
              // Continue anyway - the file will still work until page reload
            }
          }

          const updatedShow: Show = {
            ...currentShow,
            audio: audioWithOffset,
            metadata: {
              ...currentShow.metadata,
              duration: Math.max(
                audioWithOffset.duration,
                currentShow.metadata.duration || 0,
                ...currentShow.sequences.map(s => s.timestamp + (s.fireworkType?.duration || 0))
              )
            },
            modifiedAt: new Date()
          };

          set({ currentShow: updatedShow });
        },

        removeShowAudio: () => {
          const { currentShow } = get();
          if (!currentShow || !currentShow.audio) return;

          // Clean up stored file if it exists
          if (currentShow.audio.file) {
            audioStorageService.deleteAudioFile(currentShow.audio.id).catch(error => {
              console.error('Failed to delete stored audio file:', error);
            });
          }

          const updatedShow: Show = {
            ...currentShow,
            audio: undefined,
            modifiedAt: new Date()
          };

          set({ currentShow: updatedShow });
        },

        moveShowAudio: (newStartOffset: number) => {
          const { currentShow } = get();
          if (!currentShow?.audio) return;

          const updatedAudio: AudioTrack = {
            ...currentShow.audio,
            startOffset: newStartOffset
          };

          const updatedShow: Show = {
            ...currentShow,
            audio: updatedAudio,
            modifiedAt: new Date()
          };

          set({ currentShow: updatedShow });
          console.log(`🎵 Audio moved to ${newStartOffset}ms (${Math.round(newStartOffset / 1000)}s)`);
        },

        restoreShowAudio: async () => {
          const { currentShow } = get();
          if (!currentShow?.audio) {
            console.log('🔄 No show or audio to restore');
            return; // No audio to restore
          }

          console.log('🔄 Audio restoration requested:', {
            audioName: currentShow.audio.name,
            audioId: currentShow.audio.id,
            hasFile: !!currentShow.audio.file,
            hasUrl: !!currentShow.audio.url,
            fileSize: currentShow.audio.file?.size || 'N/A'
          });

          // If it's a URL-based audio, no restoration needed
          if (currentShow.audio.url) {
            console.log('🔄 Audio is URL-based, no restoration needed');
            return;
          }

          // If file is missing but audio metadata exists, try to restore
          if (!currentShow.audio.file) {
            console.log('🔄 Audio file missing, attempting restoration...');
            try {
              // First, list all stored files for debugging
              const storedFiles = await audioStorageService.listStoredFiles();
              console.log('📦 Available stored audio files:', storedFiles);
              
              // Try to restore the file from storage
              const restoredFile = await audioStorageService.retrieveAudioFile(currentShow.audio.id);
              if (restoredFile) {
                const updatedAudio: AudioTrack = {
                  ...currentShow.audio,
                  file: restoredFile
                };

                const updatedShow: Show = {
                  ...currentShow,
                  audio: updatedAudio,
                  modifiedAt: new Date()
                };

                set({ currentShow: updatedShow });
                console.log(`✅ Successfully restored audio file: ${updatedAudio.name}`, {
                  fileSize: restoredFile.size,
                  fileType: restoredFile.type,
                  fileName: restoredFile.name
                });
              } else {
                console.warn(`⚠️ Could not restore audio file: ${currentShow.audio.name} (ID: ${currentShow.audio.id})`);
                
                // Try performing health check to see if there are backup files
                const healthCheck = await audioStorageService.performHealthCheck();
                console.log('🏥 Audio storage health check after failed restoration:', healthCheck);
              }
            } catch (error) {
              console.error('❌ Failed to restore audio file:', error);
              
              // Additional debugging information
              try {
                const storedFiles = await audioStorageService.listStoredFiles();
                console.log('📦 Available files after error:', storedFiles);
              } catch (listError) {
                console.error('❌ Could not list stored files:', listError);
              }
            }
          } else {
            console.log('🔄 Audio file already present, no restoration needed');
          }
        },

        moveSequence: (sequenceId: string, newTimestamp: number) => {
          const { currentShow } = get();
          if (!currentShow) return;

          const updatedSequences = currentShow.sequences.map(seq =>
            seq.id === sequenceId
              ? { ...seq, timestamp: Math.max(0, newTimestamp) }
              : seq
          );

          const updatedShow: Show = {
            ...currentShow,
            sequences: updatedSequences,
            modifiedAt: new Date()
          };

          set({ currentShow: updatedShow });
        },

        seekTo: (timestamp: number) => {
          set({ currentPlaybackTime: Math.max(0, timestamp) });
        },
        
        // Status refresh management for real-time controller monitoring
        startStatusRefresh: () => {
          const { statusRefreshInterval } = get();
          
          // Don't start if already running
          if (statusRefreshInterval) return;
          
          console.log('🔄 Starting controller status refresh (every 10 seconds)');
          const interval = setInterval(() => {
            get().refreshControllerStatus();
          }, 10000); // Check every 10 seconds
          
          set({ statusRefreshInterval: interval });
          
          // Also do an immediate check
          get().refreshControllerStatus();
        },
        
        stopStatusRefresh: () => {
          const { statusRefreshInterval } = get();
          
          if (statusRefreshInterval) {
            clearInterval(statusRefreshInterval);
            set({ statusRefreshInterval: null });
            console.log('🛑 Stopped controller status refresh');
          }
        },
        
        refreshControllerStatus: async () => {
          const { controllers, apis, updateControllerStatus } = get();
          
          if (controllers.length === 0) return;
          
          console.log(`🔍 Refreshing status for ${controllers.length} controllers...`);
          
          // Check each controller status in parallel
          const statusChecks = controllers.map(async (controller) => {
            const api = apis.get(controller.id);
            if (!api) {
              console.log(`⚠️ No API instance for controller ${controller.id}`);
              return;
            }
            
            try {
              // Try to ping the controller
              const isOnline = await api.ping();
              const newStatus: ESP32Controller['status'] = isOnline ? 'connected' : 'disconnected';
              
              // Only update if status changed
              if (controller.status !== newStatus) {
                console.log(`📡 Controller ${controller.name} status changed: ${controller.status} → ${newStatus}`);
                updateControllerStatus(controller.id, { 
                  status: newStatus,
                  lastSeen: isOnline ? new Date() : controller.lastSeen
                });
              }
            } catch (error) {
              // Network error - mark as disconnected if not already
              if (controller.status !== 'disconnected' && controller.status !== 'error') {
                console.log(`❌ Controller ${controller.name} ping failed:`, error);
                updateControllerStatus(controller.id, { status: 'error' });
              }
            }
          });
          
          await Promise.all(statusChecks);
        },
      }),
      {
        name: 'lume-store',
        // Only persist certain fields
        partialize: (state) => ({
          controllers: state.controllers,
          currentShow: state.currentShow ? {
            ...state.currentShow,
            // Remove File objects from audio during persistence as they can't be serialized
            audio: state.currentShow.audio ? {
              ...state.currentShow.audio,
              file: undefined // Will be restored from IndexedDB
            } : undefined
          } : undefined,
          fireworkTypes: state.fireworkTypes,
          lightingEffectTypes: state.lightingEffectTypes,
          systemArmed: state.systemArmed, // Persist armed/disarmed state
        }),
        // Convert string dates back to Date objects after rehydration
        onRehydrateStorage: () => (state) => {
          if (state?.currentShow) {
            // Convert createdAt and modifiedAt back to Date objects if they're strings
            if (typeof state.currentShow.createdAt === 'string') {
              state.currentShow.createdAt = new Date(state.currentShow.createdAt);
            }
            if (typeof state.currentShow.modifiedAt === 'string') {
              state.currentShow.modifiedAt = new Date(state.currentShow.modifiedAt);
            }
            
            // Convert uploadedAt in audio metadata if it exists and is a string
            if (state.currentShow.audio?.uploadedAt && typeof state.currentShow.audio.uploadedAt === 'string') {
              state.currentShow.audio.uploadedAt = new Date(state.currentShow.audio.uploadedAt);
            }
            
            console.log('🔄 Store rehydrated, audio restoration will be triggered by App component');
          }
        },
      }
    ),
    {
      name: 'lume-store',
    }
  )
);
