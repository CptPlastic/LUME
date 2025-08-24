import { useState, useEffect } from 'react';
import './index.css';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { FireworkTypeManager } from './components/FireworkTypeManager';
import { LightingEffectManager } from './components/LightingEffectManager';
import { ShowBuilder } from './components/ShowBuilder';
import { audioStorageService } from './services/audio-storage';
import { useLumeStore } from './store/lume-store';

type ViewType = 'dashboard' | 'firework-types' | 'lighting-effects' | 'show-builder';

function App() {
  console.log('🚀 App component rendering - Full LUME App');
  
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const { restoreShowAudio, currentShow } = useLumeStore();

  // Initialize app and restore audio on startup
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🔄 Initializing audio storage service...');
        await audioStorageService.init();
        
        // Perform health check on stored audio files
        const healthCheck = await audioStorageService.performHealthCheck();
        console.log('🏥 Audio storage health check:', healthCheck);
        
        // List all stored files for debugging
        const storedFiles = await audioStorageService.listStoredFiles();
        console.log('📦 All stored audio files on startup:', storedFiles);
        
        // Debug current show state
        console.log('🎬 Current show state on startup:', {
          hasShow: !!currentShow,
          showName: currentShow?.name,
          hasAudio: !!currentShow?.audio,
          audioName: currentShow?.audio?.name,
          audioId: currentShow?.audio?.id,
          hasFile: !!currentShow?.audio?.file,
          hasUrl: !!currentShow?.audio?.url
        });
        
        // If there's a current show with audio metadata but no file, try to restore
        if (currentShow?.audio && !currentShow.audio.file && !currentShow.audio.url) {
          console.log('🔄 Attempting to restore show audio on app startup...');
          await restoreShowAudio();
        } else if (currentShow?.audio) {
          console.log('ℹ️ Audio already available, no restoration needed');
        } else {
          console.log('ℹ️ No current show or audio to restore');
        }
        
        setIsInitialized(true);
        console.log('✅ App initialization complete');
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        console.error('Error details:', error);
        setIsInitialized(true); // Still set to true to avoid blocking the UI
      }
    };

    initializeApp();
  }, [restoreShowAudio, currentShow?.audio?.id]);

  // Show loading state during initialization
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Initializing LUME</h2>
          <p className="text-gray-400">Restoring audio files and settings...</p>
        </div>
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'firework-types':
        return (
          <div className="flex-1 p-6 bg-gray-900">
            <div className="max-w-7xl mx-auto">
              <FireworkTypeManager />
            </div>
          </div>
        );
      case 'lighting-effects':
        return (
          <div className="flex-1 p-6 bg-gray-900">
            <div className="max-w-7xl mx-auto">
              <LightingEffectManager />
            </div>
          </div>
        );
      case 'show-builder':
        return (
          <div className="flex-1 p-6 bg-gray-900">
            <div className="max-w-7xl mx-auto">
              <ShowBuilder />
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      {renderCurrentView()}
    </div>
  );
}

export default App;
