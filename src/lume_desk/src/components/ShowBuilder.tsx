import React, { useState, useMemo } from 'react';
import { Plus, Play, Pause, Trash2, Settings, Clock } from 'lucide-react';
import { useLumeStore } from '../store/lume-store';
import type { ShowSequence, FireworkType } from '../types';
import { FireworkTypeCard } from './FireworkTypeCard';

export const ShowBuilder: React.FC = () => {
  const { 
    controllers,
    fireworkTypes, 
    currentShow, 
    createShow, 
    addShowSequence, 
    removeShowSequence,
    isPlaying,
    playShow,
    stopShow
  } = useLumeStore();

  const [showName, setShowName] = useState('New Firework Show');
  const [showDescription, setShowDescription] = useState('');
  const [selectedFireworkType, setSelectedFireworkType] = useState<FireworkType | null>(null);
  const [sequenceTime, setSequenceTime] = useState(0);
  const [selectedController, setSelectedController] = useState('');
  const [selectedArea, setSelectedArea] = useState(1);
  const [selectedChannel, setSelectedChannel] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Calculate show duration and statistics
  const showStats = useMemo(() => {
    if (!currentShow?.sequences) {
      return { duration: 0, totalFireworks: 0, controllers: new Set(), channels: new Set() };
    }

    const sequences = currentShow.sequences;
    const maxTime = sequences.reduce((max, seq) => {
      const endTime = seq.timestamp + (seq.fireworkType?.duration || 0);
      return Math.max(max, endTime);
    }, 0);

    const controllers = new Set(sequences.map(seq => seq.controllerId));
    const channels = new Set(sequences.map(seq => seq.channel));

    return {
      duration: maxTime,
      totalFireworks: sequences.length,
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

  const categories = ['shell', 'cake', 'fountain', 'roman-candle', 'mine', 'comet', 'strobe', 'sparkler', 'smoke'];

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
      selectedFireworkType: selectedFireworkType?.name,
      currentShow: currentShow?.name,
      selectedController,
      selectedArea,
      selectedChannel,
      sequenceTime
    });

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
      timestamp: sequenceTime * 1000, // Convert to milliseconds
      fireworkTypeId: selectedFireworkType.id,
      fireworkType: selectedFireworkType,
      controllerId: selectedController,
      area: selectedArea,
      channel: selectedChannel,
      delay: 0,
      repeat: 1
    };

    console.log('✅ Adding sequence:', sequence);
    addShowSequence(sequence);
    console.log('📊 Current show after adding:', currentShow?.sequences.length, 'sequences');
    
    // Auto-increment time by safety delay + duration for next firework
    const nextTime = sequenceTime + (selectedFireworkType.duration / 1000) + (selectedFireworkType.safetyDelay / 1000);
    setSequenceTime(Math.round(nextTime * 10) / 10); // Round to 1 decimal
    console.log('⏰ Auto-incremented time to:', nextTime);
  };

  const handleRemoveSequence = (sequenceId: string) => {
    console.log('🗑️ Remove sequence clicked:', sequenceId);
    setConfirmDelete(sequenceId);
  };

  const confirmRemoveSequence = () => {
    if (confirmDelete) {
      console.log('✅ User confirmed removal, calling removeShowSequence');
      removeShowSequence(confirmDelete);
      console.log('✅ removeShowSequence called, current show sequences:', currentShow?.sequences.length);
      setConfirmDelete(null);
    }
  };

  const cancelRemoveSequence = () => {
    console.log('❌ User cancelled removal');
    setConfirmDelete(null);
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
            Create timed firework sequences using your firework type library
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
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
              <span className="text-green-200">{formatTime(showStats.duration)} duration</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Firework Type Selection */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Add Fireworks</h2>
          
          {/* Firework Type Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search firework types..."
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
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Firework Types Grid */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredFireworkTypes.map((fireworkType) => (
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
                }}
              >
                <FireworkTypeCard
                  fireworkType={fireworkType}
                  onEdit={() => {}} // Disabled in show builder
                  onDelete={() => {}} // Disabled in show builder
                  onSelect={() => setSelectedFireworkType(fireworkType)}
                  isSelected={selectedFireworkType?.id === fireworkType.id}
                  showActions={false}
                />
              </button>
            ))}
          </div>

          {/* Add to Show Controls */}
          {selectedFireworkType && (
            <div className="mt-6 p-4 bg-gray-700 rounded-lg space-y-4">
              <h3 className="font-medium text-white">Add "{selectedFireworkType.name}" to Show</h3>
              
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

        {/* Show Timeline */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Show Timeline</h2>
          
          {!currentShow && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">No Show Created</h3>
              <p className="text-gray-500">Create a new show to start building your sequence.</p>
            </div>
          )}

          {currentShow && currentShow.sequences.length === 0 && (
            <div className="text-center py-12">
              <Plus className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">Empty Show</h3>
              <p className="text-gray-500">Add fireworks to your show to see the timeline.</p>
            </div>
          )}

          {currentShow && currentShow.sequences.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {(() => {
                const sortedSequences = [...currentShow.sequences].sort((a, b) => a.timestamp - b.timestamp);
                console.log('📅 Timeline showing sequences:', sortedSequences.map(s => ({ id: s.id, name: s.fireworkType?.name })));
                return sortedSequences;
              })()
                .map((sequence) => (
                  <div
                    key={sequence.id}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-mono text-lume-primary">
                          {formatTime(sequence.timestamp)}
                        </div>
                        <div className="text-white font-medium">
                          {sequence.fireworkType?.name || 'Unknown Firework'}
                        </div>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {sequence.controllerId} • Area {sequence.area} • Channel {sequence.channel}
                        {sequence.fireworkType && (
                          <span> • {formatTime(sequence.fireworkType.duration)}</span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('🗑️ Delete button clicked for sequence:', sequence.id);
                        handleRemoveSequence(sequence.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
                      title="Remove firework from show"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-white mb-4">Remove Firework</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to remove this firework from the show? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={cancelRemoveSequence}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveSequence}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
