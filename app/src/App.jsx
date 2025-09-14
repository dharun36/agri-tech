
import './App.css'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DetectDisease from './components/DetectDisease'
import Home from './components/Home'
import ModernHome from './components/ModernHome'
import LightThemeHome from './components/home/LightThemeHome'
import CropRecommendation from './components/CropRecommendation'
import MarketPrices from './components/MarketPrices'
import DiseaseAlerts from './components/DiseaseAlerts'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ModernLandingPage from './components/ModernLandingPage';
import GovSchemes from './components/GovSchemes'

import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import Profile from './components/Profile'
import CropDetails from './components/crops/CropDetails'
import AppLayout from './components/AppLayout'
import { useEffect } from 'react'

function App() {
  // Get user ID from localStorage for alerts
  const userId = localStorage.getItem('userId'); // Temporary hardcode for testing

  // Request notification permission on app load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  return (
    <Router>
      <AppLayout>
        <main className="main" style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
          <Routes>
            
            <Route path="/home" element={<LightThemeHome />} />
            <Route path="/dark-home" element={<ModernHome />} />
            <Route path="/old-home" element={<Home />} />
            <Route path="/disease-detection" element={<DetectDisease />} />
            <Route path="/crop-recommendation" element={<CropRecommendation />} />
            <Route path="/market-prices" element={<MarketPrices />} />
            <Route path="/government-schemes" element={<GovSchemes />} />
            <Route path="/alerts" element={
              <div className="p-4">
                <DiseaseAlerts userId={userId} showGrouped={true} maxItems={20} />
              </div>
            } />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/crops/:id" element={<CropDetails />} />
            <Route path="/" element={<ModernLandingPage />} />
          </Routes>
        </main>
        <ToastContainer position="bottom-right" autoClose={10000} />
      </AppLayout>
    </Router>
  )
}

export default App
