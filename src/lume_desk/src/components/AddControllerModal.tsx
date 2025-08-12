import React, { useState } from 'react';
import { X, Plus, Wifi } from 'lucide-react';

interface AddControllerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (ip: string, type?: 'firework' | 'lights') => Promise<boolean>;
}

export const AddControllerModal: React.FC<AddControllerModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [ip, setIp] = useState('');
  const [type, setType] = useState<'firework' | 'lights' | 'auto'>('auto');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ip.trim()) {
      setError('IP address or hostname is required');
      return;
    }

    // Enhanced validation to support .local domains and IP addresses
    const trimmedInput = ip.trim();
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-.]*[a-zA-Z0-9])?$/;
    
    if (!ipRegex.test(trimmedInput) && !hostnameRegex.test(trimmedInput)) {
      setError('Please enter a valid IP address (e.g., 192.168.1.100) or hostname (e.g., lume-controller.local)');
      return;
    }

    setIsAdding(true);
    setError('');

    try {
      const success = await onAdd(
        ip.trim(), 
        type === 'auto' ? undefined : type
      );
      
      if (success) {
        setIp('');
        setType('auto');
        onClose();
      } else {
        setError('Could not connect to controller at this IP address');
      }
    } catch {
      setError('Failed to add controller. Please check the IP address and try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    if (!isAdding) {
      setIp('');
      setType('auto');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
            <Plus className="w-5 h-5 text-lume-primary" />
            <span>Add Controller Manually</span>
          </h3>
          <button
            onClick={handleClose}
            disabled={isAdding}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* IP Address Input */}
          <div>
            <label htmlFor="ip" className="block text-sm font-medium text-gray-300 mb-2">
              IP Address or Hostname
            </label>
            <div className="space-y-2">
              <input
                type="text"
                id="ip"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="192.168.1.100 or lume-controller.local"
                disabled={isAdding}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lume-primary focus:border-transparent disabled:opacity-50"
              />
              
              {/* Quick preset button */}
              <button
                type="button"
                onClick={() => setIp('lume-controller.local')}
                disabled={isAdding}
                className="text-xs text-lume-primary hover:text-orange-400 transition-colors disabled:opacity-50"
              >
                📌 Use lume-controller.local
              </button>
            </div>
          </div>

          {/* Controller Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
              Controller Type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as 'firework' | 'lights' | 'auto')}
              disabled={isAdding}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-lume-primary focus:border-transparent disabled:opacity-50"
            >
              <option value="auto">Auto-detect</option>
              <option value="firework">Firework Controller</option>
              <option value="lights">Lights Controller</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Help Text */}
          <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400 text-sm">
              💡 Enter the IP address or hostname of your ESP32 controller. You can use:
              <br />• IP address (e.g., 192.168.1.100)
              <br />• .local hostname (e.g., lume-controller.local)
              <br />• Find the IP in your router's device list or ESP32 serial output
            </p>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isAdding}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAdding || !ip.trim()}
              className="flex-1 px-4 py-2 bg-lume-primary hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isAdding ? (
                <>
                  <Wifi className="w-4 h-4 animate-pulse" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Controller</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
