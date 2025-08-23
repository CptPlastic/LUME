import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  Power, 
  Zap, 
  Sparkles, 
  RotateCcw, 
  Shuffle,
  Sun,
  StopCircle
} from 'lucide-react';
import { useLumeStore } from '../store/lume-store';

interface LightingControlsProps {
  controllerId: string;
}

export const LightingControls: React.FC<LightingControlsProps> = ({ controllerId }) => {
  const { 
    toggleRelay,
    setAllRelays,
    startLightingEffect,
    startSelectiveLightingEffect,
    stopLightingEffect,
    getLightingStatus
  } = useLumeStore();
  
  const [relayStates, setRelayStates] = useState<boolean[]>(Array(12).fill(false));
  const [currentEffect, setCurrentEffect] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch current status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await getLightingStatus(controllerId);
        if (status.relayStates) {
          setRelayStates(status.relayStates);
        }
        if (status.effectName) {
          setCurrentEffect(status.effectRunning ? status.effectName : null);
        }
      } catch (error) {
        console.error('Failed to fetch lighting status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, [controllerId, getLightingStatus]);

  const handleToggleRelay = async (relay: number) => {
    setIsUpdating(true);
    try {
      await toggleRelay(controllerId, relay);
      // Update local state optimistically
      const newStates = [...relayStates];
      newStates[relay - 1] = !newStates[relay - 1];
      setRelayStates(newStates);
    } catch (error) {
      console.error('Failed to toggle relay:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAllOn = async () => {
    setIsUpdating(true);
    try {
      await setAllRelays(controllerId, 'ON');
      setRelayStates(Array(12).fill(true));
    } catch (error) {
      console.error('Failed to turn all relays on:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAllOff = async () => {
    setIsUpdating(true);
    try {
      await setAllRelays(controllerId, 'OFF');
      setRelayStates(Array(12).fill(false));
      setCurrentEffect(null);
    } catch (error) {
      console.error('Failed to turn all relays off:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartEffect = async (effectType: 'SOLID' | 'STROBE' | 'CHASE' | 'WAVE' | 'RANDOM') => {
    setIsUpdating(true);
    try {
      // Check if any relays are currently on (selective mode)
      const activeRelays = relayStates
        .map((isOn, index) => isOn ? index + 1 : null)
        .filter((relay): relay is number => relay !== null);
      
      if (activeRelays.length > 0 && activeRelays.length < 12) {
        // Use selective effect for currently active relays
        console.log('🎛️ Starting selective effect on active relays:', activeRelays);
        await startSelectiveLightingEffect(controllerId, effectType, activeRelays);
      } else {
        // Use regular effect for all relays
        await startLightingEffect(controllerId, effectType);
      }
      setCurrentEffect(effectType.toLowerCase());
    } catch (error) {
      console.error('Failed to start effect:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStopEffect = async () => {
    setIsUpdating(true);
    try {
      await stopLightingEffect(controllerId);
      setCurrentEffect(null);
    } catch (error) {
      console.error('Failed to stop effect:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getRelayButtonClass = (relay: number) => {
    const isOn = relayStates[relay - 1];
    if (isUpdating) {
      return 'bg-yellow-600 text-white animate-pulse';
    }
    return isOn 
      ? 'bg-lume-accent text-black font-bold' 
      : 'bg-gray-700 hover:bg-lume-accent hover:text-black text-gray-300';
  };

  const getEffectButtonClass = (effectType: string) => {
    const isActive = currentEffect === effectType.toLowerCase();
    if (isActive) {
      return 'bg-lume-primary text-white animate-pulse';
    }
    return 'bg-gray-700 hover:bg-lume-primary text-gray-300 hover:text-white';
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">Quick Actions</h4>
        <div className="flex space-x-2">
          <button
            onClick={handleAllOn}
            disabled={isUpdating}
            className="flex-1 px-2 py-1 text-xs font-medium bg-lume-accent hover:bg-yellow-500 text-black rounded transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
          >
            <Sun className="w-3 h-3" />
            <span>All On</span>
          </button>
          
          <button
            onClick={handleAllOff}
            disabled={isUpdating}
            className="flex-1 px-2 py-1 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
          >
            <Power className="w-3 h-3" />
            <span>All Off</span>
          </button>
        </div>
      </div>

      {/* Individual Relays */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">Individual Relays (1-12)</h4>
        <div className="grid grid-cols-6 gap-1">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(relay => (
            <button
              key={relay}
              onClick={() => handleToggleRelay(relay)}
              disabled={isUpdating}
              className={`w-8 h-8 text-xs font-medium rounded transition-colors ${getRelayButtonClass(relay)}`}
              title={`Relay ${relay}: ${relayStates[relay - 1] ? 'ON' : 'OFF'}`}
            >
              {relay}
            </button>
          ))}
        </div>
      </div>

      {/* Lighting Effects */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-300">Lighting Effects</h4>
          {currentEffect && (
            <button
              onClick={handleStopEffect}
              disabled={isUpdating}
              className="px-2 py-1 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50 flex items-center space-x-1"
            >
              <StopCircle className="w-3 h-3" />
              <span>Stop</span>
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => handleStartEffect('SOLID')}
            disabled={isUpdating}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors flex items-center justify-center space-x-1 ${getEffectButtonClass('solid')}`}
          >
            <Lightbulb className="w-3 h-3" />
            <span>Solid</span>
          </button>
          
          <button
            onClick={() => handleStartEffect('STROBE')}
            disabled={isUpdating}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors flex items-center justify-center space-x-1 ${getEffectButtonClass('strobe')}`}
          >
            <Zap className="w-3 h-3" />
            <span>Strobe</span>
          </button>
          
          <button
            onClick={() => handleStartEffect('CHASE')}
            disabled={isUpdating}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors flex items-center justify-center space-x-1 ${getEffectButtonClass('chase')}`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Chase</span>
          </button>
          
          <button
            onClick={() => handleStartEffect('WAVE')}
            disabled={isUpdating}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors flex items-center justify-center space-x-1 ${getEffectButtonClass('wave')}`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Wave</span>
          </button>
          
          <button
            onClick={() => handleStartEffect('RANDOM')}
            disabled={isUpdating}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors flex items-center justify-center space-x-1 col-span-2 ${getEffectButtonClass('random')}`}
          >
            <Shuffle className="w-3 h-3" />
            <span>Random</span>
          </button>
        </div>
        
        {currentEffect && (
          <div className="mt-2 text-xs text-lume-accent font-medium">
            Running: {currentEffect.toUpperCase()}
          </div>
        )}
      </div>

      {/* Status Display */}
      <div className="text-xs text-gray-500">
        Active Relays: {relayStates.filter(Boolean).length}/12
        {currentEffect && ` • Effect: ${currentEffect.toUpperCase()}`}
      </div>
    </div>
  );
};
