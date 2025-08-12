import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Download, Upload, X } from 'lucide-react';
import { useLumeStore } from '../store/lume-store';
import type { FireworkType } from '../types';
import { FireworkTypeCard } from './FireworkTypeCard';
import { FireworkTypeModal } from './FireworkTypeModal';

export const FireworkTypeManager: React.FC = () => {
  const { 
    fireworkTypes, 
    addFireworkType, 
    updateFireworkType, 
    removeFireworkType,
    importShow 
  } = useLumeStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFirework, setEditingFirework] = useState<FireworkType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedIntensity, setSelectedIntensity] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const categories = ['shell', 'cake', 'fountain', 'roman-candle', 'mine', 'comet', 'strobe', 'sparkler', 'smoke'];
  const intensities = ['low', 'medium', 'high', 'extreme'];

  // Filter and search firework types
  const filteredFireworks = useMemo(() => {
    return fireworkTypes.filter(firework => {
      const matchesSearch = !searchTerm || 
        firework.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (firework.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        firework.effects.some(effect => effect.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (firework.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = !selectedCategory || firework.category === selectedCategory;
      const matchesIntensity = !selectedIntensity || firework.intensity === selectedIntensity;

      return matchesSearch && matchesCategory && matchesIntensity;
    });
  }, [fireworkTypes, searchTerm, selectedCategory, selectedIntensity]);

  const handleAddFirework = () => {
    setEditingFirework(null);
    setIsModalOpen(true);
  };

  const handleEditFirework = (firework: FireworkType) => {
    setEditingFirework(firework);
    setIsModalOpen(true);
  };

  const handleDeleteFirework = (id: string) => {
    if (confirm('Are you sure you want to delete this firework type?')) {
      removeFireworkType(id);
    }
  };

  const handleModalSave = (fireworkData: FireworkType) => {
    if (editingFirework) {
      updateFireworkType(fireworkData.id, fireworkData);
    } else {
      addFireworkType(fireworkData);
    }
    setIsModalOpen(false);
    setEditingFirework(null);
  };

  const handleExportLibrary = async () => {
    console.log('Export button clicked, starting export process...');
    console.log('Firework types count:', fireworkTypes.length);
    
    try {
      const showData = {
        metadata: {
          name: "Firework Types Library",
          description: "Complete firework types collection",
          createdAt: new Date().toISOString(),
          version: "1.0"
        },
        fireworkTypes,
        sequences: []
      };

      const jsonString = JSON.stringify(showData, null, 2);
      const fileName = `firework-types-library-${new Date().toISOString().split('T')[0]}.json`;
      
      // Check if we're in Tauri environment
      const isTauri = '__TAURI__' in window;
      console.log('Is Tauri environment:', isTauri);
      
      // In Tauri, downloads are often blocked, so we'll go straight to clipboard with good UX
      if (isTauri) {
        console.log('Using Tauri-optimized export...');
        try {
          await navigator.clipboard.writeText(jsonString);
          alert(`🎆 Export Successful!\n\n📋 Your firework types library has been copied to the clipboard.\n\n📝 To save the file:\n1. Open any text editor (TextEdit, Notepad, VS Code, etc.)\n2. Paste the content (Cmd+V or Ctrl+V)\n3. Save as: "${fileName}"\n\nThe file contains ${fireworkTypes.length} firework types ready for import!`);
          return;
        } catch (clipboardError) {
          console.warn('Clipboard failed in Tauri:', clipboardError);
        }
      }
      
      // For browsers, try download first, then fallback
      console.log('Attempting browser download...');
      try {
        // Method 1: Data URL download
        const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(jsonString)}`;
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = fileName;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        
        // Try both click methods
        a.click();
        
        const syntheticClick = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        a.dispatchEvent(syntheticClick);
        
        // Clean up
        setTimeout(() => {
          if (document.body.contains(a)) {
            document.body.removeChild(a);
          }
        }, 1000);
        
        // Give download a moment to start
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check with user if download worked
        const downloadSuccess = confirm('🎆 Export initiated!\n\nDid a download start? Check your Downloads folder.\n\nClick OK if the file was downloaded, or Cancel to try clipboard method.');
        
        if (downloadSuccess) {
          alert(`✅ Great! Your firework types library has been saved as "${fileName}"`);
          return;
        }
        
        console.log('User indicated download failed, trying clipboard...');
        
      } catch (downloadError) {
        console.warn('Download method failed:', downloadError);
      }
      
      // Fallback: Clipboard with enhanced UX
      console.log('Using clipboard fallback...');
      try {
        await navigator.clipboard.writeText(jsonString);
        
        const viewData = confirm(`🎆 Export via Clipboard!\n\n📋 Your firework types library has been copied to the clipboard.\n\n📝 Next steps:\n1. Open a text editor\n2. Paste (Cmd+V or Ctrl+V)\n3. Save as: "${fileName}"\n\nClick OK to continue, or Cancel to view the data first.`);
        
        if (!viewData) {
          // Show data in a nice modal
          showExportModal(jsonString, fileName);
        }
        
        return;
        
      } catch (clipboardError) {
        console.warn('Clipboard failed:', clipboardError);
        alert('Clipboard access denied. Showing data for manual copy...');
        showExportModal(jsonString, fileName);
      }
      
    } catch (error) {
      console.error('Export failed:', error);
      alert(`❌ Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Helper function to show export data in a modal
  const showExportModal = (jsonString: string, fileName: string) => {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.9);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: #1a1a1a;
      border: 2px solid #FF6B35;
      border-radius: 12px;
      padding: 24px;
      width: 90%;
      max-width: 800px;
      max-height: 80%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      color: #FF6B35;
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 16px;
      text-align: center;
    `;
    header.textContent = '🎆 Firework Types Export Data';

    const instructions = document.createElement('div');
    instructions.style.cssText = `
      color: #ffffff;
      margin-bottom: 16px;
      line-height: 1.5;
      text-align: center;
    `;
    instructions.innerHTML = `
      <strong>📝 Instructions:</strong><br>
      1. Select all text below (Cmd+A or Ctrl+A)<br>
      2. Copy (Cmd+C or Ctrl+C)<br>
      3. Paste into a text editor and save as: <code style="background:#333;padding:2px 6px;border-radius:4px;">${fileName}</code>
    `;

    const textarea = document.createElement('textarea');
    textarea.style.cssText = `
      width: 100%;
      height: 300px;
      background: #2a2a2a;
      color: #ffffff;
      border: 1px solid #444;
      border-radius: 6px;
      padding: 12px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 12px;
      resize: none;
      outline: none;
    `;
    textarea.value = jsonString;
    textarea.readOnly = true;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-top: 16px;
    `;

    const copyButton = document.createElement('button');
    copyButton.style.cssText = `
      background: #FF6B35;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
    `;
    copyButton.textContent = '📋 Copy to Clipboard';
    copyButton.onclick = async () => {
      try {
        await navigator.clipboard.writeText(jsonString);
        copyButton.textContent = '✅ Copied!';
        setTimeout(() => {
          copyButton.textContent = '📋 Copy to Clipboard';
        }, 2000);
      } catch (err) {
        console.warn('Manual clipboard copy failed:', err);
        textarea.select();
        copyButton.textContent = '⚠️ Select & Copy Manually';
      }
    };

    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
      background: #666;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
    `;
    closeButton.textContent = 'Close';
    closeButton.onclick = () => {
      document.body.removeChild(modal);
    };

    buttonContainer.appendChild(copyButton);
    buttonContainer.appendChild(closeButton);

    content.appendChild(header);
    content.appendChild(instructions);
    content.appendChild(textarea);
    content.appendChild(buttonContainer);
    modal.appendChild(content);

    document.body.appendChild(modal);

    // Auto-select text for easy copying
    textarea.select();
    textarea.focus();

    // Close on escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  };

  const handleImportLibrary = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonContent = e.target?.result as string;
        const importData = JSON.parse(jsonContent);
        console.log('Import data received:', importData);
        
        if (importData.metadata && importData.fireworkTypes) {
          handleFireworkLibraryImport(importData);
        } else if (importData.format === 'lume-show-v1') {
          handleShowFormatImport(importData);
        } else {
          console.warn('Unknown import format:', importData);
          alert('❌ Unsupported file format. Please make sure this is a valid LUME firework types or show file.');
        }
        
      } catch (error) {
        console.error('Import failed:', error);
        alert(`❌ Import failed: ${error instanceof Error ? error.message : 'Invalid JSON format'}\n\nPlease check that the file is a valid JSON file exported from LUME.`);
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const handleFireworkLibraryImport = (importData: any) => {
    console.log('Detected LUME firework library format');
    
    let importedCount = 0;
    let skippedCount = 0;
    
    importData.fireworkTypes.forEach((fireworkType: any) => {
      try {
        const existing = fireworkTypes.find(ft => ft.id === fireworkType.id);
        
        if (existing) {
          updateFireworkType(fireworkType.id, fireworkType);
          console.log(`Updated firework type: ${fireworkType.name}`);
        } else {
          addFireworkType(fireworkType);
          console.log(`Added firework type: ${fireworkType.name}`);
        }
        importedCount++;
      } catch (error) {
        console.warn(`Failed to import firework type ${fireworkType.name}:`, error);
        skippedCount++;
      }
    });
    
    console.log(`Import completed: ${importedCount} imported, ${skippedCount} skipped`);
    
    alert(`🎆 Import Successful!\n\n📊 Results:\n• ${importedCount} firework types imported\n• ${skippedCount} skipped (errors)\n• Total in library: ${fireworkTypes.length + importedCount - skippedCount}\n\n${importData.metadata.name || 'Firework Types'} has been imported!`);
  };

  const handleShowFormatImport = (importData: any) => {
    console.log('Detected LUME show format, using store import');
    
    const success = importShow(importData);
    
    if (success) {
      alert('🎆 Show and firework types imported successfully!');
    } else {
      alert('❌ Failed to import show. Please check the file format.');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedIntensity('');
  };

  const activeFiltersCount = [searchTerm, selectedCategory, selectedIntensity].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Firework Types</h1>
          <p className="text-gray-400 mt-1">
            Manage your firework type library ({filteredFireworks.length} of {fireworkTypes.length} types)
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Import */}
          <label className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportLibrary}
              className="hidden"
            />
          </label>

          {/* Export */}
          <button
            onClick={handleExportLibrary}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>

          {/* Add Firework */}
          <button
            onClick={handleAddFirework}
            className="flex items-center space-x-2 px-4 py-2 bg-lume-primary hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Firework Type</span>
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search firework types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-lume-primary focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters || activeFiltersCount > 0
                ? 'bg-lume-primary text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-white text-lume-primary text-xs rounded-full px-2 py-0.5 font-medium">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 px-3 py-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Filter Controls */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-700">
            {/* Category Filter */}
            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Intensity Filter */}
            <div>
              <label htmlFor="intensity-filter" className="block text-sm font-medium text-gray-300 mb-2">
                Intensity
              </label>
              <select
                id="intensity-filter"
                value={selectedIntensity}
                onChange={(e) => setSelectedIntensity(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-lume-primary focus:border-transparent"
              >
                <option value="">All Intensities</option>
                {intensities.map(intensity => (
                  <option key={intensity} value={intensity}>
                    {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Firework Types Grid */}
      {filteredFireworks.length === 0 ? (
        <div className="text-center py-12">
          {fireworkTypes.length === 0 ? (
            <div className="space-y-3">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-300">No Firework Types Yet</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Get started by adding your first firework type to build your collection.
              </p>
              <button
                onClick={handleAddFirework}
                className="mt-4 px-4 py-2 bg-lume-primary hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                Add Your First Firework Type
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-300">No Results Found</h3>
              <p className="text-gray-500">
                No firework types match your current search and filters.
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFireworks.map((firework) => (
            <FireworkTypeCard
              key={firework.id}
              fireworkType={firework}
              onEdit={handleEditFirework}
              onDelete={handleDeleteFirework}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <FireworkTypeModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingFirework(null);
          }}
          onSave={handleModalSave}
          fireworkType={editingFirework}
        />
      )}
    </div>
  );
};
