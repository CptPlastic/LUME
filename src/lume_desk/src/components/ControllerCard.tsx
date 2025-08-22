import React, { useState } from 'react';
import { 
  Zap, 
  Wifi, 
  WifiOff, 
  Settings, 
  Power, 
  AlertCircle,
  Radio,
  Lightbulb
} from 'lucide-react';
import { useLumeStore } from '../store/lume-store';
import { LightingControls } from './LightingControls';
import type { ESP32Controller } from '../types';

interface ControllerCardProps {
  controller: ESP32Controller;
}

export const ControllerCard: React.FC<ControllerCardProps> = ({ controller }) => {
  const { 
    activeController, 
    setActiveController, 
    connectToController,
    disconnectFromController,
    fireChannel,
    setControllerArea,
    syncControllerArea,
    testAllChannels
  } = useLumeStore();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [testingChannel, setTestingChannel] = useState<number | null>(null);
  const [testingAll, setTestingAll] = useState(false);
  const [currentArea, setCurrentArea] = useState(1);
  const [newAreaInput, setNewAreaInput] = useState('');

  const isActive = activeController === controller.id;
  const isConnected = controller.status === 'connected';

  const getControllerIcon = () => {
    switch (controller.type) {
      case 'firework':
        return <Zap className="w-6 h-6 text-lume-primary" />;
      case 'lights':
        return <Lightbulb className="w-6 h-6 text-lume-accent" />;
      default:
        return <Radio className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (controller.status) {
      case 'connected':
        return 'text-green-500';
      case 'disconnected':
        return 'text-gray-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const success = await connectToController(controller.id);
      if (success && !activeController) {
        setActiveController(controller.id);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectFromController(controller.id);
    if (isActive) {
      setActiveController('');
    }
  };

  const handleSetActive = () => {
    if (isConnected) {
      setActiveController(controller.id);
    }
  };

  const handleTestChannel = async (channel: number) => {
    if (!isConnected) return;
    
    setTestingChannel(channel);
    try {
      await fireChannel(controller.id, currentArea, channel);
    } catch (error) {
      console.error('Failed to test channel:', error);
    } finally {
      setTimeout(() => setTestingChannel(null), 1000); // Reset after 1 second
    }
  };

  const handleTestAll = async () => {
    if (!isConnected) return;
    
    setTestingAll(true);
    try {
      await testAllChannels(controller.id);
    } catch (error) {
      console.error('Failed to test all channels:', error);
    } finally {
      setTimeout(() => setTestingAll(false), 5000); // Reset after 5 seconds (test cycle time)
    }
  };

  const handleChangeArea = async () => {
    if (!isConnected || !newAreaInput) return;
    
    const area = parseInt(newAreaInput);
    if (area < 1 || area > 99) {
      alert('Area must be between 1 and 99');
      return;
    }
    
    try {
      const success = await setControllerArea(controller.id, area);
      if (success) {
        await syncControllerArea(controller.id, area);
        setCurrentArea(area);
        setNewAreaInput('');
        console.log(`Changed controller ${controller.id} to area ${area}`);
      } else {
        alert('Failed to change area');
      }
    } catch (error) {
      console.error('Failed to change area:', error);
      alert('Failed to change area');
    }
  };

  const getChannelButtonClass = (channel: number) => {
    if (testingChannel === channel) {
      return 'bg-lume-primary text-white animate-pulse';
    }
    if (testingAll) {
      return 'bg-yellow-600 text-white animate-pulse';
    }
    return 'bg-gray-700 hover:bg-lume-primary text-gray-300 hover:text-white disabled:opacity-50';
  };

  return (
    <div className={`bg-gray-800 rounded-lg border-2 transition-all ${
      isActive ? 'border-lume-primary shadow-lg shadow-lume-primary/20' : 'border-gray-700 hover:border-gray-600'
    }`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {getControllerIcon()}
            <div>
              <h3 className="text-white font-semibold">{controller.name}</h3>
              <p className="text-sm text-gray-400">{controller.ip}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className={`w-5 h-5 ${getStatusColor()}`} />
            ) : (
              <WifiOff className={`w-5 h-5 ${getStatusColor()}`} />
            )}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {controller.status}
            </span>
          </div>
        </div>

        {/* Controller Type Badge */}
        <div className="flex items-center space-x-2 mb-4">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            (() => {
              if (controller.type === 'firework') return 'bg-lume-primary text-white';
              if (controller.type === 'lights') return 'bg-lume-accent text-black';
              return 'bg-gray-600 text-white';
            })()
          }`}>
            {controller.type.toUpperCase()}
          </span>
          
          {isActive && (
            <span className="px-2 py-1 rounded text-xs font-medium bg-green-600 text-white">
              ACTIVE
            </span>
          )}
        </div>

        {/* Last Seen */}
        <div className="text-xs text-gray-500 mb-4">
          Last seen: {(() => {
            try {
              if (!controller.lastSeen) return 'Never';
              const date = controller.lastSeen instanceof Date 
                ? controller.lastSeen 
                : new Date(controller.lastSeen);
              return date.toLocaleTimeString();
            } catch (error) {
              console.warn('Failed to format lastSeen:', controller.lastSeen, error);
              return 'Unknown';
            }
          })()}
        </div>

        {/* Area Management (for firework controllers) */}
        {controller.type === 'firework' && isConnected && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Area Control</h4>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Current Area:</span>
              <span className="text-lume-primary font-mono font-bold">{currentArea}</span>
              <div className="flex-1 flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={newAreaInput}
                  onChange={(e) => setNewAreaInput(e.target.value)}
                  placeholder="1-99"
                  className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-lume-primary focus:border-transparent"
                />
                <button
                  onClick={handleChangeArea}
                  disabled={!newAreaInput || isConnecting}
                  className="px-2 py-1 text-xs font-medium bg-lume-secondary hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Set Area
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Test Channels (for firework controllers) */}
        {controller.type === 'firework' && isConnected && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-300">Area {currentArea} Channels (1-12)</h4>
              <button
                onClick={handleTestAll}
                disabled={testingChannel !== null || testingAll}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  testingAll
                    ? 'bg-lume-primary text-white animate-pulse'
                    : 'bg-gray-600 hover:bg-lume-primary text-gray-300 hover:text-white disabled:opacity-50'
                }`}
              >
                {testingAll ? 'Testing All...' : 'Test All'}
              </button>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(channel => (
                <button
                  key={channel}
                  onClick={() => handleTestChannel(channel)}
                  disabled={testingChannel !== null || testingAll}
                  className={`w-8 h-8 text-xs font-medium rounded transition-colors ${getChannelButtonClass(channel)}`}
                >
                  {channel}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lighting Controls (for lighting controllers) */}
        {controller.type === 'lights' && isConnected && (
          <LightingControls controllerId={controller.id} />
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex-1 px-3 py-2 bg-lume-secondary hover:bg-blue-700 text-white rounded font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Power className="w-4 h-4" />
              <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleSetActive}
                disabled={isActive}
                className="flex-1 px-3 py-2 bg-lume-primary hover:bg-orange-600 text-white rounded font-medium transition-colors disabled:opacity-50"
              >
                {isActive ? 'Active' : 'Set Active'}
              </button>
              
              <button
                onClick={handleDisconnect}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                <WifiOff className="w-4 h-4" />
              </button>
            </>
          )}
          
          <button
            className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Error State */}
        {controller.status === 'error' && (
          <div className="mt-3 p-2 bg-red-900/20 border border-red-500/30 rounded flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-400">Connection failed</span>
          </div>
        )}
      </div>
    </div>
  );
};
