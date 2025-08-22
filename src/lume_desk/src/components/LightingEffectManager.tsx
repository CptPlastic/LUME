import React, { useState, useMemo } from 'react';
import { Plus, Settings, Search, Lightbulb } from 'lucide-react';
import { useLumeStore } from '../store/lume-store';
import { LightingEffectTypeCard } from './LightingEffectTypeCard';
import { LightingEffectTypeModal } from './LightingEffectTypeModal';
import type { LightingEffectType } from '../types';
import { LightingEffectService } from '../services/lighting-effect-service';

export const LightingEffectManager: React.FC = () => {
  const { lightingEffectTypes, addLightingEffectType, updateLightingEffectType, removeLightingEffectType } = useLumeStore();

  const [showModal, setShowModal] = useState(false);
  const [editingEffect, setEditingEffect] = useState<LightingEffectType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterIntensity, setFilterIntensity] = useState('');
  const [filterEffectType, setFilterEffectType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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
        
        <button
          onClick={handleCreateNew}
          className="flex items-center space-x-2 px-4 py-2 bg-lume-primary hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Effect</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 rounded-lg p-6 space-y-4">
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
