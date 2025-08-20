import React, { useState } from 'react';
import './index.css';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { FireworkTypeManager } from './components/FireworkTypeManager';
import { ShowBuilder } from './components/ShowBuilder';

type ViewType = 'dashboard' | 'firework-types' | 'show-builder';

function App() {
  console.log('🚀 App component rendering - Full LUME App');
  
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');

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
