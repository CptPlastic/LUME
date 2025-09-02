import type { Show, ShowFile, FireworkType, LightingEffectType, ESP32Controller, AudioTrack } from '../types';
import { audioStorageService } from './audio-storage';
import { DATA_FORMAT_VERSION } from '../utils/version';

export class ShowService {
  
  // Export show with all dependencies including audio
  static async exportShow(
    show: Show, 
    fireworkTypes: FireworkType[], 
    lightingEffectTypes: LightingEffectType[],
    controllers: ESP32Controller[]
  ): Promise<ShowFile> {
    // Ensure dates are valid
    const createdAt = show.createdAt instanceof Date ? show.createdAt : new Date(show.createdAt || Date.now());
    const modifiedAt = show.modifiedAt instanceof Date ? show.modifiedAt : new Date(show.modifiedAt || Date.now());
    
    const usedFireworkTypeIds = new Set(
      show.sequences
        .filter(seq => seq.fireworkType)
        .map(seq => seq.fireworkTypeId)
    );
    
    const usedLightingEffectTypeIds = new Set(
      show.sequences
        .filter(seq => seq.lightingEffectType)
        .map(seq => seq.lightingEffectTypeId)
    );
    
    const usedFireworkTypes = fireworkTypes.filter(ft => 
      usedFireworkTypeIds.has(ft.id)
    );

    const usedLightingEffectTypes = lightingEffectTypes.filter(lt =>
      usedLightingEffectTypeIds.has(lt.id)
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
        channels: c.type === 'firework' ? 32 : 12 // Default channel counts
      }));

    let audioData: ShowFile['audioData'] = undefined;

    // Export audio if present
    if (show.audio?.id) {
      try {
        console.log(`📤 Exporting audio for show: ${show.audio.name}`);
        const base64Audio = await audioStorageService.exportAudioAsBase64(show.audio.id);
        if (base64Audio) {
          audioData = {
            id: show.audio.id,
            name: show.audio.name,
            type: show.audio.format,
            base64: base64Audio,
            size: show.audio.size || 0,
            duration: show.audio.duration
          };
          console.log(`✅ Audio exported: ${show.audio.name} (${Math.round(base64Audio.length / 1024)}KB)`);
        } else {
          console.warn(`⚠️ Could not export audio: ${show.audio.name}`);
        }
      } catch (error) {
        console.error('Failed to export audio:', error);
      }
    }

    return {
      version: DATA_FORMAT_VERSION, // Data format version for show files
      format: 'lume-show-v1',
      metadata: {
        name: show.name,
        description: show.description,
        author: show.metadata?.author,
        created: createdAt.toISOString(),
        modified: modifiedAt.toISOString(),
        tags: show.metadata?.tags
      },
      show,
      fireworkTypes: usedFireworkTypes,
      lightingEffectTypes: usedLightingEffectTypes,
      controllers: usedControllers,
      audioData
    };
  }

  // Import show with audio restoration
  static async importShow(showFile: ShowFile): Promise<{ 
    success: boolean; 
    errors?: string[]; 
    show?: Show; 
    fireworkTypes?: FireworkType[];
    lightingEffectTypes?: LightingEffectType[];
    audioRestored?: boolean;
  }> {
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
      showFile.fireworkTypes.forEach((ft: FireworkType, index: number) => {
        const ftErrors = this.validateFireworkType(ft);
        if (ftErrors.length > 0) {
          errors.push(`Firework type ${index + 1}: ${ftErrors.join(', ')}`);
        }
      });
    }

    // Validate lighting effect types
    if (showFile.lightingEffectTypes) {
      showFile.lightingEffectTypes.forEach((lt: LightingEffectType, index: number) => {
        const ltErrors = this.validateLightingEffectType(lt);
        if (ltErrors.length > 0) {
          errors.push(`Lighting effect type ${index + 1}: ${ltErrors.join(', ')}`);
        }
      });
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Import audio if present
    let audioRestored = false;
    if (showFile.audioData) {
      try {
        console.log(`📥 Importing audio: ${showFile.audioData.name}`);
        audioRestored = await audioStorageService.importAudioFromBase64(showFile.audioData);
        if (audioRestored) {
          console.log(`✅ Audio imported successfully: ${showFile.audioData.name}`);
        } else {
          console.warn(`⚠️ Failed to import audio: ${showFile.audioData.name}`);
        }
      } catch (error) {
        console.error('Failed to import audio:', error);
        errors.push(`Audio import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Convert dates back from ISO strings
    const show: Show = {
      ...showFile.show,
      createdAt: showFile.show.createdAt instanceof Date ? showFile.show.createdAt : new Date(showFile.show.createdAt),
      modifiedAt: showFile.show.modifiedAt instanceof Date ? showFile.show.modifiedAt : new Date(showFile.show.modifiedAt),
      version: showFile.version,
      metadata: {
        author: showFile.metadata.author,
        tags: showFile.metadata.tags,
        ...showFile.show.metadata
      }
    };

    // Restore audio reference if imported
    if (audioRestored && showFile.audioData) {
      const audioTrack: AudioTrack = {
        id: showFile.audioData.id,
        name: showFile.audioData.name,
        format: showFile.audioData.type,
        duration: showFile.audioData.duration,
        size: showFile.audioData.size,
        uploadedAt: new Date(),
        file: undefined // Will be restored from storage
      };
      show.audio = audioTrack;
    }

    return {
      success: true,
      show,
      fireworkTypes: showFile.fireworkTypes || [],
      lightingEffectTypes: showFile.lightingEffectTypes || [],
      audioRestored
    };
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

  // Validate lighting effect type
  static validateLightingEffectType(lightingEffectType: Partial<LightingEffectType>): string[] {
    const errors: string[] = [];

    if (!lightingEffectType.name || lightingEffectType.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!lightingEffectType.effectType) {
      errors.push('Effect type is required');
    }

    if (!lightingEffectType.duration || lightingEffectType.duration <= 0) {
      errors.push('Duration must be greater than 0');
    }

    if (lightingEffectType.interval !== undefined && lightingEffectType.interval < 50) {
      errors.push('Interval must be at least 50ms');
    }

    return errors;
  }

  // Check version compatibility
  private static isVersionCompatible(version: string): boolean {
    const [major] = version.split('.').map(Number);
    return major === 1; // Support v1.x.x for now
  }

  // Download show file with enhanced name
  static async downloadShowFile(showFile: ShowFile): Promise<void> {
    console.log('🔄 downloadShowFile called with show:', showFile.metadata.name);
    
    // Enhanced filename with audio indicator
    const audioSuffix = showFile.audioData ? '-with-audio' : '';
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const filename = `${showFile.metadata.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}${audioSuffix}-${timestamp}.lume-show.json`;
    const content = JSON.stringify(showFile, null, 2);

    console.log('📝 Generated filename:', filename);
    console.log('📄 Content size:', content.length, 'chars');

    // Check if running in Tauri
    const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
    console.log('🖥️ Environment:', isTauri ? 'Tauri' : 'Browser');
    
    if (isTauri) {
      try {
        console.log('💾 Using Tauri save dialog...');
        
        // Use Tauri's save dialog
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeTextFile } = await import('@tauri-apps/plugin-fs');
        
        console.log('📦 Imported Tauri plugins successfully');
        
        const filePath = await save({
          filters: [{
            name: 'LUME Show Files',
            extensions: ['json']
          }],
          defaultPath: filename
        });
        
        console.log('📁 User selected path:', filePath);
        
        if (filePath) {
          console.log('✍️ Writing file to:', filePath);
          await writeTextFile(filePath, content);
          console.log('✅ Show exported successfully to:', filePath);
        } else {
          console.log('❌ User cancelled the save dialog');
        }
      } catch (error) {
        console.error('❌ Tauri export failed:', error);
        console.log('🔄 Falling back to browser download...');
        // Fallback to browser download
        this.browserDownload(content, filename);
      }
    } else {
      console.log('🌐 Using browser download...');
      // Browser environment
      this.browserDownload(content, filename);
    }
    
    console.log(`📁 Download process completed for: ${showFile.metadata.name}${audioSuffix}`);
  }

  // Browser download fallback
  private static browserDownload(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Validate show for safety (enhanced for lighting effects)
  static validateShowSafety(
    show: Show, 
    fireworkTypes: FireworkType[], 
    lightingEffectTypes: LightingEffectType[]
  ): string[] {
    const warnings: string[] = [];
    const fireworkMap = new Map(fireworkTypes.map(ft => [ft.id, ft]));
    const lightingMap = new Map(lightingEffectTypes.map(lt => [lt.id, lt]));

    // Sort sequences by timestamp for safety analysis
    const sortedSequences = [...show.sequences].sort((a, b) => a.timestamp - b.timestamp);

    // Check for minimum delays between fireworks
    for (let i = 0; i < sortedSequences.length - 1; i++) {
      const currentSeq = sortedSequences[i];
      const nextSeq = sortedSequences[i + 1];

      if (currentSeq.fireworkType) {
        const firework = fireworkMap.get(currentSeq.fireworkTypeId || '');
        if (firework) {
          const timeDiff = nextSeq.timestamp - currentSeq.timestamp;
          if (timeDiff < firework.safetyDelay) {
            warnings.push(
              `Sequence ${i + 1}: ${firework.name} requires ${firework.safetyDelay}ms safety delay, but next effect is only ${timeDiff}ms later`
            );
          }
        }
      }
    }

    // Check for excessive concurrent lighting effects
    const lightingSequences = show.sequences.filter(seq => seq.lightingEffectType);
    lightingSequences.forEach((sequence) => {
      const lightingEffect = lightingMap.get(sequence.lightingEffectTypeId || '');
      if (lightingEffect) {
        const overlapping = lightingSequences.filter(other => 
          other !== sequence && 
          Math.abs(other.timestamp - sequence.timestamp) < lightingEffect.duration
        );
        if (overlapping.length > 2) {
          warnings.push(
            `Multiple lighting effects "${lightingEffect.name}" may overlap at ${sequence.timestamp}ms - consider spacing them out`
          );
        }
      }
    });

    // Check for audio synchronization
    if (show.audio) {
      const lastSequence = sortedSequences[sortedSequences.length - 1];
      if (lastSequence) {
        const lastEffectEnd = lastSequence.timestamp + (
          lastSequence.fireworkType 
            ? fireworkMap.get(lastSequence.fireworkTypeId || '')?.duration || 0
            : lightingMap.get(lastSequence.lightingEffectTypeId || '')?.duration || 0
        );
        
        if (lastEffectEnd > show.audio.duration) {
          warnings.push(
            `Show effects extend beyond audio duration (${Math.round(show.audio.duration / 1000)}s)`
          );
        }
      }
    }

    return warnings;
  }

  // Generate unique ID for show elements
  static generateElementId(name: string, type: 'show' | 'firework' | 'lighting'): string {
    const sanitized = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    return `${type}-${sanitized}-${Date.now()}`;
  }

  // Create backup of current show before import
  static async createShowBackup(show: Show): Promise<boolean> {
    try {
      const backupData = {
        show,
        timestamp: new Date().toISOString(),
        type: 'auto-backup'
      };
      
      localStorage.setItem(`lume-show-backup-${show.id}`, JSON.stringify(backupData));
      console.log(`💾 Created backup for show: ${show.name}`);
      return true;
    } catch (error) {
      console.error('Failed to create show backup:', error);
      return false;
    }
  }

  // Restore show from backup
  static restoreShowBackup(showId: string): Show | null {
    try {
      const backupData = localStorage.getItem(`lume-show-backup-${showId}`);
      if (backupData) {
        const backup = JSON.parse(backupData);
        console.log(`🔄 Restored show backup: ${backup.show.name}`);
        return {
          ...backup.show,
          createdAt: new Date(backup.show.createdAt),
          modifiedAt: new Date(backup.show.modifiedAt)
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to restore show backup:', error);
      return null;
    }
  }

  // Clean old backups (keep last 5)
  static cleanupBackups(): void {
    try {
      const backupKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('lume-show-backup-'))
        .sort((a, b) => a.localeCompare(b))
        .reverse();
      
      if (backupKeys.length > 5) {
        backupKeys.slice(5).forEach(key => {
          localStorage.removeItem(key);
        });
        console.log(`🧹 Cleaned up ${backupKeys.length - 5} old show backups`);
      }
    } catch (error) {
      console.error('Failed to cleanup backups:', error);
    }
  }
}
