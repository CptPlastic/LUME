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
    removeFireworkType
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
    console.log('🔽 Export firework types button clicked!');
    console.log('Firework types count:', fireworkTypes.length);
    
    try {
      console.log('📤 Starting firework types export...');
      console.log('🎆 Firework types count:', fireworkTypes.length);

      const { exportFile } = await import('../utils/export');
      
      const exportData = {
        metadata: {
          name: "Firework Types Library",
          description: "Exported firework types for LUME shows",
          createdAt: new Date().toISOString(),
          totalTypes: fireworkTypes.length
        },
        fireworkTypes: fireworkTypes,
        version: "1.0"
      };

      console.log('💾 Starting firework types file export...');
      const success = await exportFile({
        filename: 'firework-types-library',
        content: exportData,
        fileExtension: 'json',
        addTimestamp: true
      });
      
      if (success) {
        console.log('✅ Firework types export completed successfully');
        alert(`🎆 Export Successful!\n\nYour firework types library has been saved!\n\nThe file contains ${fireworkTypes.length} firework types ready for import.`);
      } else {
        alert('Export was cancelled');
      }
    } catch (error) {
      console.error('❌ Export failed:', error);
      alert(`❌ Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // LEGACY FUNCTION - COMMENTED OUT
  /*
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
  */

    const handleImportFireworks = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const content = await file.text();
        const importedFireworkTypes: FireworkType[] = JSON.parse(content);
        
        // Import each firework type
        let importedCount = 0;
        for (const fireworkType of importedFireworkTypes) {
          const existing = fireworkTypes.find(ft => ft.id === fireworkType.id);
          if (!existing) {
            addFireworkType(fireworkType);
            importedCount++;
          }
        }
        
        if (importedCount > 0) {
          alert(`Successfully imported ${importedCount} firework types!`);
        } else {
          alert('No new firework types to import. All types already exist.');
        }
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import firework types. Please check the file format.');
      }
      
      // Reset file input
      event.target.value = '';
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
              onChange={handleImportFireworks}
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
