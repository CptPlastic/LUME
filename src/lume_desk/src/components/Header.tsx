import React from 'react';
import { Zap, Wifi, WifiOff, Power, Wrench, Sparkles, Lightbulb, Clapperboard, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useLumeStore } from '../store/lume-store';
import { getAppVersion } from '../utils/version';

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
    systemArmed,
    toggleSystemArmed,
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

  const handleToggleArmed = () => {
    console.log('Toggle button clicked. Current state:', systemArmed);
    toggleSystemArmed();
    console.log('toggleSystemArmed called');
  };

  // Emergency stop functionality removed as per user request

  return (
    <header className="bg-lume-dark border-b border-gray-700 px-6 py-4 relative">
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
            v{getAppVersion()}
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
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-600 rounded-lg">
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

          {/* ARMED/DISARMED System Toggle */}
          <div className="relative">
            <button
              onClick={handleToggleArmed}
              className={`px-8 py-3 rounded-xl font-bold text-lg transition-all duration-300 flex items-center space-x-3 transform hover:scale-105 active:scale-95 ${
                systemArmed 
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-xl shadow-red-500/30 ring-2 ring-red-400/20' 
                  : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-xl shadow-green-500/30 ring-2 ring-green-400/20'
              }`}
              title={systemArmed ? 'Click to DISARM system (disable firework firing)' : 'Click to ARM system (enable firework firing)'}
            >
              <div className={`w-3 h-3 rounded-full animate-pulse ${
                systemArmed ? 'bg-red-200' : 'bg-green-200'
              }`} />
              {systemArmed ? (
                <>
                  <ShieldAlert className="w-6 h-6" />
                  <span className="tracking-wide">ARMED</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-6 h-6" />
                  <span className="tracking-wide">DISARMED</span>
                </>
              )}
            </button>
            
            {/* Status indicator */}
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full animate-pulse ${
              systemArmed ? 'bg-red-400' : 'bg-green-400'
            }`} />
          </div>
        </div>
      </div>
      
      {/* Sleek Status Bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 transition-all duration-300 ${
        systemArmed 
          ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-600 shadow-lg shadow-red-500/50' 
          : 'bg-gradient-to-r from-green-600 via-green-500 to-green-600 shadow-lg shadow-green-500/50'
      }`}>
        <div className={`h-full w-full relative overflow-hidden ${
          systemArmed ? 'bg-red-400/20' : 'bg-green-400/20'
        }`}>
          {/* Animated flowing effect */}
          <div className={`absolute inset-0 animate-pulse opacity-60 ${
            systemArmed 
              ? 'bg-gradient-to-r from-transparent via-red-300/30 to-transparent'
              : 'bg-gradient-to-r from-transparent via-green-300/30 to-transparent'
          } transform -skew-x-12`} />
        </div>
      </div>
    </header>
  );
};
