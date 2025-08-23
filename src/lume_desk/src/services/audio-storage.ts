// Enhanced audio storage service for persisting uploaded audio files
import type { AudioTrack, Show, ShowFile } from '../types';

const DB_NAME = 'LumeAudioStorage';
const DB_VERSION = 2;
const AUDIO_STORE = 'audioFiles';
const BACKUP_STORE = 'audioBackups';

interface StoredAudioFile {
  id: string;
  name: string;
  data: ArrayBuffer;
  type: string;
  size: number;
  uploadedAt: string;
  lastAccessed: string;
  checksum: string; // For integrity verification
}

interface AudioBackup {
  id: string;
  audioId: string;
  data: ArrayBuffer;
  createdAt: string;
  name: string;
}

class AudioStorageService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(new Error(request.error?.message || 'Database initialization failed'));
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create audio files store
        if (!db.objectStoreNames.contains(AUDIO_STORE)) {
          db.createObjectStore(AUDIO_STORE, { keyPath: 'id' });
        }
        
        // Create backup store for redundancy
        if (!db.objectStoreNames.contains(BACKUP_STORE)) {
          db.createObjectStore(BACKUP_STORE, { keyPath: 'id' });
        }
      };
    });
  }

  // Generate simple checksum for integrity verification
  private generateChecksum(data: ArrayBuffer): string {
    const array = new Uint8Array(data);
    let hash = 0;
    for (const byte of array) {
      hash = ((hash << 5) - hash + byte) & 0xffffffff;
    }
    return Math.abs(hash).toString(16);
  }

  async storeAudioFile(audioTrack: AudioTrack): Promise<string> {
    if (!this.db) await this.init();
    if (!audioTrack.file) throw new Error('No file to store');

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const checksum = this.generateChecksum(arrayBuffer);
        const now = new Date().toISOString();
        
        const storedFile: StoredAudioFile = {
          id: audioTrack.id,
          name: audioTrack.name,
          data: arrayBuffer,
          type: audioTrack.format,
          size: audioTrack.size || 0,
          uploadedAt: audioTrack.uploadedAt.toISOString(),
          lastAccessed: now,
          checksum
        };

        // Create backup copy
        const backup: AudioBackup = {
          id: `${audioTrack.id}-backup-${Date.now()}`,
          audioId: audioTrack.id,
          data: arrayBuffer,
          createdAt: now,
          name: audioTrack.name
        };

        try {
          // Store primary file
          const transaction = this.db!.transaction([AUDIO_STORE, BACKUP_STORE], 'readwrite');
          
          const audioStore = transaction.objectStore(AUDIO_STORE);
          const backupStore = transaction.objectStore(BACKUP_STORE);
          
          audioStore.put(storedFile);
          backupStore.put(backup);

          transaction.oncomplete = () => {
            console.log(`💾 Audio file stored with backup: ${audioTrack.name}`);
            resolve(audioTrack.id);
          };
          
          transaction.onerror = () => reject(new Error(transaction.error?.message || 'Failed to store audio file'));
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      };

      reader.onerror = () => reject(new Error(reader.error?.message || 'Failed to read audio file'));
      reader.readAsArrayBuffer(audioTrack.file!);
    });
  }

  async retrieveAudioFile(id: string): Promise<File | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([AUDIO_STORE], 'readwrite');
      const store = transaction.objectStore(AUDIO_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result as StoredAudioFile;
        if (result) {
          // Verify integrity
          const currentChecksum = this.generateChecksum(result.data);
          if (currentChecksum !== result.checksum) {
            console.warn(`⚠️ Checksum mismatch for ${result.name}, attempting backup recovery...`);
            this.recoverFromBackup(id).then(resolve).catch(reject);
            return;
          }

          // Update last accessed time
          const updatedFile = { ...result, lastAccessed: new Date().toISOString() };
          store.put(updatedFile);

          // Convert ArrayBuffer back to File
          const blob = new Blob([result.data], { type: result.type });
          const file = new File([blob], result.name, { 
            type: result.type,
            lastModified: new Date(result.uploadedAt).getTime()
          });
          console.log(`📁 Retrieved audio file: ${result.name}`);
          resolve(file);
        } else {
          console.warn(`⚠️ Audio file not found: ${id}, attempting backup recovery...`);
          this.recoverFromBackup(id).then(resolve).catch(reject);
        }
      };

      request.onerror = () => {
        console.error(`❌ Failed to retrieve audio file: ${id}`);
        this.recoverFromBackup(id).then(resolve).catch(reject);
      };
    });
  }

  private async recoverFromBackup(audioId: string): Promise<File | null> {
    if (!this.db) await this.init();

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([BACKUP_STORE, AUDIO_STORE], 'readwrite');
      const backupStore = transaction.objectStore(BACKUP_STORE);
      const audioStore = transaction.objectStore(AUDIO_STORE);
      
      // Find backup for this audio ID
      const request = backupStore.getAll();

      request.onsuccess = () => {
        const backups = request.result as AudioBackup[];
        const audioBackup = backups
          .filter(b => b.audioId === audioId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        if (audioBackup) {
          console.log(`🔧 Recovering audio from backup: ${audioBackup.name}`);
          
          // Restore to main store
          const restoredFile: StoredAudioFile = {
            id: audioId,
            name: audioBackup.name,
            data: audioBackup.data,
            type: 'audio/mpeg', // Default type
            size: audioBackup.data.byteLength,
            uploadedAt: audioBackup.createdAt,
            lastAccessed: new Date().toISOString(),
            checksum: this.generateChecksum(audioBackup.data)
          };

          audioStore.put(restoredFile);

          const blob = new Blob([audioBackup.data], { type: 'audio/mpeg' });
          const file = new File([blob], audioBackup.name, { 
            type: 'audio/mpeg',
            lastModified: new Date(audioBackup.createdAt).getTime()
          });
          
          console.log(`✅ Successfully recovered: ${audioBackup.name}`);
          resolve(file);
        } else {
          console.error(`❌ No backup found for audio ID: ${audioId}`);
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error(`❌ Failed to recover from backup: ${audioId}`);
        resolve(null);
      };
    });
  }

  async deleteAudioFile(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([AUDIO_STORE, BACKUP_STORE], 'readwrite');
      const audioStore = transaction.objectStore(AUDIO_STORE);
      const backupStore = transaction.objectStore(BACKUP_STORE);

      // Delete main file
      audioStore.delete(id);

      // Delete associated backups
      const backupRequest = backupStore.getAll();
      backupRequest.onsuccess = () => {
        const backups = backupRequest.result as AudioBackup[];
        backups
          .filter(b => b.audioId === id)
          .forEach(backup => backupStore.delete(backup.id));
      };

      transaction.oncomplete = () => {
        console.log(`🗑️ Deleted stored audio file and backups: ${id}`);
        resolve();
      };
      transaction.onerror = () => reject(new Error(transaction.error?.message || 'Failed to delete audio file'));
    });
  }

  async listStoredFiles(): Promise<string[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([AUDIO_STORE], 'readonly');
      const store = transaction.objectStore(AUDIO_STORE);
      const request = store.getAllKeys();

      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(new Error(request.error?.message || 'Failed to list stored files'));
    });
  }

  async clearAllFiles(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([AUDIO_STORE, BACKUP_STORE], 'readwrite');
      const audioStore = transaction.objectStore(AUDIO_STORE);
      const backupStore = transaction.objectStore(BACKUP_STORE);

      audioStore.clear();
      backupStore.clear();

      transaction.oncomplete = () => {
        console.log('🧹 Cleared all stored audio files and backups');
        resolve();
      };
      transaction.onerror = () => reject(new Error(transaction.error?.message || 'Failed to clear audio files'));
    });
  }

  // Export audio file as base64 for show export
  async exportAudioAsBase64(id: string): Promise<string | null> {
    if (!this.db) await this.init();

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([AUDIO_STORE], 'readonly');
      const store = transaction.objectStore(AUDIO_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result as StoredAudioFile;
        if (result) {
          // Convert ArrayBuffer to base64
          const bytes = new Uint8Array(result.data);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          resolve(base64);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error(`Failed to export audio as base64: ${id}`);
        resolve(null);
      };
    });
  }

  // Import audio from base64 data
  async importAudioFromBase64(audioData: { id: string; name: string; type: string; base64: string }): Promise<boolean> {
    try {
      if (!this.db) await this.init();

      // Convert base64 to ArrayBuffer
      const binaryString = atob(audioData.base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const arrayBuffer = bytes.buffer;

      const now = new Date().toISOString();
      const checksum = this.generateChecksum(arrayBuffer);

      const storedFile: StoredAudioFile = {
        id: audioData.id,
        name: audioData.name,
        data: arrayBuffer,
        type: audioData.type,
        size: arrayBuffer.byteLength,
        uploadedAt: now,
        lastAccessed: now,
        checksum
      };

      const backup: AudioBackup = {
        id: `${audioData.id}-imported-${Date.now()}`,
        audioId: audioData.id,
        data: arrayBuffer,
        createdAt: now,
        name: audioData.name
      };

      return new Promise((resolve) => {
        const transaction = this.db!.transaction([AUDIO_STORE, BACKUP_STORE], 'readwrite');
        const audioStore = transaction.objectStore(AUDIO_STORE);
        const backupStore = transaction.objectStore(BACKUP_STORE);

        audioStore.put(storedFile);
        backupStore.put(backup);

        transaction.oncomplete = () => {
          console.log(`📥 Imported audio file: ${audioData.name}`);
          resolve(true);
        };
        transaction.onerror = () => {
          console.error(`Failed to import audio: ${audioData.name}`);
          resolve(false);
        };
      });
    } catch (error) {
      console.error('Failed to import audio from base64:', error);
      return false;
    }
  }

  // Health check - verify stored files integrity
  async performHealthCheck(): Promise<{ healthy: number; corrupted: number; recovered: number }> {
    if (!this.db) await this.init();

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([AUDIO_STORE], 'readonly');
      const store = transaction.objectStore(AUDIO_STORE);
      const request = store.getAll();

      request.onsuccess = async () => {
        const files = request.result as StoredAudioFile[];
        let healthy = 0;
        let corrupted = 0;
        let recovered = 0;

        for (const file of files) {
          const currentChecksum = this.generateChecksum(file.data);
          if (currentChecksum === file.checksum) {
            healthy++;
          } else {
            corrupted++;
            console.warn(`🔧 Corrupted file detected: ${file.name}`);
            
            // Attempt recovery
            const recoveredFile = await this.recoverFromBackup(file.id);
            if (recoveredFile) {
              recovered++;
              console.log(`✅ Recovered file: ${file.name}`);
            }
          }
        }

        console.log(`🏥 Health check complete: ${healthy} healthy, ${corrupted} corrupted, ${recovered} recovered`);
        resolve({ healthy, corrupted, recovered });
      };

      request.onerror = () => {
        console.error('Health check failed');
        resolve({ healthy: 0, corrupted: 0, recovered: 0 });
      };
    });
  }
}

export const audioStorageService = new AudioStorageService();
