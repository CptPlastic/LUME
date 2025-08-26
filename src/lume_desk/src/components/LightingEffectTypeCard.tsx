import React from 'react';
import { Zap, Clock, Edit, Trash2, Lightbulb, Flashlight, Play, Copy, Loader2, Eye } from 'lucide-react';
import type { LightingEffectType } from '../types';

interface LightingEffectTypeCardProps {
  lightingEffectType: LightingEffectType;
  onEdit: (effectType: LightingEffectType) => void;
  onDelete: (id: string) => void;
  onTest?: (effectType: LightingEffectType) => void;
  onPreview?: (effectType: LightingEffectType) => void;
  onDuplicate?: (effectType: LightingEffectType) => void;
  onSelect?: (effectType: LightingEffectType) => void;
  isSelected?: boolean;
  showActions?: boolean;
  showSelection?: boolean;
  isLoading?: boolean;
}

export const LightingEffectTypeCard: React.FC<LightingEffectTypeCardProps> = ({
  lightingEffectType,
  onEdit,
  onDelete,
  onTest,
  onPreview,
  onDuplicate,
  onSelect,
  isSelected = false,
  showActions = true,
  showSelection = false,
  isLoading = false
}) => {
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'low': return 'text-blue-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'extreme': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getCategoryIcon = (category: LightingEffectType['category']) => {
    switch (category) {
      case 'mood': return <Lightbulb className="w-4 h-4" />;
      case 'party': return <Zap className="w-4 h-4" />;
      case 'strobe': return <Flashlight className="w-4 h-4" />;
      case 'chase': return <Zap className="w-4 h-4" />;
      case 'wave': return <Lightbulb className="w-4 h-4" />;
      case 'pattern': return <Zap className="w-4 h-4" />;
      case 'special': return <Lightbulb className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: LightingEffectType['category']) => {
    switch (category) {
      case 'mood': return 'text-blue-400 bg-blue-400/10';
      case 'party': return 'text-purple-400 bg-purple-400/10';
      case 'strobe': return 'text-yellow-400 bg-yellow-400/10';
      case 'chase': return 'text-green-400 bg-green-400/10';
      case 'wave': return 'text-indigo-400 bg-indigo-400/10';
      case 'pattern': return 'text-cyan-400 bg-cyan-400/10';
      case 'special': return 'text-pink-400 bg-pink-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(lightingEffectType);
    }
  };

  const handleSelectionClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(lightingEffectType);
    }
  };

  return (
    <div 
      className={`p-4 rounded-lg border transition-all duration-200 ${
        isSelected && showSelection
          ? 'border-blue-500 bg-blue-900/20' 
          : isSelected 
          ? 'border-lume-primary bg-gray-700/50' 
          : 'border-gray-600 bg-gray-750 hover:border-gray-500'
      } ${onSelect && !showSelection ? 'cursor-pointer' : ''}`}
      onClick={!showSelection ? handleCardClick : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1">
          {showSelection && (
            <div className="flex-shrink-0">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleSelectionClick}
                className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-white text-lg">{lightingEffectType.name}</h3>
              <div className={`p-1 rounded ${getCategoryColor(lightingEffectType.category)}`}>
                {getCategoryIcon(lightingEffectType.category)}
              </div>
            </div>
          
          <div className="flex items-center space-x-3 text-sm">
            <span className={`capitalize font-medium ${getCategoryColor(lightingEffectType.category).split(' ')[0]}`}>
              {lightingEffectType.category}
            </span>
            <span className="text-gray-400">•</span>
            <span className={`capitalize font-medium ${getIntensityColor(lightingEffectType.intensity)}`}>
              {lightingEffectType.intensity}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-300 capitalize">{lightingEffectType.effectType}</span>
          </div>
          </div>
        </div>
        
        {showActions && !showSelection && (
          <div className="flex space-x-1 ml-2">
            {onPreview && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(lightingEffectType);
                }}
                className={`p-1.5 transition-colors ${
                  isLoading 
                    ? 'text-blue-400 cursor-not-allowed'
                    : 'text-gray-400 hover:text-blue-400'
                }`}
                title={isLoading ? "Testing in progress..." : "Quick preview (2s)"}
                disabled={isLoading}
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {onTest && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTest(lightingEffectType);
                }}
                className={`p-1.5 transition-colors ${
                  isLoading 
                    ? 'text-green-400 cursor-not-allowed'
                    : 'text-gray-400 hover:text-green-400'
                }`}
                title={isLoading ? "Testing in progress..." : "Test full effect"}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>
            )}
            {onDuplicate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(lightingEffectType);
                }}
                className="p-1.5 text-gray-400 hover:text-yellow-400 transition-colors"
                title="Duplicate lighting effect"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(lightingEffectType);
              }}
              className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
              title="Edit lighting effect"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(lightingEffectType.id);
              }}
              className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
              title="Delete lighting effect"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      {lightingEffectType.description && (
        <p className="text-gray-300 text-sm mb-3 leading-relaxed">
          {lightingEffectType.description}
        </p>
      )}

      {/* Colors Preview */}
      <div className="flex items-center space-x-2 mb-3">
        <span className="text-xs text-gray-400 font-medium">Colors:</span>
        <div className="flex space-x-1">
          {lightingEffectType.colors.slice(0, 5).map((color, index) => (
            <div
              key={index}
              className="w-4 h-4 rounded border border-gray-600"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
          {lightingEffectType.colors.length > 5 && (
            <span className="text-xs text-gray-400 ml-1">
              +{lightingEffectType.colors.length - 5} more
            </span>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300">Duration:</span>
          <span className="text-white font-medium">{formatDuration(lightingEffectType.duration)}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300">Relays:</span>
          <span className="text-white font-medium">{lightingEffectType.relayCount || 12}</span>
        </div>

        {lightingEffectType.interval && (
          <div className="flex items-center space-x-2 col-span-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">Interval:</span>
            <span className="text-white font-medium">{lightingEffectType.interval}ms</span>
          </div>
        )}

        {lightingEffectType.pattern && lightingEffectType.pattern.length > 0 && (
          <div className="flex items-center space-x-2 col-span-2">
            <Zap className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">Pattern:</span>
            <span className="text-white font-medium font-mono">
              [{lightingEffectType.pattern.slice(0, 6).join(', ')}
              {lightingEffectType.pattern.length > 6 ? '...' : ''}]
            </span>
          </div>
        )}
      </div>

      {/* Tags */}
      {lightingEffectType.tags && lightingEffectType.tags.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="flex flex-wrap gap-1">
            {lightingEffectType.tags.slice(0, 4).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {lightingEffectType.tags.length > 4 && (
              <span className="px-2 py-1 bg-gray-600 text-gray-400 text-xs rounded-full">
                +{lightingEffectType.tags.length - 4}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
