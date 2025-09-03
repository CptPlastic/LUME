import React, { useState } from 'react';
import { Zap, Wifi, WifiOff, Power, Wrench, Sparkles, Lightbulb, Clapperboard, ShieldAlert, ShieldCheck, Info, FileText } from 'lucide-react';
import { useLumeStore } from '../store/lume-store';
import { getAppVersion } from '../utils/version';
import { AboutModal } from './AboutModal';
import LogViewer from './LogViewer';

interface HeaderProps {
  currentView: 'dashboard' | 'firework-types' | 'lighting-effects' | 'show-builder';
  onViewChange: (view: 'dashboard' | 'firework-types' | 'lighting-effects' | 'show-builder') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  const { 
    controllers, 
    connectionStatus, 
    isPlaying,
    systemArmed,
    toggleSystemArmed,
    scanForControllers 
  } = useLumeStore();

  const [iconError, setIconError] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showLogViewer, setShowLogViewer] = useState(false);

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
        <div className="flex items-center space-x-4">
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
            <div>
              <h1 className="text-2xl font-bold text-lume-primary">LUME</h1>
              <div className="text-xs text-gray-500 -mt-1">Professional Control System</div>
            </div>
          </div>
          
          {/* Version and About */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAbout(true)}
              className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="About LUME - Click for version info and updates"
            >
              <span className="font-mono">v{getAppVersion()}</span>
              <Info className="w-3 h-3" />
            </button>
            <button
              onClick={() => setShowLogViewer(true)}
              className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="View captured console logs"
            >
              <FileText className="w-3 h-3" />
              <span>Logs</span>
            </button>
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

        {/* Status Indicators */}
        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-700 rounded-lg">
            {getConnectionIcon()}
            <span className="text-sm text-gray-300">
              {connectionStatus === 'connected' && `${connectedCount} connected`}
              {connectionStatus === 'scanning' && 'Scanning...'}
              {connectionStatus === 'disconnected' && 'No controllers'}
            </span>
          </div>

          {/* Show Status */}
          {isPlaying && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-600 rounded-lg">
              <Power className="w-4 h-4 text-white" />
              <span className="text-sm text-white font-medium">Playing</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={scanForControllers}
            disabled={connectionStatus === 'scanning'}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {connectionStatus === 'scanning' ? 'Scanning...' : 'Scan'}
          </button>

          {/* ARMED/DISARMED System Toggle - Compact */}
          <button
            onClick={handleToggleArmed}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 flex items-center space-x-2 ${
              systemArmed 
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20' 
                : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20'
            }`}
            title={systemArmed ? 'ARMED: Click to DISARM system' : 'DISARMED: Click to ARM system'}
          >
            <div className={`w-2 h-2 rounded-full ${
              systemArmed ? 'bg-red-200 animate-pulse' : 'bg-green-200'
            }`} />
            {systemArmed ? (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>ARMED</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>SAFE</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Simplified Status Bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-300 ${
        systemArmed ? 'bg-red-500' : 'bg-green-500'
      }`} />
      
      {/* About Modal */}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      
      {/* Log Viewer */}
      <LogViewer isOpen={showLogViewer} onClose={() => setShowLogViewer(false)} />
    </header>
  );
};
