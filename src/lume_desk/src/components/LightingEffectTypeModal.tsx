import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { LightingEffectType } from '../types';
import { LightingEffectService } from '../services/lighting-effect-service';

interface LightingEffectTypeModalProps {
  effectType?: LightingEffectType | null;
  onSave: (effectType: LightingEffectType) => void;
  onCancel: () => void;
}

export const LightingEffectTypeModal: React.FC<LightingEffectTypeModalProps> = ({
  effectType,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<LightingEffectType>>({
    name: '',
    category: 'mood',
    duration: 30000,
    intensity: 'medium',
    effectType: 'solid',
    colors: ['#ffffff'],
    description: '',
    tags: [],
    relayCount: 12,
    interval: 500 // Default to 500ms for better visual effects
  });

  const [newTag, setNewTag] = useState('');
  const [newColor, setNewColor] = useState('#ffffff');
  const [patternInput, setPatternInput] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const categories = LightingEffectService.getCategories();
  const intensityLevels = LightingEffectService.getIntensityLevels();
  const effectTypes = LightingEffectService.getEffectTypes();

  useEffect(() => {
    if (effectType) {
      setFormData({
        ...effectType,
        pattern: effectType.pattern || []
      });
      setPatternInput(effectType.pattern?.join(', ') || '');
    }
  }, [effectType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse pattern from input
    let pattern: number[] | undefined = undefined;
    if (patternInput.trim()) {
      try {
        pattern = patternInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 1 && n <= 12);
      } catch {
        pattern = undefined;
      }
    }

    const finalData: LightingEffectType = {
      ...formData,
      id: effectType?.id || `custom-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: formData.name!,
      category: formData.category!,
      duration: formData.duration!,
      intensity: formData.intensity!,
      effectType: formData.effectType!,
      colors: formData.colors!,
      description: formData.description || '',
      tags: formData.tags || [],
      relayCount: formData.relayCount || 12,
      interval: formData.interval,
      pattern
    } as LightingEffectType;

    // Validate
    const validationErrors = LightingEffectService.validateLightingEffectType(finalData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    onSave(finalData);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const addColor = () => {
    if (newColor && !formData.colors?.includes(newColor)) {
      setFormData(prev => ({
        ...prev,
        colors: [...(prev.colors || []), newColor]
      }));
    }
  };

  const removeColor = (colorToRemove: string) => {
    if (formData.colors && formData.colors.length > 1) {
      setFormData(prev => ({
        ...prev,
        colors: prev.colors?.filter(color => color !== colorToRemove) || []
      }));
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {effectType ? 'Edit Lighting Effect' : 'Create New Lighting Effect'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
              <h4 className="text-red-400 font-medium mb-2">Please fix the following errors:</h4>
              <ul className="text-red-300 text-sm space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white border-b border-gray-700 pb-2">
                Basic Information
              </h3>

              <div>
                <label htmlFor="effect-name" className="block text-sm font-medium text-gray-300 mb-2">
                  Effect Name *
                </label>
                <input
                  id="effect-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
                  placeholder="Enter effect name..."
                  required
                />
              </div>

              <div>
                <label htmlFor="effect-category" className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  id="effect-category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as LightingEffectType['category'] }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
                  required
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {categories.find(c => c.value === formData.category)?.description}
                </p>
              </div>

              <div>
                <label htmlFor="effect-description" className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  id="effect-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
                  placeholder="Describe this lighting effect..."
                  rows={3}
                />
              </div>
            </div>

            {/* Effect Properties */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white border-b border-gray-700 pb-2">
                Effect Properties
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="effect-intensity" className="block text-sm font-medium text-gray-300 mb-2">
                    Intensity *
                  </label>
                  <select
                    id="effect-intensity"
                    value={formData.intensity}
                    onChange={(e) => setFormData(prev => ({ ...prev, intensity: e.target.value as LightingEffectType['intensity'] }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
                    required
                  >
                    {intensityLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="effect-type" className="block text-sm font-medium text-gray-300 mb-2">
                    Effect Type *
                  </label>
                  <select
                    id="effect-type"
                    value={formData.effectType}
                    onChange={(e) => setFormData(prev => ({ ...prev, effectType: e.target.value as LightingEffectType['effectType'] }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
                    required
                  >
                    {effectTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="effect-duration" className="block text-sm font-medium text-gray-300 mb-2">
                    Duration (seconds) *
                  </label>
                  <input
                    id="effect-duration"
                    type="number"
                    min="1"
                    max="3600"
                    value={Math.floor((formData.duration || 30000) / 1000)}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) * 1000 }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Duration: {formatDuration(formData.duration || 30000)}
                  </p>
                </div>

                <div>
                  <label htmlFor="relay-count" className="block text-sm font-medium text-gray-300 mb-2">
                    Relay Count
                  </label>
                  <input
                    id="relay-count"
                    type="number"
                    min="1"
                    max="12"
                    value={formData.relayCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, relayCount: parseInt(e.target.value) }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
                  />
                </div>
              </div>

              {(formData.effectType === 'strobe' || formData.effectType === 'chase' || formData.effectType === 'wave' || formData.effectType === 'random') && (
                <div>
                  <label htmlFor="effect-interval" className="block text-sm font-medium text-gray-300 mb-2">
                    Interval (milliseconds)
                  </label>
                  <div className="space-y-3">
                    <input
                      id="effect-interval"
                      type="number"
                      min="50"
                      max="10000"
                      value={formData.interval || 1000}
                      onChange={(e) => setFormData(prev => ({ ...prev, interval: parseInt(e.target.value) }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
                    />
                    
                    {/* Interval Presets */}
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, interval: 100 }))}
                        className="px-2 py-1 text-xs bg-gray-600 hover:bg-lume-primary text-white rounded transition-colors"
                      >
                        Fast (100ms)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, interval: 500 }))}
                        className="px-2 py-1 text-xs bg-gray-600 hover:bg-lume-primary text-white rounded transition-colors"
                      >
                        Medium (500ms)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, interval: 1000 }))}
                        className="px-2 py-1 text-xs bg-gray-600 hover:bg-lume-primary text-white rounded transition-colors"
                      >
                        Slow (1s)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          let autoInterval = 1000;
                          if (formData.effectType === 'strobe') autoInterval = 500;
                          else if (formData.effectType === 'chase') autoInterval = 300;
                          else if (formData.effectType === 'wave') autoInterval = 400;
                          else if (formData.effectType === 'random') autoInterval = 800;
                          else autoInterval = Math.floor(formData.duration! / 20); // Duration/20 for others
                          
                          setFormData(prev => ({ ...prev, interval: autoInterval }));
                        }}
                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                      >
                        Auto
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-400">
                      Time between changes. Auto sets optimal interval based on effect type.
                    </p>
                  </div>
                </div>
              )}

              {/* Show pattern field for ALL effect types */}
              <div>
                <label htmlFor="relay-pattern" className="block text-sm font-medium text-gray-300 mb-2">
                  Relay Pattern (Optional)
                </label>
                <input
                  id="relay-pattern"
                  type="text"
                  value={patternInput}
                  onChange={(e) => setPatternInput(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
                  placeholder="e.g., 1, 3, 5, 7 or 1, 2, 3, 4"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Comma-separated relay numbers (1-12). Leave empty to use all relays.
                  {formData.effectType === 'solid' && ' For solid effects, only these relays will stay ON.'}
                </p>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div>
            <h3 className="text-lg font-medium text-white border-b border-gray-700 pb-2 mb-4">
              Colors
            </h3>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.colors?.map((color, index) => (
                <div key={`${color}-${index}`} className="flex items-center space-x-2 bg-gray-700 rounded-lg p-2">
                  <div
                    className="w-6 h-6 rounded border border-gray-600"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-white text-sm font-mono">{color}</span>
                  {formData.colors && formData.colors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeColor(color)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-12 h-10 bg-gray-700 border border-gray-600 rounded cursor-pointer"
              />
              <input
                type="text"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent font-mono"
                placeholder="#ffffff"
              />
              <button
                type="button"
                onClick={addColor}
                className="px-3 py-2 bg-lume-primary hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-lg font-medium text-white border-b border-gray-700 pb-2 mb-4">
              Tags
            </h3>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.tags?.map((tag, index) => (
                <div key={`${tag}-${index}`} className="flex items-center space-x-2 bg-gray-700 rounded-full px-3 py-1">
                  <span className="text-white text-sm">{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
                placeholder="Add a tag..."
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 bg-lume-primary hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-lume-primary hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
            >
              {effectType ? 'Update Effect' : 'Create Effect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
