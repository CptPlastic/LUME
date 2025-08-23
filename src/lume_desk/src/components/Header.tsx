import React from 'react';
import { Zap, Wifi, WifiOff, AlertTriangle, Power, Wrench, Sparkles, Lightbulb, Clapperboard } from 'lucide-react';
import { useLumeStore } from '../store/lume-store';

interface HeaderProps {
  currentView: 'dashboard' | 'firework-types' | 'lighting-effects' | 'show-builder';
  onViewChange: (view: 'dashboard' | 'firework-types' | 'lighting-effects' | 'show-builder') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  const { 
    controllers, 
    activeController, 
    connectionStatus, 
    isPlaying,
    emergencyStopAll,
    scanForControllers 
  } = useLumeStore();

  const [iconError, setIconError] = React.useState(false);

  const activeControllerData = controllers.find(c => c.id === activeController);
  const connectedCount = controllers.filter(c => c.status === 'connected').length;

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-5 h-5 text-green-500" />;
      case 'scanning':
        return <Wifi className="w-5 h-5 text-yellow-500 animate-pulse" />;
      default:
        return <WifiOff className="w-5 h-5 text-red-500" />;
    }
  };

  const handleEmergencyStop = async () => {
    if (window.confirm('EMERGENCY STOP: This will immediately stop all controllers. Continue?')) {
      await emergencyStopAll();
    }
  };

  return (
    <header className="bg-lume-dark border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {/* App Icon with fallback */}
            {!iconError ? (
              <img 
                src="/icons/128x128.png" 
                alt="LUME Logo" 
                className="w-8 h-8"
                onError={() => setIconError(true)}
              />
            ) : (
              <Zap className="w-8 h-8 text-lume-primary" />
            )}
            <h1 className="text-2xl font-bold text-lume-primary">LUME</h1>
          </div>
          <div className="text-sm text-gray-400">
            Desktop Controller v1.2.0
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-1">
          <button
            onClick={() => onViewChange('dashboard')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              currentView === 'dashboard'
                ? 'bg-lume-primary text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Controllers</span>
          </button>
          <button
            onClick={() => onViewChange('firework-types')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              currentView === 'firework-types'
                ? 'bg-lume-primary text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Fireworks</span>
          </button>
          <button
            onClick={() => onViewChange('lighting-effects')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              currentView === 'lighting-effects'
                ? 'bg-lume-primary text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Lighting</span>
          </button>
          <button
            onClick={() => onViewChange('show-builder')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              currentView === 'show-builder'
                ? 'bg-lume-primary text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Clapperboard className="w-4 h-4" />
            <span>Show Builder</span>
          </button>
        </nav>

        {/* Connection Status */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {getConnectionIcon()}
            <span className="text-sm text-gray-300">
              {connectionStatus === 'connected' && (
                `${connectedCount} controller${connectedCount !== 1 ? 's' : ''} connected`
              )}
              {connectionStatus === 'scanning' && 'Scanning...'}
              {connectionStatus === 'disconnected' && 'No controllers found'}
            </span>
          </div>

          {/* Active Controller */}
          {activeControllerData && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-lume-secondary rounded-lg">
              <div className={`w-2 h-2 rounded-full ${
                activeControllerData.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm text-white font-medium">
                {activeControllerData.name}
              </span>
            </div>
          )}

          {/* Show Status */}
          {isPlaying && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-600 rounded-lg">
              <Power className="w-4 h-4 text-white" />
              <span className="text-sm text-white font-medium">Show Playing</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={scanForControllers}
            disabled={connectionStatus === 'scanning'}
            className="px-4 py-2 bg-lume-secondary hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {connectionStatus === 'scanning' ? 'Scanning...' : 'Scan'}
          </button>

          <button
            onClick={handleEmergencyStop}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors flex items-center space-x-2"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>EMERGENCY STOP</span>
          </button>
        </div>
      </div>
    </header>
  );
};
