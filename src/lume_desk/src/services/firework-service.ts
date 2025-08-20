import type { FireworkType, ShowFile, Show } from '../types';

export class FireworkService {
  
  // Default firework types library
  static getDefaultFireworkTypes(): FireworkType[] {
    return [
      {
        id: 'shell-small-red',
        name: 'Small Red Shell',
        category: 'shell',
        duration: 2000,
        intensity: 'medium',
        colors: ['#FF0000'],
        effects: ['burst'],
        safetyDelay: 1000,
        description: '3" red shell with single burst',
        tags: ['basic', 'red', 'small'],
        channelCount: 1
      },
      {
        id: 'shell-large-multi',
        name: 'Large Multicolor Shell',
        category: 'shell',
        duration: 3500,
        intensity: 'high',
        colors: ['#FF0000', '#00FF00', '#0000FF', '#FFD700'],
        effects: ['burst', 'crackle'],
        safetyDelay: 2000,
        description: '6" multicolor shell with crackle',
        tags: ['large', 'multicolor', 'crackle'],
        channelCount: 1
      },
      {
        id: 'cake-25-shot',
        name: '25 Shot Cake',
        category: 'cake',
        duration: 15000,
        intensity: 'high',
        colors: ['#FF6B35', '#FFD23F', '#FF0000'],
        effects: ['rapid-fire', 'chrysanthemum'],
        safetyDelay: 3000,
        description: '25 shot rapid-fire cake with chrysanthemum effects',
        tags: ['cake', 'rapid', 'finale'],
        channelCount: 1
      },
      {
        id: 'fountain-gold',
        name: 'Golden Fountain',
        category: 'fountain',
        duration: 8000,
        intensity: 'low',
        colors: ['#FFD700', '#FFA500'],
        effects: ['fountain', 'sparks'],
        safetyDelay: 500,
        description: 'Golden sparkling fountain effect',
        tags: ['fountain', 'gold', 'ground'],
        channelCount: 1
      },
      {
        id: 'rocket-whistling',
        name: 'Whistling Rocket',
        category: 'rocket',
        duration: 4000,
        intensity: 'medium',
        colors: ['#FFFFFF', '#FF0000'],
        effects: ['whistle', 'burst'],
        safetyDelay: 1500,
        description: 'Rocket with whistling effect and red burst',
        tags: ['rocket', 'whistle', 'red'],
        channelCount: 1
      },
      {
        id: 'mine-silver',
        name: 'Silver Mine',
        category: 'mine',
        duration: 1500,
        intensity: 'medium',
        colors: ['#C0C0C0', '#FFFFFF'],
        effects: ['mine', 'strobe'],
        safetyDelay: 800,
        description: 'Ground mine with silver strobe effects',
        tags: ['mine', 'silver', 'strobe'],
        channelCount: 1
      }
    ];
  }

  // Validate firework type
  static validateFireworkType(fireworkType: Partial<FireworkType>): string[] {
    const errors: string[] = [];

    if (!fireworkType.name || fireworkType.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!fireworkType.category) {
      errors.push('Category is required');
    }

    if (!fireworkType.duration || fireworkType.duration <= 0) {
      errors.push('Duration must be greater than 0');
    }

    if (!fireworkType.intensity) {
      errors.push('Intensity is required');
    }

    if (!fireworkType.colors || fireworkType.colors.length === 0) {
      errors.push('At least one color is required');
    }

    if (!fireworkType.safetyDelay || fireworkType.safetyDelay < 0) {
      errors.push('Safety delay must be 0 or greater');
    }

    return errors;
  }

  // Export show to JSON file
  static exportShow(show: Show, fireworkTypes: FireworkType[], controllers: any[]): ShowFile {
    const usedFireworkTypeIds = new Set(
      show.sequences.map(seq => seq.fireworkTypeId)
    );
    
    const usedFireworkTypes = fireworkTypes.filter(ft => 
      usedFireworkTypeIds.has(ft.id)
    );

    const usedControllerIds = new Set(
      show.sequences.map(seq => seq.controllerId)
    );

    const usedControllers = controllers
      .filter(c => usedControllerIds.has(c.id))
      .map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        channels: c.type === 'firework' ? 32 : undefined // Assume 32 channels for firework controllers
      }));

    return {
      version: '1.0.0',
      format: 'lume-show-v1',
      metadata: {
        name: show.name,
        description: show.description,
        author: show.metadata?.author,
        created: show.createdAt.toISOString(),
        modified: show.modifiedAt.toISOString(),
        tags: show.metadata?.tags
      },
      show,
      fireworkTypes: usedFireworkTypes,
      controllers: usedControllers
    };
  }

  // Import show from JSON file
  static importShow(showFile: ShowFile): { success: boolean; errors?: string[]; show?: Show; fireworkTypes?: FireworkType[] } {
    const errors: string[] = [];

    // Validate format
    if (showFile.format !== 'lume-show-v1') {
      errors.push(`Unsupported format: ${showFile.format}`);
    }

    // Validate version compatibility
    if (!showFile.version || !this.isVersionCompatible(showFile.version)) {
      errors.push(`Incompatible version: ${showFile.version}`);
    }

    // Validate show structure
    if (!showFile.show?.id) {
      errors.push('Invalid show structure');
    }

    // Validate firework types
    if (showFile.fireworkTypes) {
      showFile.fireworkTypes.forEach((ft, index) => {
        const ftErrors = this.validateFireworkType(ft);
        if (ftErrors.length > 0) {
          errors.push(`Firework type ${index + 1}: ${ftErrors.join(', ')}`);
        }
      });
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Convert dates back from ISO strings
    const show: Show = {
      ...showFile.show,
      createdAt: new Date(showFile.metadata.created),
      modifiedAt: new Date(showFile.metadata.modified),
      version: showFile.version,
      metadata: {
        author: showFile.metadata.author,
        tags: showFile.metadata.tags,
        ...showFile.show.metadata
      }
    };

    return {
      success: true,
      show,
      fireworkTypes: showFile.fireworkTypes || []
    };
  }

  // Check version compatibility
  private static isVersionCompatible(version: string): boolean {
    const [major] = version.split('.').map(Number);
    return major === 1; // Only support v1.x.x for now
  }

  // Generate unique ID for firework types
  static generateFireworkId(name: string): string {
    const sanitized = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    return `${sanitized}-${Date.now()}`;
  }

  // Search firework types
  static searchFireworkTypes(types: FireworkType[], query: string): FireworkType[] {
    if (!query.trim()) return types;

    const searchTerm = query.toLowerCase();
    return types.filter(type => 
      type.name.toLowerCase().includes(searchTerm) ||
      type.category.toLowerCase().includes(searchTerm) ||
      type.effects.some(effect => effect.toLowerCase().includes(searchTerm)) ||
      type.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      type.description?.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by category
  static filterByCategory(types: FireworkType[], category: string): FireworkType[] {
    if (category === 'all') return types;
    return types.filter(type => type.category === category);
  }

  // Filter by intensity
  static filterByIntensity(types: FireworkType[], intensity: string): FireworkType[] {
    if (intensity === 'all') return types;
    return types.filter(type => type.intensity === intensity);
  }

  // Download show file
  static downloadShowFile(showFile: ShowFile): void {
    const blob = new Blob([JSON.stringify(showFile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${showFile.metadata.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.lume-show.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Validate show for safety
  static validateShowSafety(show: Show, fireworkTypes: FireworkType[]): string[] {
    const warnings: string[] = [];
    const fireworkMap = new Map(fireworkTypes.map(ft => [ft.id, ft]));

    // Sort sequences by timestamp for safety analysis
    const sortedSequences = [...show.sequences].sort((a, b) => a.timestamp - b.timestamp);

    // Check for minimum delays between fireworks
    for (let i = 0; i < sortedSequences.length - 1; i++) {
      const currentSeq = sortedSequences[i];
      const nextSeq = sortedSequences[i + 1];

      const firework = fireworkMap.get(currentSeq.fireworkTypeId);
      if (firework) {
        const timeDiff = nextSeq.timestamp - currentSeq.timestamp;
        if (timeDiff < firework.safetyDelay) {
          warnings.push(
            `Sequence ${i + 1}: ${firework.name} requires ${firework.safetyDelay}ms safety delay, but next firework is only ${timeDiff}ms later`
          );
        }
      }
    }

    // Check for overlapping high-intensity fireworks
    const highIntensitySequences = show.sequences.filter(seq => {
      const firework = fireworkMap.get(seq.fireworkTypeId);
      return firework && (firework.intensity === 'high' || firework.intensity === 'extreme');
    });

    highIntensitySequences.forEach((sequence) => {
      const firework = fireworkMap.get(sequence.fireworkTypeId);
      if (firework) {
        const overlapping = highIntensitySequences.filter(other => 
          other !== sequence && 
          Math.abs(other.timestamp - sequence.timestamp) < firework.duration
        );
        if (overlapping.length > 0) {
          warnings.push(
            `High-intensity firework "${firework.name}" at ${sequence.timestamp}ms may overlap with other high-intensity effects`
          );
        }
      }
    });

    return warnings;
  }
}
