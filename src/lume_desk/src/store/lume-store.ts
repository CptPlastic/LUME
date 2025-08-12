import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ESP32Controller, ShowSequence, LumeStore, FireworkType, ShowFile } from '../types';
import { ESP32API, controllerDiscovery } from '../services/esp32-api';
import { FireworkService } from '../services/firework-service';

interface LumeStoreImpl extends LumeStore {
  // Additional internal state
  apis: Map<string, ESP32API>;
  lastScanTime: Date | null;
  
  // Enhanced actions
  scanForControllers: () => Promise<void>;
  addManualController: (ip: string, type?: 'firework' | 'lights') => Promise<boolean>;
  connectToController: (id: string) => Promise<boolean>;
  disconnectFromController: (id: string) => void;
  fireChannel: (controllerId: string, channel: number) => Promise<boolean>;
  testAllChannels: (controllerId: string) => Promise<boolean>;
  emergencyStopAll: () => Promise<void>;
  
  // Show management
  createShow: (name: string, description: string) => void;
  deleteShow: (id: string) => void;
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
        isPlaying: false,
        connectionStatus: 'disconnected',
        apis: new Map(),
        lastScanTime: null,

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

        fireChannel: async (controllerId: string, channel: number): Promise<boolean> => {
          const { apis } = get();
          const api = apis.get(controllerId);
          
          if (!api) return false;
          
          try {
            const result = await api.fireChannel(channel);
            return result.success;
          } catch (error) {
            console.error(`Failed to fire channel ${channel} on controller ${controllerId}:`, error);
            // Only mark as disconnected on network timeout/connection errors
            if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('ECONNABORTED'))) {
              get().updateControllerStatus(controllerId, { status: 'disconnected' });
            }
            return false;
          }
        },

        testAllChannels: async (controllerId: string): Promise<boolean> => {
          const { apis } = get();
          const api = apis.get(controllerId);
          
          if (!api) return false;
          
          try {
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

        // Show management
        loadShow: (show: ShowSequence) => {
          set({ currentShow: show, isPlaying: false });
        },

        saveShow: (show: ShowSequence) => {
          // In a real app, this would save to local storage or server
          console.log('Saving show:', show);
          set({ currentShow: show });
        },

        createShow: (name: string, description: string) => {
          const newShow: ShowSequence = {
            id: `show-${Date.now()}`,
            name,
            description,
            duration: 0,
            steps: [],
            controllers: [],
            fireworkTypes: [],
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

        // Import/Export
        exportShow: (showId: string): ShowFile => {
          const { currentShow, fireworkTypes, controllers } = get();
          if (!currentShow || currentShow.id !== showId) {
            throw new Error('Show not found');
          }
          return FireworkService.exportShow(currentShow, fireworkTypes, controllers);
        },

        importShow: (showFile: ShowFile): boolean => {
          const result = FireworkService.importShow(showFile);
          if (result.success && result.show && result.fireworkTypes) {
            set({ currentShow: result.show });
            // Add imported firework types
            result.fireworkTypes.forEach(ft => {
              get().addFireworkType(ft);
            });
            return true;
          }
          return false;
        },

        playShow: () => {
          set({ isPlaying: true });
          // Show playback logic would go here
        },

        stopShow: () => {
          set({ isPlaying: false });
        },
      }),
      {
        name: 'lume-store',
        // Only persist certain fields
        partialize: (state) => ({
          controllers: state.controllers,
          currentShow: state.currentShow,
          fireworkTypes: state.fireworkTypes,
        }),
      }
    ),
    {
      name: 'lume-store',
    }
  )
);
