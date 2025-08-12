import React from 'react';
import { Edit2, Trash2, Clock, Zap, Palette, Tag } from 'lucide-react';
import type { FireworkType } from '../types';

interface FireworkTypeCardProps {
  fireworkType: FireworkType;
  onEdit: (fireworkType: FireworkType) => void;
  onDelete: (id: string) => void;
  onSelect?: (fireworkType: FireworkType) => void;
  isSelected?: boolean;
  showActions?: boolean;
}

export const FireworkTypeCard: React.FC<FireworkTypeCardProps> = ({
  fireworkType,
  onEdit,
  onDelete,
  onSelect,
  isSelected = false,
  showActions = true
}) => {
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

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(fireworkType);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onSelect(fireworkType);
    }
  };

  return (
    <div 
      className={`
        bg-gray-800 rounded-lg border p-4 transition-all duration-200 hover:shadow-lg
        ${isSelected ? 'border-lume-primary ring-2 ring-lume-primary/50' : 'border-gray-700 hover:border-gray-600'}
        ${onSelect ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-lume-primary' : ''}
      `}
      onClick={onSelect ? handleCardClick : undefined}
      onKeyDown={onSelect ? handleKeyDown : undefined}
      {...(onSelect ? { tabIndex: 0, role: 'button' } : { role: 'article' })}
      aria-label={onSelect ? `Select ${fireworkType.name}` : fireworkType.name}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getCategoryIcon(fireworkType.category)}</span>
          <div>
            <h3 className="font-semibold text-white">{fireworkType.name}</h3>
            <p className="text-sm text-gray-400 capitalize">{fireworkType.category.replace('_', ' ')}</p>
          </div>
        </div>
        
        {showActions && (
          <div className="flex space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(fireworkType);
              }}
              className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
              title="Edit firework type"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete "${fireworkType.name}"?`)) {
                  onDelete(fireworkType.id);
                }
              }}
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
              title="Delete firework type"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      {fireworkType.description && (
        <p className="text-sm text-gray-300 mb-3">{fireworkType.description}</p>
      )}

      {/* Properties */}
      <div className="space-y-2 mb-3">
        {/* Duration & Intensity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-sm text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{formatDuration(fireworkType.duration)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-3 h-3 text-gray-400" />
            <span className={`px-2 py-0.5 rounded-full text-xs text-white ${getIntensityColor(fireworkType.intensity)}`}>
              {fireworkType.intensity}
            </span>
          </div>
        </div>

        {/* Safety Delay */}
        <div className="flex items-center space-x-1 text-sm text-gray-400">
          <span className="text-red-400">⚠️</span>
          <span>Safety delay: {formatDuration(fireworkType.safetyDelay)}</span>
        </div>

        {/* Channel Count */}
        {fireworkType.channelCount && fireworkType.channelCount > 1 && (
          <div className="flex items-center space-x-1 text-sm text-gray-400">
            <span>📡</span>
            <span>{fireworkType.channelCount} channels</span>
          </div>
        )}
      </div>

      {/* Colors */}
      {fireworkType.colors.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center space-x-2 mb-1">
            <Palette className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">Colors</span>
          </div>
          <div className="flex space-x-1">
            {fireworkType.colors.slice(0, 6).map((color) => (
              <div
                key={`${fireworkType.id}-color-${color}`}
                className="w-4 h-4 rounded-full border border-gray-600"
                style={{ backgroundColor: color.startsWith('#') ? color : `var(--color-${color})` }}
                title={color}
              />
            ))}
            {fireworkType.colors.length > 6 && (
              <span className="text-xs text-gray-400 ml-1">+{fireworkType.colors.length - 6}</span>
            )}
          </div>
        </div>
      )}

      {/* Effects */}
      {fireworkType.effects.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-gray-400">✨</span>
            <span className="text-xs text-gray-400">Effects</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {fireworkType.effects.slice(0, 3).map((effect) => (
              <span
                key={`${fireworkType.id}-effect-${effect}`}
                className="px-2 py-0.5 bg-gray-700 text-xs text-gray-300 rounded"
              >
                {effect}
              </span>
            ))}
            {fireworkType.effects.length > 3 && (
              <span className="text-xs text-gray-400">+{fireworkType.effects.length - 3}</span>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {fireworkType.tags && fireworkType.tags.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Tag className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">Tags</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {fireworkType.tags.slice(0, 3).map((tag) => (
              <span
                key={`${fireworkType.id}-tag-${tag}`}
                className="px-1.5 py-0.5 bg-lume-secondary/20 text-xs text-lume-secondary rounded"
              >
                {tag}
              </span>
            ))}
            {fireworkType.tags.length > 3 && (
              <span className="text-xs text-gray-400">+{fireworkType.tags.length - 3}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
