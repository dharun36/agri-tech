
import './App.css'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DetectDisease from './components/DetectDisease'
import Home from './components/Home'
import ModernHome from './components/ModernHome'
import LightThemeHome from './components/home/LightThemeHome'
import WeatherPage from './components/WeatherPage'
import CropRecommendation from './components/CropRecommendation'
import MarketPrices from './components/MarketPrices'
import DiseaseAlerts from './components/DiseaseAlerts'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ModernLandingPage from './components/ModernLandingPage';
import GovSchemes from './components/GovSchemes'
import MergedLightThemeHome from './components/home/MergedLightThemeHome';
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import Profile from './components/Profile'
import CropDetails from './components/crops/CropDetails'
import CropRouter from './components/crops/CropRouter'
import AppLayout from './components/AppLayout'
import ErrorBoundary from './components/ErrorBoundary'
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

    // Log route changes for debugging
    const handleRouteChange = () => {
      console.log('Current route:', window.location.pathname);
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  return (
    <Router>
      <ErrorBoundary>
        <AppLayout>
          <main className="main" style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
            <Routes>
              <Route path="/home" element={<LightThemeHome />} />
              <Route path="/dark-home" element={<ModernHome />} />
              <Route path="/old-home" element={<Home />} />
              <Route path="/disease-detection" element={<DetectDisease />} />
              <Route path="/weather" element={<WeatherPage />} />
              <Route path="/merged-home" element={<MergedLightThemeHome />} />
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

              {/* New two-step routing process for crop details */}
              <Route path="/crops/:id" element={<CropRouter />} />
              <Route path="/crop-details/:id" element={<CropDetails />} />
              <Route path="/tasks/:cropId" element={<LightThemeHome />} />

              {/* Fallback routes */}
              <Route path="/" element={<ModernLandingPage />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </main>
          <ToastContainer position="bottom-right" autoClose={10000} />
        </AppLayout>
      </ErrorBoundary>
    </Router>
  )
}

export default App
