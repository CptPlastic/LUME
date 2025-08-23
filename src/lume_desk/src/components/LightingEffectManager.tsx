import React, { useState, useMemo } from 'react';
import { Plus, Settings, Search, Lightbulb, Upload, Download } from 'lucide-react';
import { useLumeStore } from '../store/lume-store';
import { ESP32API } from '../services/esp32-api';
import { LightingEffectTypeCard } from './LightingEffectTypeCard';
import { LightingEffectTypeModal } from './LightingEffectTypeModal';
import type { LightingEffectType } from '../types';
import { LightingEffectService } from '../services/lighting-effect-service';

export const LightingEffectManager: React.FC = () => {
  const { lightingEffectTypes, addLightingEffectType, updateLightingEffectType, removeLightingEffectType, controllers } = useLumeStore();

  const [showModal, setShowModal] = useState(false);
  const [editingEffect, setEditingEffect] = useState<LightingEffectType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterIntensity, setFilterIntensity] = useState('');
  const [filterEffectType, setFilterEffectType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selectedController, setSelectedController] = useState('');
  const [selectedRelays, setSelectedRelays] = useState<number[]>([]);

  const handleTestLightingEffect = async (lightingEffect: LightingEffectType) => {
    console.log('🧪 Testing lighting effect:', lightingEffect.name);
    
    if (!selectedController) {
      alert('Please select a lighting controller first');
      return;
    }

    const controller = controllers.find(c => c.id === selectedController);
    if (!controller) {
      alert('Selected controller not found');
      return;
    }

    if (controller.type !== 'lights') {
      alert('Please select a lighting controller');
      return;
    }

    try {
      const api = new ESP32API(`http://${controller.ip}`);
      
            // Map lighting effect type to ESP32 effect type
      let effectType: 'SOLID' | 'STROBE' | 'CHASE' | 'FADE' | 'RANDOM';
      let relaysToUse: number[] = [];
      
      // For custom effects, use the pattern field to determine relays
      if (lightingEffect.effectType === 'custom') {
        if (lightingEffect.pattern && lightingEffect.pattern.length > 0) {
          relaysToUse = lightingEffect.pattern;
          effectType = 'SOLID'; // Default to solid for custom patterns
        } else {
          // If no pattern defined, use selected relays or all relays
          relaysToUse = selectedRelays.length > 0 ? selectedRelays : [];
          effectType = 'SOLID';
        }
      } else {
        // For standard effects, use selected relays if any
        relaysToUse = selectedRelays;
        switch (lightingEffect.effectType) {
          case 'solid': effectType = 'SOLID'; break;
          case 'strobe': effectType = 'STROBE'; break;
          case 'chase': effectType = 'CHASE'; break;
          case 'fade': effectType = 'FADE'; break;
          case 'random': effectType = 'RANDOM'; break;
          default: effectType = 'SOLID'; break;
        }
      }

      // Use selective effect if specific relays are defined
      if (relaysToUse.length > 0) {
        console.log('🎛️ Testing selective effect on relays:', relaysToUse);
        await api.startSelectiveEffect(effectType, relaysToUse, lightingEffect.interval);
        
        // Stop the effect after the duration
        setTimeout(async () => {
          try {
            await api.stopEffect();
            console.log('✅ Selective effect test completed');
          } catch (error) {
            console.error('❌ Failed to stop selective effect test:', error);
          }
        }, lightingEffect.duration);
      } else {
        // Test all relays with the full effect
        console.log('🎛️ Testing all relays with effect');
        await api.startEffect(effectType, lightingEffect.interval);
        
        // Stop the effect after the duration
        setTimeout(async () => {
          try {
            await api.stopEffect();
            console.log('✅ Full effect test completed');
          } catch (error) {
            console.error('❌ Failed to stop full effect test:', error);
          }
        }, lightingEffect.duration);
      }

      // If specific relays are selected, use selective effect API
      if (selectedRelays.length > 0) {
        console.log('🎛️ Testing specific relays with selective effect:', selectedRelays);
        await api.startSelectiveEffect(effectType, selectedRelays, lightingEffect.interval);
        
        // Stop the effect after the duration
        setTimeout(async () => {
          try {
            await api.stopEffect();
            console.log('✅ Selective effect test completed');
          } catch (error) {
            console.error('❌ Failed to stop selective effect test:', error);
          }
        }, lightingEffect.duration);
      } else {
        // Test all relays with the full effect
        console.log('🎛️ Testing all relays with effect');
        await api.startEffect(effectType, lightingEffect.interval);
        
        // Stop the effect after the duration
        setTimeout(async () => {
          try {
            await api.stopEffect();
            console.log('✅ Full effect test completed');
          } catch (error) {
            console.error('❌ Failed to stop full effect test:', error);
          }
        }, lightingEffect.duration);
      }

      console.log('✅ Test lighting effect started');
    } catch (error) {
      console.error('❌ Failed to test lighting effect:', error);
      alert('Failed to test lighting effect. Check controller connection.');
    }
  };

  // Filter lighting effect types
  const filteredEffectTypes = useMemo(() => {
    return lightingEffectTypes.filter(et => {
      const matchesSearch = !searchTerm || 
        et.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (et.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        et.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = !filterCategory || et.category === filterCategory;
      const matchesIntensity = !filterIntensity || et.intensity === filterIntensity;
      const matchesEffectType = !filterEffectType || et.effectType === filterEffectType;
      
      return matchesSearch && matchesCategory && matchesIntensity && matchesEffectType;
    });
  }, [lightingEffectTypes, searchTerm, filterCategory, filterIntensity, filterEffectType]);

  const categories = LightingEffectService.getCategories();
  const intensityLevels = LightingEffectService.getIntensityLevels();
  const effectTypes = LightingEffectService.getEffectTypes();

  const handleCreateNew = () => {
    setEditingEffect(null);
    setShowModal(true);
  };

  const handleEdit = (effectType: LightingEffectType) => {
    setEditingEffect(effectType);
    setShowModal(true);
  };

  const handleSave = (effectType: LightingEffectType) => {
    if (editingEffect) {
      updateLightingEffectType(editingEffect.id, effectType);
    } else {
      addLightingEffectType(effectType);
    }
    setShowModal(false);
    setEditingEffect(null);
  };

  const handleDelete = (id: string) => {
    setConfirmDelete(id);
  };

  const confirmDeleteEffect = () => {
    if (confirmDelete) {
      removeLightingEffectType(confirmDelete);
      setConfirmDelete(null);
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  const handleExportLibrary = async () => {
    console.log('🎆 Exporting lighting effects library...');
    console.log('Lighting effect types count:', lightingEffectTypes.length);
    
    try {
      const exportData = {
        metadata: {
          name: "Lighting Effects Library",
          description: "Complete lighting effects collection",
          createdAt: new Date().toISOString(),
          version: "1.0"
        },
        lightingEffectTypes,
        format: "lume-lighting-effects-v1"
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `lighting-effects-library-${new Date().toISOString().split('T')[0]}.json`;
      
      // Check if we're in Tauri environment
      const isTauri = '__TAURI__' in window;
      console.log('Is Tauri environment:', isTauri);
      
      // In Tauri, use clipboard with good UX
      if (isTauri) {
        console.log('Using Tauri-optimized export...');
        try {
          await navigator.clipboard.writeText(jsonString);
          alert(`💡 Export Successful!\n\n📋 Your lighting effects library has been copied to the clipboard.\n\n📝 To save the file:\n1. Open any text editor (TextEdit, Notepad, VS Code, etc.)\n2. Paste the content (Cmd+V or Ctrl+V)\n3. Save as: "${fileName}"\n\nThe file contains ${lightingEffectTypes.length} lighting effects ready for import!`);
          return;
        } catch (clipboardError) {
          console.warn('Clipboard failed in Tauri:', clipboardError);
        }
      }
      
      // For browsers, try download
      console.log('Attempting browser download...');
      try {
        const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(jsonString)}`;
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = fileName;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        alert(`💡 Export Complete!\n\nDownloaded: ${fileName}\nEffects: ${lightingEffectTypes.length}\n\nYour lighting effects library is ready for sharing!`);
      } catch (downloadError) {
        console.warn('Download failed, using fallback modal...', downloadError);
        // Show modal with content for manual copy
        showExportModal(jsonString, fileName);
      }
    } catch (error) {
      console.error('❌ Export failed:', error);
      alert('Failed to export lighting effects library. Please try again.');
    }
  };

  const showExportModal = (jsonString: string, fileName: string) => {
    // Create modal for manual copy (fallback)
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;
      z-index: 10000; font-family: system-ui;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: #1f2937; padding: 30px; border-radius: 12px; max-width: 600px; width: 90%;
      color: white; box-shadow: 0 25px 50px rgba(0,0,0,0.5);
    `;

    const header = document.createElement('h2');
    header.textContent = `💡 Lighting Effects Export - ${fileName}`;
    header.style.cssText = 'margin: 0 0 15px 0; color: #FF6B35;';

    const instructions = document.createElement('p');
    instructions.innerHTML = `
      Copy the content below and save it as <strong>${fileName}</strong>:
    `;
    instructions.style.cssText = 'margin-bottom: 15px; color: #e5e7eb;';

    const textarea = document.createElement('textarea');
    textarea.value = jsonString;
    textarea.style.cssText = `
      width: 100%; height: 300px; background: #374151; color: white; border: 1px solid #6b7280;
      border-radius: 6px; padding: 10px; font-family: monospace; font-size: 12px;
      resize: vertical;
    `;
    textarea.readOnly = true;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 10px; margin-top: 15px; justify-content: flex-end;';

    const copyButton = document.createElement('button');
    copyButton.style.cssText = `
      background: #FF6B35; color: white; border: none; padding: 10px 20px;
      border-radius: 6px; cursor: pointer; font-weight: bold;
    `;
    copyButton.textContent = '📋 Copy to Clipboard';
    copyButton.onclick = async () => {
      try {
        await navigator.clipboard.writeText(jsonString);
        copyButton.textContent = '✅ Copied!';
        copyButton.style.background = '#10b981';
        setTimeout(() => {
          copyButton.textContent = '📋 Copy to Clipboard';
          copyButton.style.background = '#FF6B35';
        }, 2000);
      } catch (err) {
        console.warn('Manual clipboard copy failed:', err);
        textarea.select();
        copyButton.textContent = '⚠️ Select & Copy Manually';
      }
    };

    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
      background: #666; color: white; border: none; padding: 10px 20px;
      border-radius: 6px; cursor: pointer;
    `;
    closeButton.textContent = 'Close';
    closeButton.onclick = () => {
      document.body.removeChild(modal);
    };

    buttonContainer.appendChild(copyButton);
    buttonContainer.appendChild(closeButton);

    content.appendChild(header);
    content.appendChild(instructions);
    content.appendChild(textarea);
    content.appendChild(buttonContainer);
    modal.appendChild(content);
    document.body.appendChild(modal);
  };

  const handleImportLibrary = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const importData = JSON.parse(content);
      
      // Validate format
      if (importData.format === 'lume-lighting-effects-v1' && importData.lightingEffectTypes) {
        // Import lighting effects library
        let importedCount = 0;
        for (const effectType of importData.lightingEffectTypes) {
          const existing = lightingEffectTypes.find(et => et.id === effectType.id);
          if (!existing) {
            addLightingEffectType(effectType);
            importedCount++;
          }
        }
        
        if (importedCount > 0) {
          alert(`💡 Import Successful!\n\nImported ${importedCount} new lighting effects!\nTotal effects: ${lightingEffectTypes.length + importedCount}`);
        } else {
          alert('No new lighting effects to import. All effects already exist.');
        }
      } else {
        alert('Invalid file format. Please select a valid lighting effects library file.');
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import lighting effects. Please check the file format.');
    }
    
    // Reset file input
    event.target.value = '';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterIntensity('');
    setFilterEffectType('');
  };

  const activeFiltersCount = [filterCategory, filterIntensity, filterEffectType].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Lighting Effect Library</h1>
          <p className="text-gray-400 mt-1">
            Manage your collection of lighting effects for shows and performances
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Import */}
          <label className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportLibrary}
              className="hidden"
            />
          </label>

          {/* Export */}
          <button
            onClick={handleExportLibrary}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>

          {/* New Effect */}
          <button
            onClick={handleCreateNew}
            className="flex items-center space-x-2 px-4 py-2 bg-lume-primary hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Effect</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 rounded-lg p-6 space-y-4">
        {/* Controller Selection for Testing */}
        <div className="mb-4 p-4 bg-gray-700 rounded-lg space-y-4">
          <div>
            <label htmlFor="controller-select" className="block text-sm font-medium text-gray-300 mb-2">
              Select Controller for Testing
            </label>
            <select
              id="controller-select"
              value={selectedController}
              onChange={(e) => setSelectedController(e.target.value)}
              className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
            >
              <option value="">Select a lighting controller...</option>
              {controllers
                .filter(c => c.status === 'connected' && c.type === 'lights')
                .map(controller => (
                  <option key={controller.id} value={controller.id}>
                    {controller.name}
                  </option>
                ))}
            </select>
            {controllers.filter(c => c.status === 'connected' && c.type === 'lights').length === 0 && (
              <p className="text-sm text-yellow-400 mt-1">
                No lighting controllers connected. Go to Controllers tab to scan for devices.
              </p>
            )}
          </div>

          {/* Relay Channel Selection */}
          {selectedController && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Test Specific Relay Channels (1-12)
              </label>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(relay => (
                  <button
                    key={relay}
                    type="button"
                    onClick={() => {
                      setSelectedRelays(prev => 
                        prev.includes(relay) 
                          ? prev.filter(r => r !== relay)
                          : [...prev, relay]
                      );
                    }}
                    className={`p-2 text-sm rounded border transition-colors ${
                      selectedRelays.includes(relay)
                        ? 'bg-lume-primary border-lume-primary text-white'
                        : 'bg-gray-600 border-gray-500 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    {relay}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {selectedRelays.length === 0 
                  ? 'No relays selected - will test all relays with full effect' 
                  : `Selected relays: ${selectedRelays.join(', ')} - will test only these relays`}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search lighting effects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              showFilters || activeFiltersCount > 0
                ? 'bg-lume-primary text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-white text-lume-primary text-xs font-bold px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter Controls */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Intensity</label>
              <select
                value={filterIntensity}
                onChange={(e) => setFilterIntensity(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
              >
                <option value="">All Intensities</option>
                {intensityLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Effect Type</label>
              <select
                value={filterEffectType}
                onChange={(e) => setFilterEffectType(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
              >
                <option value="">All Types</option>
                {effectTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Lightbulb className="w-8 h-8 text-lume-primary" />
            <div>
              <p className="text-2xl font-bold text-white">{lightingEffectTypes.length}</p>
              <p className="text-sm text-gray-400">Total Effects</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Lightbulb className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {lightingEffectTypes.filter(et => et.category === 'mood').length}
              </p>
              <p className="text-sm text-gray-400">Mood Effects</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Lightbulb className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {lightingEffectTypes.filter(et => et.category === 'party').length}
              </p>
              <p className="text-sm text-gray-400">Party Effects</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Lightbulb className="w-8 h-8 text-pink-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {lightingEffectTypes.filter(et => et.category === 'special').length}
              </p>
              <p className="text-sm text-gray-400">Special Effects</p>
            </div>
          </div>
        </div>
      </div>

      {/* Effect Types Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Lighting Effects 
            {searchTerm || activeFiltersCount > 0 ? (
              <span className="text-gray-400 font-normal ml-2">
                ({filteredEffectTypes.length} of {lightingEffectTypes.length})
              </span>
            ) : (
              <span className="text-gray-400 font-normal ml-2">
                ({lightingEffectTypes.length})
              </span>
            )}
          </h2>
        </div>

        {filteredEffectTypes.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <Lightbulb className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-300 mb-2">
              {searchTerm || activeFiltersCount > 0 ? 'No Effects Found' : 'No Lighting Effects'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || activeFiltersCount > 0 
                ? 'Try adjusting your search or filters' 
                : 'Create your first lighting effect to get started'}
            </p>
            {(!searchTerm && activeFiltersCount === 0) && (
              <button
                onClick={handleCreateNew}
                className="px-6 py-3 bg-lume-primary hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
              >
                Create Lighting Effect
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEffectTypes.map((effectType) => (
              <LightingEffectTypeCard
                key={effectType.id}
                lightingEffectType={effectType}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTest={handleTestLightingEffect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <LightingEffectTypeModal
          effectType={editingEffect}
          onSave={handleSave}
          onCancel={() => {
            setShowModal(false);
            setEditingEffect(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-white mb-4">Delete Lighting Effect</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this lighting effect? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteEffect}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
