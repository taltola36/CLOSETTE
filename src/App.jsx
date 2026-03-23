import { useState } from 'react';
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
import { isOnboardingComplete } from './services/storage';

function App() {
  const [onboardingDone, setOnboardingDone] = useState(isOnboardingComplete());
  const [toast, setToast] = useState(null);

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
