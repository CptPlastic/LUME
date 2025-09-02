/**
 * UNIFIED EXPORT UTILITY
 * 
 * This handles ALL exports in the app consistently.
 * No more different export methods for different pages!
 */

export interface ExportOptions {
  filename: string;
  content: unknown; // Will be JSON.stringify'd
  fileExtension?: string;
  addTimestamp?: boolean;
}

/**
 * Universal export function that works in both Tauri and browser environments
 * This should be used by ALL components for exporting files
 */
export async function exportFile(options: ExportOptions): Promise<boolean> {
  const {
    filename,
    content,
    fileExtension = 'json',
    addTimestamp = true
  } = options;

  try {
    console.log('🚀 Starting unified export for:', filename);

    // Generate filename with optional timestamp
    const timestamp = addTimestamp ? `-${new Date().toISOString().slice(0, 10)}` : '';
    const cleanFilename = filename.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const fullFilename = `${cleanFilename}${timestamp}.${fileExtension}`;
    
    // Convert content to string
    const fileContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    
    console.log('📝 Generated filename:', fullFilename);
    console.log('📄 Content size:', fileContent.length, 'chars');

    // Check if running in Tauri
    console.log('🔍 Checking Tauri environment...');
    
    // Try multiple detection methods - in dev mode, __TAURI__ might not be available
    // but the plugins will work if we're in a Tauri context
    const hasWindowAPI = typeof window !== 'undefined';
    const hasTauriGlobal = hasWindowAPI && '__TAURI__' in window;
    const isTauriUserAgent = hasWindowAPI && window.navigator.userAgent.includes('tauri');
    
    // Try to detect if we can import Tauri plugins (most reliable method)
    let canUseTauri = hasTauriGlobal || isTauriUserAgent;
    
    // If basic detection fails, try importing the plugins to see if they exist
    if (!canUseTauri && hasWindowAPI) {
      try {
        // This is a quick way to check if Tauri plugins are available
        canUseTauri = typeof (await import('@tauri-apps/plugin-dialog')).save === 'function';
      } catch {
        canUseTauri = false;
      }
    }
    
    console.log('🖥️ Environment:', canUseTauri ? 'Tauri' : 'Browser');
    console.log('🔍 Detection details:', { 
      hasWindowAPI, 
      hasTauriGlobal, 
      isTauriUserAgent, 
      canUseTauri 
    });
    
    if (canUseTauri) {
      return await exportInTauri(fullFilename, fileContent, fileExtension);
    } else {
      return await exportInBrowser(fullFilename, fileContent);
    }
  } catch (error) {
    console.error('❌ Export failed:', error);
    alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

/**
 * Tauri-specific export using native file dialog
 */
async function exportInTauri(filename: string, content: string, extension: string): Promise<boolean> {
  try {
    console.log('💾 Using Tauri save dialog...');
    
    console.log('📦 Importing Tauri plugins...');
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeTextFile } = await import('@tauri-apps/plugin-fs');
    console.log('✅ Tauri plugins loaded successfully');
    
    const filePath = await save({
      filters: [{
        name: `${extension.toUpperCase()} Files`,
        extensions: [extension]
      }],
      defaultPath: filename
    });
    
    console.log('📁 User selected path:', filePath);
    
    if (filePath) {
      console.log('✍️ Writing file to:', filePath);
      await writeTextFile(filePath, content);
      console.log('✅ File exported successfully to:', filePath);
      return true;
    } else {
      console.log('❌ User cancelled the save dialog');
      return false;
    }
  } catch (error) {
    console.error('❌ Tauri export failed:', error);
    console.log('🔄 Falling back to browser download...');
    return await exportInBrowser(filename, content);
  }
}

/**
 * Browser-specific export using download blob
 */
async function exportInBrowser(filename: string, content: string): Promise<boolean> {
  try {
    console.log('🌐 Using browser download...');
    
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('✅ Browser download initiated');
    return true;
  } catch (error) {
    console.error('❌ Browser export failed:', error);
    return false;
  }
}

/**
 * Convenience functions for common export types
 */

export async function exportShow(showData: unknown, showName: string): Promise<boolean> {
  return exportFile({
    filename: `${showName}-show.lume-show`,
    content: showData,
    fileExtension: 'json',
    addTimestamp: true
  });
}

export async function exportFireworkTypes(fireworkData: unknown): Promise<boolean> {
  return exportFile({
    filename: 'firework-types-library',
    content: fireworkData,
    fileExtension: 'json',
    addTimestamp: true
  });
}

export async function exportLightingEffects(lightingData: unknown): Promise<boolean> {
  return exportFile({
    filename: 'lighting-effects-library',
    content: lightingData,
    fileExtension: 'json',
    addTimestamp: true
  });
}