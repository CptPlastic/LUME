import type { LightingEffectType } from '../types';

export class LightingEffectService {
  /**
   * Get default lighting effect types for new installations
   */
  static getDefaultLightingEffectTypes(): LightingEffectType[] {
    return [
      // Basic solid colors
      {
        id: 'solid-white',
        name: 'Solid White',
        category: 'mood',
        duration: 30000, // 30 seconds default
        intensity: 'high',
        effectType: 'solid',
        colors: ['#ffffff'],
        description: 'All lights on at full brightness',
        tags: ['basic', 'white', 'bright'],
        relayCount: 12
      },
      {
        id: 'solid-warm',
        name: 'Warm Glow',
        category: 'mood',
        duration: 60000, // 1 minute
        intensity: 'medium',
        effectType: 'solid',
        colors: ['#ffa500'],
        description: 'Warm ambient lighting for relaxation',
        tags: ['warm', 'ambient', 'cozy'],
        relayCount: 12
      },
      {
        id: 'solid-dim',
        name: 'Dim Light',
        category: 'mood',
        duration: 120000, // 2 minutes
        intensity: 'low',
        effectType: 'solid',
        colors: ['#ffebcd'],
        description: 'Low intensity ambient lighting',
        tags: ['dim', 'ambient', 'night'],
        relayCount: 12
      },

      // Strobe effects
      {
        id: 'strobe-fast',
        name: 'Fast Strobe',
        category: 'strobe',
        duration: 10000, // 10 seconds
        intensity: 'extreme',
        effectType: 'strobe',
        colors: ['#ffffff'],
        interval: 100, // 100ms on/off
        description: 'Rapid flashing strobe effect',
        tags: ['strobe', 'fast', 'party'],
        relayCount: 12
      },
      {
        id: 'strobe-slow',
        name: 'Slow Pulse',
        category: 'strobe',
        duration: 30000, // 30 seconds
        intensity: 'medium',
        effectType: 'strobe',
        colors: ['#87ceeb'],
        interval: 1000, // 1 second on/off
        description: 'Slow pulsing strobe effect',
        tags: ['strobe', 'slow', 'pulse'],
        relayCount: 12
      },
      {
        id: 'strobe-party',
        name: 'Party Strobe',
        category: 'party',
        duration: 60000, // 1 minute
        intensity: 'high',
        effectType: 'strobe',
        colors: ['#ff0000', '#00ff00', '#0000ff'],
        interval: 200, // 200ms cycles
        description: 'Multi-color party strobe',
        tags: ['party', 'colorful', 'strobe'],
        relayCount: 12
      },

      // Chase effects
      {
        id: 'chase-smooth',
        name: 'Smooth Chase',
        category: 'chase',
        duration: 45000, // 45 seconds
        intensity: 'medium',
        effectType: 'chase',
        colors: ['#add8e6'],
        interval: 500, // 500ms per relay
        description: 'Lights chase in sequence smoothly',
        tags: ['chase', 'smooth', 'sequential'],
        relayCount: 12
      },
      {
        id: 'chase-fast',
        name: 'Fast Chase',
        category: 'chase',
        duration: 20000, // 20 seconds
        intensity: 'high',
        effectType: 'chase',
        colors: ['#ffff00'],
        interval: 150, // 150ms per relay
        description: 'Quick sequential light chase',
        tags: ['chase', 'fast', 'dynamic'],
        relayCount: 12
      },
      {
        id: 'chase-reverse',
        name: 'Reverse Chase',
        category: 'chase',
        duration: 30000, // 30 seconds
        intensity: 'medium',
        effectType: 'chase',
        colors: ['#ff69b4'],
        interval: 300, // 300ms per relay
        description: 'Lights chase in reverse order',
        tags: ['chase', 'reverse', 'pattern'],
        relayCount: 12
      },

      // Wave effects
      {
        id: 'wave-gentle',
        name: 'Gentle Wave',
        category: 'wave',
        duration: 90000, // 1.5 minutes
        intensity: 'low',
        effectType: 'wave',
        colors: ['#87ceeb'],
        interval: 800, // 0.8 second wave cycles
        description: 'Gentle wave flowing across relays',
        tags: ['wave', 'gentle', 'flowing'],
        relayCount: 12
      },
      {
        id: 'wave-dramatic',
        name: 'Dramatic Wave',
        category: 'wave',
        duration: 60000, // 1 minute
        intensity: 'high',
        effectType: 'wave',
        colors: ['#4682b4'],
        interval: 400, // 0.4 second wave cycles
        description: 'Fast dramatic wave with strong visual impact',
        tags: ['wave', 'dramatic', 'fast'],
        relayCount: 12
      },

      // Random/pattern effects
      {
        id: 'random-sparkle',
        name: 'Random Sparkle',
        category: 'special',
        duration: 45000, // 45 seconds
        intensity: 'medium',
        effectType: 'random',
        colors: ['#ffffff', '#ffff00', '#87ceeb'],
        interval: 200, // 200ms random changes
        description: 'Random twinkling sparkle effect',
        tags: ['random', 'sparkle', 'magical'],
        relayCount: 12
      },
      {
        id: 'random-chaos',
        name: 'Chaos Mode',
        category: 'party',
        duration: 30000, // 30 seconds
        intensity: 'extreme',
        effectType: 'random',
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'],
        interval: 100, // 100ms random changes
        description: 'Chaotic random light patterns',
        tags: ['random', 'chaos', 'party', 'extreme'],
        relayCount: 12
      },

      // Pattern effects (custom relay patterns)
      {
        id: 'pattern-alternating',
        name: 'Alternating Pattern',
        category: 'pattern',
        duration: 60000, // 1 minute
        intensity: 'medium',
        effectType: 'custom',
        colors: ['#32cd32'],
        interval: 800, // 800ms between pattern changes
        pattern: [1, 3, 5, 7, 9, 11], // Odd relays first, then even
        description: 'Alternating odd/even relay pattern',
        tags: ['pattern', 'alternating', 'structured'],
        relayCount: 12
      },
      {
        id: 'pattern-wave',
        name: 'Wave Pattern',
        category: 'pattern',
        duration: 40000, // 40 seconds
        intensity: 'medium',
        effectType: 'custom',
        colors: ['#00bfff'],
        interval: 300, // 300ms per wave step
        pattern: [1, 2, 3, 4, 5, 6], // First half, then second half
        description: 'Wave-like pattern across relays',
        tags: ['pattern', 'wave', 'flow'],
        relayCount: 12
      },

      // Special effects
      {
        id: 'special-fireplace',
        name: 'Fireplace Flicker',
        category: 'special',
        duration: 300000, // 5 minutes
        intensity: 'low',
        effectType: 'random',
        colors: ['#ff4500', '#ffa500'],
        interval: 150, // 150ms flicker
        description: 'Mimics a cozy fireplace flicker',
        tags: ['fireplace', 'cozy', 'flicker', 'warm'],
        relayCount: 8 // Use fewer relays for more realistic effect
      },
      {
        id: 'special-lightning',
        name: 'Lightning Storm',
        category: 'special',
        duration: 20000, // 20 seconds
        intensity: 'extreme',
        effectType: 'strobe',
        colors: ['#ffffff', '#e6e6fa'],
        interval: 50, // Very fast flickers
        description: 'Simulates lightning storm flashes',
        tags: ['lightning', 'storm', 'dramatic', 'weather'],
        relayCount: 12
      },
      {
        id: 'special-sunrise',
        name: 'Sunrise Simulation',
        category: 'special',
        duration: 180000, // 3 minutes
        intensity: 'medium',
        effectType: 'wave',
        colors: ['#ff6347', '#ffa500', '#ffff00'],
        interval: 5000, // 5 second fade steps
        description: 'Gradually brightening sunrise effect',
        tags: ['sunrise', 'gradual', 'natural', 'morning'],
        relayCount: 12
      }
    ];
  }

  /**
   * Create a new lighting effect type with default values
   */
  static createLightingEffectType(name: string, category: LightingEffectType['category']): LightingEffectType {
    return {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name,
      category,
      duration: 30000, // 30 seconds default
      intensity: 'medium',
      effectType: 'solid',
      colors: ['#ffffff'],
      description: '',
      tags: ['custom'],
      relayCount: 12
    };
  }

  /**
   * Validate a lighting effect type
   */
  static validateLightingEffectType(effectType: Partial<LightingEffectType>): string[] {
    const errors: string[] = [];

    if (!effectType.name?.trim()) {
      errors.push('Name is required');
    }

    if (!effectType.category) {
      errors.push('Category is required');
    }

    if (!effectType.duration || effectType.duration < 1000) {
      errors.push('Duration must be at least 1 second (1000ms)');
    }

    if (!effectType.intensity) {
      errors.push('Intensity is required');
    }

    if (!effectType.effectType) {
      errors.push('Effect type is required');
    }

    if (!effectType.colors || effectType.colors.length === 0) {
      errors.push('At least one color is required');
    }

    if (effectType.relayCount && (effectType.relayCount < 1 || effectType.relayCount > 12)) {
      errors.push('Relay count must be between 1 and 12');
    }

    if (effectType.interval && effectType.interval < 50) {
      errors.push('Interval must be at least 50ms for safety');
    }

    return errors;
  }

  /**
   * Get effect categories with display names
   */
  static getCategories(): Array<{ value: LightingEffectType['category']; label: string; description: string }> {
    return [
      { value: 'mood', label: 'Mood Lighting', description: 'Ambient and atmospheric effects' },
      { value: 'party', label: 'Party Effects', description: 'High-energy party lighting' },
      { value: 'strobe', label: 'Strobe Effects', description: 'Flashing and pulsing patterns' },
      { value: 'chase', label: 'Chase Effects', description: 'Sequential movement patterns' },
      { value: 'wave', label: 'Wave Effects', description: 'Flowing wave-like patterns' },
      { value: 'pattern', label: 'Pattern Effects', description: 'Structured relay patterns' },
      { value: 'special', label: 'Special Effects', description: 'Unique and themed effects' }
    ];
  }

  /**
   * Get intensity levels with descriptions
   */
  static getIntensityLevels(): Array<{ value: LightingEffectType['intensity']; label: string; description: string }> {
    return [
      { value: 'low', label: 'Low', description: 'Subtle, ambient lighting' },
      { value: 'medium', label: 'Medium', description: 'Moderate brightness' },
      { value: 'high', label: 'High', description: 'Bright, prominent lighting' },
      { value: 'extreme', label: 'Extreme', description: 'Maximum intensity effects' }
    ];
  }

  /**
   * Get effect types with descriptions
   */
  static getEffectTypes(): Array<{ value: LightingEffectType['effectType']; label: string; description: string }> {
    return [
      { value: 'solid', label: 'Solid', description: 'All lights on continuously' },
      { value: 'strobe', label: 'Strobe', description: 'Flashing on/off pattern' },
      { value: 'chase', label: 'Chase', description: 'Sequential relay activation' },
      { value: 'wave', label: 'Wave', description: 'Flowing wave-like patterns' },
      { value: 'random', label: 'Random', description: 'Unpredictable patterns' },
      { value: 'custom', label: 'Custom', description: 'User-defined relay patterns' }
    ];
  }
}
