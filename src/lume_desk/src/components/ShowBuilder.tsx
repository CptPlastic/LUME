import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Play, Pause, Settings, Clock, Lightbulb, Zap, Download, Upload } from 'lucide-react';
import { useLumeStore } from '../store/lume-store';
import { ESP32API } from '../services/esp32-api';
import type { ShowSequence, FireworkType, LightingEffectType, ShowFile } from '../types';
import { FireworkTypeCard } from './FireworkTypeCard';
import { LightingEffectTypeCard } from './LightingEffectTypeCard';
import { ShowTimeline } from './ShowTimeline';

export const ShowBuilder: React.FC = () => {
  const { 
    controllers,
    fireworkTypes, 
    lightingEffectTypes,
    currentShow, 
    createShow, 
    addShowSequence, 
    removeShowSequence,
    updateShowSequence,
    isPlaying,
    playShow,
    stopShow,
    currentPlaybackTime,
    setShowAudio,
    removeShowAudio,
    moveSequence,
    seekTo,
    restoreShowAudio,
    importShow,
    downloadShow
  } = useLumeStore();

  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import/Export handlers
  const handleExportShow = async () => {
    if (!currentShow) {
      alert('No show to export');
      return;
    }
    
    try {
      await downloadShow(currentShow.id);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export show. Please try again.');
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const showFile: ShowFile = JSON.parse(content);
      
      const success = await importShow(showFile);
      if (success) {
        alert('Show imported successfully!');
      } else {
        alert('Failed to import show. Please check the file format.');
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import show. Please check the file format.');
    }
    
    // Reset file input
    event.target.value = '';
  };

  // Restore audio on component mount if needed
  useEffect(() => {
    if (currentShow?.audio) {
      console.log('🔄 Checking if audio needs restoration...', {
        hasFile: !!currentShow.audio.file,
        hasUrl: !!currentShow.audio.url,
        audioId: currentShow.audio.id
      });
      
      // Always try to restore if we have audio metadata but no file/URL
      if (!currentShow.audio.file && !currentShow.audio.url) {
        console.log('🔄 Audio needs restoration, calling restoreShowAudio...');
        restoreShowAudio();
      }
    }
  }, [currentShow?.id, currentShow?.audio?.id, restoreShowAudio]);

  const [showName, setShowName] = useState('New Show');
  const [showDescription, setShowDescription] = useState('');
  const [selectedFireworkType, setSelectedFireworkType] = useState<FireworkType | null>(null);
  const [selectedLightingEffect, setSelectedLightingEffect] = useState<LightingEffectType | null>(null);
  const [effectTab, setEffectTab] = useState<'fireworks' | 'lighting'>('fireworks');
  const [sequenceTime, setSequenceTime] = useState(0);
  const [selectedController, setSelectedController] = useState('');
  const [selectedArea, setSelectedArea] = useState(1);
  const [selectedChannel, setSelectedChannel] = useState(1);
  const [selectedRelays, setSelectedRelays] = useState<number[]>([]);
  const [effectDuration, setEffectDuration] = useState(5);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate show duration and statistics
  const showStats = useMemo(() => {
    if (!currentShow?.sequences) {
      return { duration: currentShow?.audio?.duration || 0, totalFireworks: 0, totalLighting: 0, controllers: new Set(), channels: new Set() };
    }

    const sequences = currentShow.sequences;
    const maxSequenceTime = sequences.reduce((max, seq) => {
      let endTime = seq.timestamp;
      if (seq.type === 'firework' && seq.fireworkType) {
        endTime += seq.fireworkType.duration;
      } else if (seq.type === 'lighting') {
        // Use custom duration if available, otherwise use effect type duration
        const duration = seq.duration || (seq.lightingEffectType?.duration ? seq.lightingEffectType.duration * 1000 : 5000);
        endTime += duration;
      }
      return Math.max(max, endTime);
    }, 0);

    // Prioritize audio duration if available, otherwise use sequence timing
    const showDuration = currentShow.audio?.duration || maxSequenceTime;

    const controllers = new Set(sequences.map(seq => seq.controllerId));
    const channels = new Set(sequences.map(seq => seq.channel));
    const fireworkCount = sequences.filter(seq => seq.type === 'firework').length;
    const lightingCount = sequences.filter(seq => seq.type === 'lighting').length;

    return {
      duration: showDuration,
      totalFireworks: fireworkCount,
      totalLighting: lightingCount,
      controllers,
      channels
    };
  }, [currentShow]);

  // Filter firework types
  const filteredFireworkTypes = useMemo(() => {
    return fireworkTypes.filter(ft => {
      const matchesSearch = !searchTerm || 
        ft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ft.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        ft.effects.some(effect => effect.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = !filterCategory || ft.category === filterCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [fireworkTypes, searchTerm, filterCategory]);

  // Filter lighting effect types
  const filteredLightingEffects = useMemo(() => {
    return lightingEffectTypes.filter(le => {
      const matchesSearch = !searchTerm || 
        le.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (le.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (le.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = !filterCategory || le.category === filterCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [lightingEffectTypes, searchTerm, filterCategory]);

  const fireworkCategories = ['shell', 'cake', 'fountain', 'roman-candle', 'mine', 'comet', 'strobe', 'sparkler', 'smoke'];
  const lightingCategories = ['mood', 'party', 'strobe', 'chase', 'fade', 'pattern', 'special'];

  const getCurrentCategories = () => effectTab === 'fireworks' ? fireworkCategories : lightingCategories;

  const handleTestLightingEffect = async (lightingEffect: LightingEffectType) => {
    console.log('🧪 Testing lighting effect:', lightingEffect.name);
    
    if (!selectedController) {
      alert('Please select a controller first');
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
      switch (lightingEffect.effectType) {
        case 'solid': effectType = 'SOLID'; break;
        case 'strobe': effectType = 'STROBE'; break;
        case 'chase': effectType = 'CHASE'; break;
        case 'fade': effectType = 'FADE'; break;
        case 'random': effectType = 'RANDOM'; break;
        default: effectType = 'SOLID'; break;
      }

      // Start the effect with interval if specified
      await api.startEffect(effectType, lightingEffect.interval);
      
      // Stop the effect after the duration
      setTimeout(async () => {
        try {
          await api.stopEffect();
          console.log('✅ Test lighting effect stopped');
        } catch (error) {
          console.error('❌ Failed to stop test effect:', error);
        }
      }, lightingEffect.duration);

      console.log('✅ Test lighting effect started');
    } catch (error) {
      console.error('❌ Failed to test lighting effect:', error);
      alert('Failed to test lighting effect. Check controller connection.');
    }
  };

  const handleEditFirework = (firework: FireworkType) => {
    console.log('✏️ Edit firework requested:', firework.name);
    // For now, just log - could add inline editing or redirect to manager
    alert(`Edit "${firework.name}" - Use the Firework Types page for editing`);
  };

  const handleEditLighting = (lighting: LightingEffectType) => {
    console.log('✏️ Edit lighting effect requested:', lighting.name);
    // For now, just log - could add inline editing or redirect to manager  
    alert(`Edit "${lighting.name}" - Use the Lighting Effects page for editing`);
  };

  const handleCreateShow = () => {
    console.log('🎬 Create show clicked:', { showName, showDescription });
    
    if (!showName.trim()) {
      alert('Please enter a show name');
      return;
    }
    
    console.log('✅ Creating show with name:', showName.trim());
    createShow(showName.trim(), showDescription.trim());
    console.log('✅ Show created, checking currentShow...');
    alert(`Show "${showName}" created successfully!`);
  };

  const handleAddToShow = () => {
    console.log('➕ Add to show clicked:', {
      effectTab,
      selectedFireworkType: selectedFireworkType?.name,
      selectedLightingEffect: selectedLightingEffect?.name,
      currentShow: currentShow?.name,
      selectedController,
      selectedArea,
      selectedChannel,
      sequenceTime
    });

    if (effectTab === 'fireworks') {
      if (!selectedFireworkType) {
        alert('Please select a firework type');
        return;
      }

      if (!currentShow) {
        alert('Please create a show first');
        return;
      }

      if (!selectedController) {
        alert('Please select a controller');
        return;
      }

      const sequence: Omit<ShowSequence, 'id'> = {
        type: 'firework',
        timestamp: sequenceTime * 1000, // Convert to milliseconds
        fireworkTypeId: selectedFireworkType.id,
        fireworkType: selectedFireworkType,
        controllerId: selectedController,
        area: selectedArea,
        channel: selectedChannel,
        delay: 0,
        repeat: 1
      };

      console.log('✅ Adding firework sequence:', sequence);
      addShowSequence(sequence);
      
      // Auto-increment time by safety delay + duration for next firework
      const nextTime = sequenceTime + (selectedFireworkType.duration / 1000) + (selectedFireworkType.safetyDelay / 1000);
      setSequenceTime(Math.round(nextTime * 10) / 10); // Round to 1 decimal
      console.log('⏰ Auto-incremented time to:', nextTime);
    } else if (effectTab === 'lighting') {
      if (!selectedLightingEffect) {
        alert('Please select a lighting effect');
        return;
      }

      if (!currentShow) {
        alert('Please create a show first');
        return;
      }

      if (!selectedController) {
        alert('Please select a controller');
        return;
      }

      const sequence: Omit<ShowSequence, 'id'> = {
        type: 'lighting',
        timestamp: sequenceTime * 1000, // Convert to milliseconds
        lightingEffectTypeId: selectedLightingEffect.id,
        lightingEffectType: selectedLightingEffect,
        controllerId: selectedController,
        area: selectedArea,
        relays: selectedRelays.length > 0 ? selectedRelays : undefined, // Use selected relays or all relays
        duration: effectDuration * 1000, // Convert to milliseconds
        delay: 0,
        repeat: 1
      };

      console.log('✅ Adding lighting sequence:', sequence);
      addShowSequence(sequence);
      
      // Auto-increment time by effect duration for next effect
      const nextTime = sequenceTime + effectDuration + 1; // Add 1 second gap
      setSequenceTime(Math.round(nextTime * 10) / 10); // Round to 1 decimal
      console.log('⏰ Auto-incremented time to:', nextTime);
    }
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 100);
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${ms}`;
    }
    return `${remainingSeconds}.${ms}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Show Builder</h1>
          <p className="text-gray-400 mt-1">
            Create timed sequences using your firework and lighting effect libraries
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Import Show Button */}
          <label className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.lume-show.json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
          
          {/* Export Show Button */}
          <button
            onClick={handleExportShow}
            disabled={!currentShow}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          {/* Play/Stop Button */}
          <button
            onClick={isPlaying ? stopShow : playShow}
            disabled={!currentShow || currentShow.sequences.length === 0}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isPlaying 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-600 disabled:cursor-not-allowed'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Stop Show' : 'Play Show'}</span>
          </button>
        </div>
      </div>

      {/* Show Setup */}
      <div className="bg-gray-800 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold text-white mb-4">Show Setup</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="show-name" className="block text-sm font-medium text-gray-300 mb-2">
              Show Name *
            </label>
            <input
              id="show-name"
              type="text"
              value={showName}
              onChange={(e) => setShowName(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
              placeholder="Enter show name..."
            />
          </div>
          
          <div>
            <label htmlFor="show-description" className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <input
              id="show-description"
              type="text"
              value={showDescription}
              onChange={(e) => setShowDescription(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
              placeholder="Describe your show..."
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleCreateShow}
            className="px-4 py-2 bg-lume-primary hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
          >
            Create New Show
          </button>
          
          {currentShow && (
            <div className="flex items-center space-x-2 text-sm bg-green-800 px-3 py-2 rounded-lg">
              <Clock className="w-4 h-4 text-green-300" />
              <span className="text-green-100 font-medium">Current: {currentShow.name}</span>
              <span className="text-green-300">•</span>
              <span className="text-green-200">{showStats.totalFireworks} fireworks</span>
              <span className="text-green-300">•</span>
              <span className="text-green-200">{showStats.totalLighting} lighting</span>
              <span className="text-green-300">•</span>
              <span className="text-green-200">{formatTime(showStats.duration)} duration</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Effect Type Selection */}
        <div className="bg-gray-800 rounded-lg p-6">
          {/* Tab Header */}
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => {
                setEffectTab('fireworks');
                setFilterCategory('');
                setSearchTerm('');
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                effectTab === 'fireworks'
                  ? 'bg-lume-primary text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Fireworks</span>
            </button>
            <button
              onClick={() => {
                setEffectTab('lighting');
                setFilterCategory('');
                setSearchTerm('');
                setSelectedRelays([]); // Reset relay selection when switching to lighting
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                effectTab === 'lighting'
                  ? 'bg-lume-primary text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              <span>Lighting</span>
            </button>
          </div>

          <h2 className="text-xl font-semibold text-white mb-4">
            Add {effectTab === 'fireworks' ? 'Fireworks' : 'Lighting Effects'}
          </h2>
          
          {/* Effect Type Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder={`Search ${effectTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  showFilters ? 'bg-lume-primary text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {showFilters && (
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
              >
                <option value="">All Categories</option>
                {getCurrentCategories().map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Content Grid */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {effectTab === 'fireworks' && filteredFireworkTypes.map((fireworkType) => (
              <button
                key={fireworkType.id}
                type="button"
                className={`w-full text-left cursor-pointer rounded-lg border-2 transition-colors ${
                  selectedFireworkType?.id === fireworkType.id
                    ? 'border-lume-primary bg-gray-700'
                    : 'border-gray-600 hover:border-gray-500 bg-gray-750'
                }`}
                onClick={() => {
                  console.log('🎆 Firework selected:', fireworkType.name);
                  setSelectedFireworkType(fireworkType);
                  setSelectedLightingEffect(null);
                }}
              >
                <FireworkTypeCard
                  fireworkType={fireworkType}
                  onEdit={handleEditFirework}
                  onDelete={() => {}} // Disabled in show builder
                  onSelect={() => setSelectedFireworkType(fireworkType)}
                  isSelected={selectedFireworkType?.id === fireworkType.id}
                  showActions={true}
                />
              </button>
            ))}

            {effectTab === 'lighting' && filteredLightingEffects.map((lightingEffect) => (
              <button
                key={lightingEffect.id}
                type="button"
                className={`w-full text-left cursor-pointer rounded-lg border-2 transition-colors ${
                  selectedLightingEffect?.id === lightingEffect.id
                    ? 'border-lume-primary bg-gray-700'
                    : 'border-gray-600 hover:border-gray-500 bg-gray-750'
                }`}
                onClick={() => {
                  console.log('💡 Lighting effect selected:', lightingEffect.name);
                  setSelectedLightingEffect(lightingEffect);
                  setSelectedFireworkType(null);
                  setSelectedRelays([]); // Reset relay selection
                }}
              >
                <LightingEffectTypeCard
                  lightingEffectType={lightingEffect}
                  onEdit={handleEditLighting}
                  onDelete={() => {}} // Disabled in show builder
                  onTest={handleTestLightingEffect}
                  onSelect={() => setSelectedLightingEffect(lightingEffect)}
                  isSelected={selectedLightingEffect?.id === lightingEffect.id}
                  showActions={true}
                />
              </button>
            ))}
          </div>

          {/* Add to Show Controls */}
          {(selectedFireworkType || selectedLightingEffect) && (
            <div className="mt-6 p-4 bg-gray-700 rounded-lg space-y-4">
              <h3 className="font-medium text-white">
                Add "{selectedFireworkType?.name || selectedLightingEffect?.name}" to Show
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="sequence-time" className="block text-sm font-medium text-gray-300 mb-2">
                    Time (seconds)
                  </label>
                  <input
                    id="sequence-time"
                    type="number"
                    min="0"
                    step="0.1"
                    value={sequenceTime}
                    onChange={(e) => setSequenceTime(parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="area-select" className="block text-sm font-medium text-gray-300 mb-2">
                    Area (1-99)
                  </label>
                  <input
                    id="area-select"
                    type="number"
                    min="1"
                    max="99"
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(parseInt(e.target.value) || 1)}
                    className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="channel-select" className="block text-sm font-medium text-gray-300 mb-2">
                    Channel (1-12)
                  </label>
                  <input
                    id="channel-select"
                    type="number"
                    min="1"
                    max="12"
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(parseInt(e.target.value) || 1)}
                    className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
                  />
                </div>
              </div>

              {effectTab === 'lighting' && (
                <>
                  <div>
                    <label htmlFor="effect-duration" className="block text-sm font-medium text-gray-300 mb-2">
                      Duration (seconds)
                    </label>
                    <input
                      id="effect-duration"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={effectDuration}
                      onChange={(e) => setEffectDuration(parseFloat(e.target.value) || 5)}
                      className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Relay Channels (1-12)
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
                    <p className="text-xs text-gray-400 mt-1">
                      {selectedRelays.length === 0 ? 'Select relay channels (none = all relays)' : `Selected: ${selectedRelays.join(', ')}`}
                    </p>
                  </div>
                </>
              )}

              <div>
                <label htmlFor="controller-select" className="block text-sm font-medium text-gray-300 mb-2">
                  Controller
                </label>
                <select
                  id="controller-select"
                  value={selectedController}
                  onChange={(e) => setSelectedController(e.target.value)}
                  className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
                >
                  <option value="">Select a controller...</option>
                  {controllers
                    .filter(c => c.status === 'connected')
                    .map(controller => (
                      <option key={controller.id} value={controller.id}>
                        {controller.name} ({controller.type})
                      </option>
                    ))}
                </select>
                {controllers.filter(c => c.status === 'connected').length === 0 && (
                  <p className="text-sm text-red-400 mt-1">
                    No controllers connected. Go to Controllers tab to scan for devices.
                  </p>
                )}
              </div>

              <button
                onClick={handleAddToShow}
                className="w-full px-4 py-2 bg-lume-primary hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
              >
                Add to Show
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Full-Width Show Timeline */}
      <div className="bg-gray-800 rounded-lg p-8 shadow-xl border border-gray-700">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Show Timeline</h2>
          <p className="text-gray-400">Timeline view of your show with synchronized audio and effects</p>
        </div>
        
        {!currentShow ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No Show Created</h3>
            <p className="text-gray-500">Create a new show to start building your sequence.</p>
          </div>
        ) : (
          <ShowTimeline
            show={currentShow}
            isPlaying={isPlaying}
            currentTime={currentPlaybackTime}
            onSequenceMove={moveSequence}
            onSequenceDelete={removeShowSequence}
            onSequenceUpdate={updateShowSequence}
            onAudioUpload={setShowAudio}
            onAudioRemove={removeShowAudio}
            onPlay={playShow}
            onPause={stopShow}
            onSeek={seekTo}
          />
        )}
      </div>
    </div>
  );
};
