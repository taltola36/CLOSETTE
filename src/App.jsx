import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import BottomNav from './components/layout/BottomNav';
import HomePage from './pages/HomePage';
import ClosetPage from './pages/ClosetPage';
import OutfitGeneratorPage from './pages/OutfitGeneratorPage';
import CalendarPage from './pages/CalendarPage';
import PackingPage from './pages/PackingPage';
import ProfilePage from './pages/ProfilePage';
import OnboardingPage from './pages/OnboardingPage';
import AddItemPage from './pages/AddItemPage';
import { isOnboardingComplete, getWardrobe, saveWardrobe, getProcessingVersion, setProcessingVersion } from './services/storage';
import { reprocessImage, PROCESSING_VERSION } from './services/imageProcessor';

function App() {
  const [onboardingDone, setOnboardingDone] = useState(isOnboardingComplete());
  const [toast, setToast] = useState(null);
  const [migrating, setMigrating] = useState(false);

  // Migrate existing wardrobe images when processing version changes
  useEffect(() => {
    const currentVersion = getProcessingVersion();
    if (currentVersion >= PROCESSING_VERSION) return;

    const items = getWardrobe();
    const itemsWithImages = items.filter(item => item.imageUrl && item.imageUrl.startsWith('data:'));
    if (itemsWithImages.length === 0) {
      setProcessingVersion(PROCESSING_VERSION);
      return;
    }

    setMigrating(true);
    (async () => {
      try {
        const updatedItems = [...items];
        for (const item of updatedItems) {
          if (item.imageUrl && item.imageUrl.startsWith('data:')) {
            try {
              item.imageUrl = await reprocessImage(item.imageUrl);
            } catch {
              // Keep original image if reprocessing fails
            }
          }
        }
        saveWardrobe(updatedItems);
        setProcessingVersion(PROCESSING_VERSION);
      } finally {
        setMigrating(false);
      }
    })();
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const handleOnboardingComplete = () => {
    setOnboardingDone(true);
  };

  if (!onboardingDone) {
    return <OnboardingPage onComplete={handleOnboardingComplete} />;
  }

  if (migrating) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
        <div className="spinner" style={{ width: 40, height: 40, border: '3px solid #eee', borderTopColor: '#B8907A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#6B5E5E', fontFamily: 'Assistant, sans-serif' }}>מעדכן תמונות...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="app">
        <div className="app-content">
          <Routes>
            <Route path="/" element={<HomePage showToast={showToast} />} />
            <Route path="/closet" element={<ClosetPage showToast={showToast} />} />
            <Route path="/closet/add" element={<AddItemPage showToast={showToast} />} />
            <Route path="/generator" element={<OutfitGeneratorPage showToast={showToast} />} />
            <Route path="/calendar" element={<CalendarPage showToast={showToast} />} />
            <Route path="/packing" element={<PackingPage showToast={showToast} />} />
            <Route path="/profile" element={<ProfilePage showToast={showToast} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
        <BottomNav />
        {toast && <div className="toast">{toast}</div>}
      </div>
    </HashRouter>
  );
}

export default App;
