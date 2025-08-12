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
    testAllChannels
  } = useLumeStore();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [testingChannel, setTestingChannel] = useState<number | null>(null);
  const [testingAll, setTestingAll] = useState(false);

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
      await fireChannel(controller.id, channel);
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
            controller.type === 'firework' ? 'bg-lume-primary text-white' :
            controller.type === 'lights' ? 'bg-lume-accent text-black' :
            'bg-gray-600 text-white'
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

        {/* Quick Test Channels (for firework controllers) */}
        {controller.type === 'firework' && isConnected && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-300">Quick Test</h4>
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
