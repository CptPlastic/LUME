import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useLumeStore } from '../store/lume-store';
import { ControllerCard } from './ControllerCard';
import { AddControllerModal } from './AddControllerModal';
import type { ESP32Controller } from '../types';

export const Dashboard: React.FC = () => {
  const { 
    controllers, 
    connectionStatus, 
    lastScanTime,
    scanForControllers,
    addManualController
  } = useLumeStore();

  const [showAddModal, setShowAddModal] = useState(false);

  // Auto-scan on mount
  useEffect(() => {
    scanForControllers();
  }, [scanForControllers]);

  const handleAddController = async (ip: string, type?: 'firework' | 'lights') => {
    const success = await addManualController(ip, type);
    if (success) {
      setShowAddModal(false);
    }
    return success;
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'scanning': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const fireworkControllers = controllers.filter(c => c.type === 'firework');
  const lightControllers = controllers.filter(c => c.type === 'lights');

  const renderControllerSection = (controllers: ESP32Controller[], emptyMessage: string) => {
    if (controllers.length === 0 && connectionStatus !== 'scanning') {
      return (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <p className="text-gray-400">{emptyMessage}</p>
          <button
            onClick={scanForControllers}
            className="mt-4 px-4 py-2 bg-lume-secondary hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Scan for Controllers</span>
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {controllers.map(controller => (
          <ControllerCard key={controller.id} controller={controller} />
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 p-6 bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Controllers</h2>
            <p className="text-gray-400 mt-1">
              Manage your LUME ESP32 controllers
              {lastScanTime && (
                <span className="ml-2 text-sm">
                  • Last scan: {(() => {
                    try {
                      const date = lastScanTime instanceof Date 
                        ? lastScanTime 
                        : new Date(lastScanTime);
                      return date.toLocaleTimeString();
                    } catch {
                      return 'Unknown';
                    }
                  })()}
                </span>
              )}
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={scanForControllers}
              disabled={connectionStatus === 'scanning'}
              className="px-4 py-2 bg-lume-secondary hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${connectionStatus === 'scanning' ? 'animate-spin' : ''}`} />
              <span>{connectionStatus === 'scanning' ? 'Scanning...' : 'Refresh'}</span>
            </button>

                        <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Controller</span>
            </button>
          </div>
        </div>

        {/* Scanning State */}
        {connectionStatus === 'scanning' && controllers.length === 0 && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center mb-6">
            <RefreshCw className="w-8 h-8 text-lume-primary animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Scanning for Controllers</h3>
            <p className="text-gray-400">Looking for LUME ESP32 controllers on the network...</p>
          </div>
        )}

        {/* Firework Controllers */}
        {(fireworkControllers.length > 0 || connectionStatus !== 'scanning') && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <span>🎆 Firework Controllers</span>
              <span className="text-sm text-gray-400">({fireworkControllers.length})</span>
            </h3>
            {renderControllerSection(
              fireworkControllers,
              'No firework controllers found. Make sure your ESP32 controllers are powered on and connected to the network.'
            )}
          </div>
        )}

        {/* Light Controllers */}
        {(lightControllers.length > 0 || (connectionStatus !== 'scanning' && fireworkControllers.length > 0)) && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <span>💡 Light Controllers</span>
              <span className="text-sm text-gray-400">({lightControllers.length})</span>
            </h3>
            {lightControllers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lightControllers.map(controller => (
                  <ControllerCard key={controller.id} controller={controller} />
                ))}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 text-center">
                <p className="text-gray-400">No light controllers detected yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Connection Status Summary */}
        <div className="mt-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-300">
                <span className="font-medium">Total Controllers:</span> {controllers.length}
              </div>
              <div className="text-sm text-gray-300">
                <span className="font-medium">Connected:</span> {controllers.filter(c => c.status === 'connected').length}
              </div>
              <div className="text-sm text-gray-300">
                <span className="font-medium">Status:</span> 
                <span className={`ml-1 ${getStatusColor()}`}>
                  {connectionStatus}
                </span>
              </div>
            </div>
            
            {lastScanTime && (
              <div className="text-xs text-gray-500">
                Last updated: {(() => {
                  try {
                    const date = lastScanTime instanceof Date 
                      ? lastScanTime 
                      : new Date(lastScanTime);
                    return date.toLocaleString();
                  } catch {
                    return 'Unknown';
                  }
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Controller Modal */}
      <AddControllerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddController}
      />
    </div>
  );
};
