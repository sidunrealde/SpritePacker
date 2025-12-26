// src/App.tsx
import { Sidebar } from './components/Sidebar';
import { PreviewCanvas } from './components/PreviewCanvas';
import { AffiliateSidebar } from './components/Ads/AffiliateSidebar';

function App() {
  return (
    <div className="flex h-screen w-full bg-gray-900 text-white overflow-hidden">
      {/* Left Sidebar - Controls */}
      <Sidebar />

      {/* Main Content - Canvas Preview */}
      <main className="flex-1 relative flex flex-col">
        <header className="h-14 border-b border-gray-700 flex items-center px-4 justify-between bg-gray-800">
          <h1 className="font-bold text-lg">SpritePacker</h1>
          <div className="text-sm text-gray-400">v0.1.0</div>
        </header>

        <div className="flex-1 relative bg-gray-950 overflow-auto flex items-center justify-center p-8">
          <PreviewCanvas />
        </div>
      </main>

      {/* Right Sidebar - Ads/Affiliate */}
      <AffiliateSidebar />
    </div>
  );
}

export default App;
