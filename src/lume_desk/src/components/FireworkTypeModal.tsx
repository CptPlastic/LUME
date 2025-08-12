import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { FireworkType } from '../types';
import { FireworkService } from '../services/firework-service';

interface FireworkTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fireworkType: FireworkType) => void;
  fireworkType?: FireworkType | null;
}

export const FireworkTypeModal: React.FC<FireworkTypeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  fireworkType = null
}) => {
  const [formData, setFormData] = useState<Partial<FireworkType>>({
    name: '',
    category: 'shell',
    duration: 2000,
    intensity: 'medium',
    colors: ['#FF0000'],
    effects: ['burst'],
    safetyDelay: 1000,
    description: '',
    tags: [],
    channelCount: 1
  });

  const [newColor, setNewColor] = useState('#FF0000');
  const [newEffect, setNewEffect] = useState('');
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (fireworkType) {
      setFormData(fireworkType);
    } else {
      setFormData({
        name: '',
        category: 'shell',
        duration: 2000,
        intensity: 'medium',
        colors: ['#FF0000'],
        effects: ['burst'],
        safetyDelay: 1000,
        description: '',
        tags: [],
        channelCount: 1
      });
    }
    setErrors([]);
  }, [fireworkType, isOpen]);

  const categories = [
    { value: 'shell', label: 'Shell' },
    { value: 'cake', label: 'Cake' },
    { value: 'fountain', label: 'Fountain' },
    { value: 'rocket', label: 'Rocket' },
    { value: 'mine', label: 'Mine' },
    { value: 'roman_candle', label: 'Roman Candle' },
    { value: 'sparkler', label: 'Sparkler' },
    { value: 'wheel', label: 'Wheel' }
  ];

  const intensities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'extreme', label: 'Extreme' }
  ];

  const commonEffects = [
    'burst', 'crackle', 'whistle', 'strobe', 'chrysanthemum', 'peony', 'willow',
    'palm', 'ring', 'mine', 'fountain', 'rapid-fire', 'delayed', 'multi-break'
  ];

  const handleInputChange = (field: keyof FireworkType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addColor = () => {
    if (newColor && !formData.colors?.includes(newColor)) {
      handleInputChange('colors', [...(formData.colors || []), newColor]);
      setNewColor('#FF0000');
    }
  };

  const removeColor = (colorToRemove: string) => {
    handleInputChange('colors', formData.colors?.filter(color => color !== colorToRemove) || []);
  };

  const addEffect = () => {
    if (newEffect.trim() && !formData.effects?.includes(newEffect.trim())) {
      handleInputChange('effects', [...(formData.effects || []), newEffect.trim()]);
      setNewEffect('');
    }
  };

  const removeEffect = (effectToRemove: string) => {
    handleInputChange('effects', formData.effects?.filter(effect => effect !== effectToRemove) || []);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      handleInputChange('tags', [...(formData.tags || []), newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags?.filter(tag => tag !== tagToRemove) || []);
  };

  const handleSave = () => {
    const validationErrors = FireworkService.validateFireworkType(formData);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const fireworkTypeToSave: FireworkType = {
      id: fireworkType?.id || FireworkService.generateFireworkId(formData.name || ''),
      name: formData.name!,
      category: formData.category!,
      duration: formData.duration!,
      intensity: formData.intensity!,
      colors: formData.colors!,
      effects: formData.effects!,
      safetyDelay: formData.safetyDelay!,
      description: formData.description,
      tags: formData.tags,
      channelCount: formData.channelCount
    };

    onSave(fireworkTypeToSave);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {fireworkType ? 'Edit Firework Type' : 'Add New Firework Type'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
              <h3 className="text-red-400 font-medium mb-2">Please fix the following errors:</h3>
              <ul className="text-red-300 text-sm space-y-1">
                {errors.map((error) => (
                  <li key={error}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firework-name" className="block text-sm font-medium text-gray-300 mb-2">
                Name *
              </label>
              <input
                id="firework-name"
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
                placeholder="e.g., Large Red Shell"
              />
            </div>

            <div>
              <label htmlFor="firework-category" className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                id="firework-category"
                value={formData.category || 'shell'}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="firework-duration" className="block text-sm font-medium text-gray-300 mb-2">
                Duration (ms) *
              </label>
              <input
                id="firework-duration"
                type="number"
                value={formData.duration || 2000}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
                min="0"
                step="100"
              />
            </div>

            <div>
              <label htmlFor="firework-intensity" className="block text-sm font-medium text-gray-300 mb-2">
                Intensity *
              </label>
              <select
                id="firework-intensity"
                value={formData.intensity || 'medium'}
                onChange={(e) => handleInputChange('intensity', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
              >
                {intensities.map(intensity => (
                  <option key={intensity.value} value={intensity.value}>{intensity.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="firework-safety-delay" className="block text-sm font-medium text-gray-300 mb-2">
                Safety Delay (ms) *
              </label>
              <input
                id="firework-safety-delay"
                type="number"
                value={formData.safetyDelay || 1000}
                onChange={(e) => handleInputChange('safetyDelay', parseInt(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
                min="0"
                step="100"
              />
            </div>

            <div>
              <label htmlFor="firework-channel-count" className="block text-sm font-medium text-gray-300 mb-2">
                Channel Count
              </label>
              <input
                id="firework-channel-count"
                type="number"
                value={formData.channelCount || 1}
                onChange={(e) => handleInputChange('channelCount', parseInt(e.target.value) || 1)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
                min="1"
                max="32"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="firework-description" className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="firework-description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
              rows={3}
              placeholder="Describe the firework's appearance and behavior..."
            />
          </div>

          {/* Colors */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-300 mb-2">
              Colors *
            </legend>
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-12 h-10 bg-gray-800 border border-gray-600 rounded"
              />
              <input
                type="text"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
                placeholder="#FF0000"
              />
              <button
                onClick={addColor}
                className="px-3 py-2 bg-lume-primary hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.colors?.map((color) => (
                <div
                  key={`color-${color}`}
                  className="flex items-center space-x-2 bg-gray-800 rounded-lg px-3 py-2"
                >
                  <div
                    className="w-4 h-4 rounded-full border border-gray-600"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm text-gray-300">{color}</span>
                  <button
                    onClick={() => removeColor(color)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="block text-sm font-medium text-gray-300 mb-2">
              Effects *
            </legend>
            <div className="flex items-center space-x-2 mb-3">
              <select
                value={newEffect}
                onChange={(e) => setNewEffect(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
              >
                <option value="">Select an effect...</option>
                {commonEffects.map(effect => (
                  <option key={effect} value={effect}>{effect}</option>
                ))}
              </select>
              <input
                type="text"
                value={newEffect}
                onChange={(e) => setNewEffect(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
                placeholder="Or type custom effect..."
              />
              <button
                onClick={addEffect}
                className="px-3 py-2 bg-lume-primary hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.effects?.map((effect) => (
                <div
                  key={`effect-${effect}`}
                  className="flex items-center space-x-2 bg-gray-800 rounded-lg px-3 py-1"
                >
                  <span className="text-sm text-gray-300">{effect}</span>
                  <button
                    onClick={() => removeEffect(effect)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </fieldset>

          {/* Tags */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-300 mb-2">
              Tags
            </legend>
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
                placeholder="Add tags for easier searching..."
              />
              <button
                onClick={addTag}
                className="px-3 py-2 bg-lume-primary hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags?.map((tag) => (
                <div
                  key={`tag-${tag}`}
                  className="flex items-center space-x-2 bg-lume-secondary/20 rounded-lg px-3 py-1"
                >
                  <span className="text-sm text-lume-secondary">{tag}</span>
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-lume-primary hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
          >
            {fireworkType ? 'Update' : 'Create'} Firework Type
          </button>
        </div>
      </div>
    </div>
  );
};
