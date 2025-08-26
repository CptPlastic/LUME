import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Play, Pause, Settings, Clock, Lightbulb, Zap, Download, Upload } from 'lucide-react';
import { useLumeStore } from '../store/lume-store';
import type { ShowSequence, FireworkType, LightingEffectType, ShowFile } from '../types';
import { EnhancedShowTimeline } from './EnhancedShowTimeline';

// Compact card components for better show builder experience
const CompactFireworkCard: React.FC<{ fireworkType: FireworkType }> = ({ fireworkType }) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'shell': return '🎆';
      case 'cake': return '🧁';
      case 'fountain': return '⛲';
      case 'rocket': return '🚀';
      case 'mine': return '💎';
      case 'roman_candle': return '🕯️';
      case 'sparkler': return '✨';
      case 'wheel': return '🎡';
      default: return '🎇';
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'extreme': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="p-4 h-full">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-3">
        <span className="text-3xl">{getCategoryIcon(fireworkType.category)}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-lg truncate">{fireworkType.name}</h3>
          <p className="text-sm text-gray-400 capitalize">{fireworkType.category.replace('_', ' ')}</p>
        </div>
      </div>

      {/* Key Info */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-sm text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{formatDuration(fireworkType.duration)}</span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs text-white ${getIntensityColor(fireworkType.intensity)}`}>
            {fireworkType.intensity}
          </span>
        </div>
        
        {fireworkType.channelCount && fireworkType.channelCount > 1 && (
          <div className="text-sm text-gray-400">
            📡 {fireworkType.channelCount} channels
          </div>
        )}
      </div>

      {/* Colors Preview */}
      {fireworkType.colors.length > 0 && (
        <div className="flex space-x-1 mb-3">
          {fireworkType.colors.slice(0, 5).map((color, idx) => (
            <div
              key={idx}
              className="w-4 h-4 rounded-full border border-gray-600"
              style={{ backgroundColor: color.startsWith('#') ? color : `var(--color-${color})` }}
            />
          ))}
          {fireworkType.colors.length > 5 && (
            <span className="text-xs text-gray-400">+{fireworkType.colors.length - 5}</span>
          )}
        </div>
      )}

      {/* Effects */}
      {fireworkType.effects.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {fireworkType.effects.slice(0, 2).map((effect, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded"
            >
              {effect}
            </span>
          ))}
          {fireworkType.effects.length > 2 && (
            <span className="text-xs text-gray-400">+{fireworkType.effects.length - 2}</span>
          )}
        </div>
      )}
    </div>
  );
};

const CompactLightingCard: React.FC<{ lightingEffect: LightingEffectType }> = ({ lightingEffect }) => {
  const getEffectIcon = (effectType: string) => {
    switch (effectType) {
      case 'solid': return '🔆';
      case 'strobe': return '⚡';
      case 'chase': return '🌊';
      case 'fade': return '🌅';
      case 'random': return '🎲';
      default: return '💡';
    }
  };

  const formatDuration = (seconds: number) => {
    return `${seconds}s`;
  };

  return (
    <div className="p-4 h-full">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-3">
        <span className="text-3xl">{getEffectIcon(lightingEffect.effectType)}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-lg truncate">{lightingEffect.name}</h3>
          <p className="text-sm text-gray-400 capitalize">{lightingEffect.category}</p>
        </div>
      </div>

      {/* Key Info */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-sm text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{formatDuration(lightingEffect.duration)}</span>
          </div>
          <span className="px-2 py-1 bg-blue-600 rounded-full text-xs text-white">
            {lightingEffect.effectType}
          </span>
        </div>
        
        {lightingEffect.interval && (
          <div className="text-sm text-gray-400">
            ⏱️ {lightingEffect.interval}ms interval
          </div>
        )}
      </div>

      {/* Color Preview */}
      {lightingEffect.colors && lightingEffect.colors.length > 0 && (
        <div className="flex items-center space-x-2 mb-3">
          <div
            className="w-6 h-6 rounded-full border border-gray-600"
            style={{ backgroundColor: lightingEffect.colors[0] }}
          />
          <span className="text-sm text-gray-400">{lightingEffect.colors[0]}</span>
        </div>
      )}

      {/* Tags */}
      {lightingEffect.tags && lightingEffect.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {lightingEffect.tags.slice(0, 2).map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-blue-700/30 text-xs text-blue-300 rounded"
            >
              {tag}
            </span>
          ))}
          {lightingEffect.tags.length > 2 && (
            <span className="text-xs text-gray-400">+{lightingEffect.tags.length - 2}</span>
          )}
        </div>
      )}
    </div>
  );
};

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
    console.log('🔽 Export button clicked!');
    console.log('🔍 Current show:', currentShow);
    
    if (!currentShow) {
      console.log('❌ No current show');
      alert('No show to export');
      return;
    }
    
    try {
      console.log('📤 Calling downloadShow with ID:', currentShow.id);
      await downloadShow(currentShow.id);
      console.log('✅ downloadShow completed successfully');
    } catch (error) {
      console.error('❌ Export failed:', error);
      alert(`Failed to export show. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  
  // Auto-select appropriate controller when switching effect types
  useEffect(() => {
    if (effectTab === 'fireworks') {
      // Auto-select first firework controller
      const fireworkController = controllers.find(c => c.type === 'firework');
      if (fireworkController && selectedController !== fireworkController.id) {
        setSelectedController(fireworkController.id);
        console.log('🎆 Auto-selected firework controller:', fireworkController.name);
      }
    } else if (effectTab === 'lighting') {
      // Auto-select first lighting controller  
      const lightingController = controllers.find(c => c.type === 'lights');
      if (lightingController && selectedController !== lightingController.id) {
        setSelectedController(lightingController.id);
        console.log('💡 Auto-selected lighting controller:', lightingController.name);
      }
    }
  }, [effectTab, controllers, selectedController]);
  
  // Initialize with appropriate controller on first load
  useEffect(() => {
    if (!selectedController && controllers.length > 0) {
      const defaultController = effectTab === 'fireworks' 
        ? controllers.find(c => c.type === 'firework')
        : controllers.find(c => c.type === 'lights');
        
      if (defaultController) {
        setSelectedController(defaultController.id);
        console.log('🎯 Initial controller selection:', defaultController.name);
      }
    }
  }, [controllers, selectedController, effectTab]);
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

      {/* Expanded Effect Library Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        {/* Tab Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setEffectTab('fireworks');
                setFilterCategory('');
                setSearchTerm('');
              }}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                effectTab === 'fireworks'
                  ? 'bg-lume-primary text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <Zap className="w-5 h-5" />
              <span>Fireworks</span>
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                {filteredFireworkTypes.length}
              </span>
            </button>
            <button
              onClick={() => {
                setEffectTab('lighting');
                setFilterCategory('');
                setSearchTerm('');
                setSelectedRelays([]); // Reset relay selection when switching to lighting
              }}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                effectTab === 'lighting'
                  ? 'bg-lume-primary text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <Lightbulb className="w-5 h-5" />
              <span>Lighting Effects</span>
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                {filteredLightingEffects.length}
              </span>
            </button>
          </div>

          <h2 className="text-2xl font-bold text-white">
            {effectTab === 'fireworks' ? 'Fireworks Library' : 'Lighting Effects Library'}
          </h2>
        </div>
        
        {/* Effect Type Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <input
              type="text"
              placeholder={`Search ${effectTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent text-lg"
            />
          </div>
          
          <div className="flex space-x-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
            >
              <option value="">All Categories</option>
              {getCurrentCategories().map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-lg transition-colors ${
                showFilters ? 'bg-lume-primary text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Enhanced Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto pr-2">
          {effectTab === 'fireworks' && filteredFireworkTypes.map((fireworkType) => (
            <div
              key={fireworkType.id}
              className={`cursor-pointer rounded-lg border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                selectedFireworkType?.id === fireworkType.id
                  ? 'border-lume-primary bg-gray-700 ring-2 ring-lume-primary/50'
                  : 'border-gray-600 hover:border-gray-500 bg-gray-750'
              }`}
              onClick={() => {
                console.log('🎆 Firework selected:', fireworkType.name);
                setSelectedFireworkType(fireworkType);
                setSelectedLightingEffect(null);
              }}
            >
              <CompactFireworkCard
                fireworkType={fireworkType}
              />
            </div>
          ))}

          {effectTab === 'lighting' && filteredLightingEffects.map((lightingEffect) => (
            <div
              key={lightingEffect.id}
              className={`cursor-pointer rounded-lg border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                selectedLightingEffect?.id === lightingEffect.id
                  ? 'border-lume-primary bg-gray-700 ring-2 ring-lume-primary/50'
                  : 'border-gray-600 hover:border-gray-500 bg-gray-750'
              }`}
              onClick={() => {
                console.log('💡 Lighting effect selected:', lightingEffect.name);
                setSelectedLightingEffect(lightingEffect);
                setSelectedFireworkType(null);
                setSelectedRelays([]); // Reset relay selection
              }}
            >
              <CompactLightingCard
                lightingEffect={lightingEffect}
              />
            </div>
          ))}
        </div>

        {/* No Results Message */}
        {((effectTab === 'fireworks' && filteredFireworkTypes.length === 0) ||
          (effectTab === 'lighting' && filteredLightingEffects.length === 0)) && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No {effectTab} found</h3>
            <p className="text-gray-500">
              {searchTerm || filterCategory 
                ? 'Try adjusting your search or filter criteria'
                : `No ${effectTab} available. Create some in the ${effectTab === 'fireworks' ? 'Firework Types' : 'Lighting Effects'} page.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Add to Show Panel */}
      {(selectedFireworkType || selectedLightingEffect) && (
        <div className="bg-gray-800 rounded-lg p-6 border-2 border-lume-primary/50">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-lume-primary rounded-lg">
              {effectTab === 'fireworks' ? <Zap className="w-6 h-6 text-white" /> : <Lightbulb className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Add to Show
              </h3>
              <p className="text-gray-400">
                "{selectedFireworkType?.name || selectedLightingEffect?.name}"
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent text-lg"
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
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent text-lg"
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
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent text-lg"
              />
            </div>
          </div>

          {effectTab === 'lighting' && (
            <div className="mt-6 space-y-6">
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
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent text-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Relay Channels (1-12)
                </label>
                <div className="grid grid-cols-6 gap-3">
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
                      className={`p-3 text-lg font-medium rounded-lg border transition-colors ${
                        selectedRelays.includes(relay)
                          ? 'bg-lume-primary border-lume-primary text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {relay}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  {selectedRelays.length === 0 ? 'No channels selected (will use all relays)' : `Selected channels: ${selectedRelays.join(', ')}`}
                </p>
              </div>
            </div>
          )}

          <div className="mt-6">
            <label htmlFor="controller-select" className="block text-sm font-medium text-gray-300 mb-2">
              Controller
            </label>
            <select
              id="controller-select"
              value={selectedController}
              onChange={(e) => setSelectedController(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent text-lg"
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
              <p className="text-sm text-red-400 mt-2">
                No controllers connected. Go to Controllers tab to scan for devices.
              </p>
            )}
          </div>

          <button
            onClick={handleAddToShow}
            className="w-full mt-6 px-6 py-4 bg-lume-primary hover:bg-orange-600 text-white rounded-lg font-bold text-lg transition-colors transform hover:scale-105"
          >
            Add to Show
          </button>
        </div>
      )}

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
          <EnhancedShowTimeline
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
