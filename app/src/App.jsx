
import React from 'react'
import './App.css'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DetectDisease from './components/DetectDisease'
import Home from './components/Home'
import ModernHome from './components/ModernHome'
import LightThemeHome from './components/home/LightThemeHome'
import WeatherPage from './components/WeatherPage'
import TomorrowWeatherPage from './components/TomorrowWeatherPage'
import WeatherDemo from './components/weather/WeatherDemo'
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
import CropTaskSelector from './components/tasks/CropTaskSelector'
import TaskDashboard from './components/tasks/TaskDashboard'
// Import optimized task components
import OptimizedTaskDashboard from './components/tasks/OptimizedTaskDashboard'
import OptimizedTaskDetail from './components/tasks/OptimizedTaskDetail'
import AppLayout from './components/AppLayout'
import ErrorBoundary from './components/ErrorBoundary'
import TranslationDebugger from './components/TranslationDebugger'
// Import hooks and utilities
import useDocumentTitle from './hooks/useDocumentTitle'
import { pageTranslations } from './utils/translationHelper'

function App() {
  // We'll use document title in AppLayout instead of here
  // to ensure it has access to Router context

  // Get user ID from localStorage for alerts
  const userId = localStorage.getItem('userId'); // Temporary hardcode for testing

  // Request notification permission on app load
  React.useEffect(() => {
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
      {/* Alternative approach: You could use this component instead of the hook in AppLayout */}
      {/* <DocumentTitleHandler appName="AgriTech" /> */}

      <ErrorBoundary>
        <AppLayout>
          <main className="main" style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
            <Routes>
              <Route path="/home" element={<LightThemeHome />} />
              <Route path="/dark-home" element={<ModernHome />} />
              <Route path="/old-home" element={<Home />} />
              <Route path="/disease-detection" element={<DetectDisease />} />
              <Route path="/weather" element={<TomorrowWeatherPage />} />
              <Route path="/weather-old" element={<WeatherPage />} />
              <Route path="/weather-demo" element={<WeatherDemo />} />
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

              {/* Task management routes */}
              <Route path="/tasks" element={<div className="p-4"><CropTaskSelector /></div>} />
              {/* Using optimized components for better performance */}
              <Route path="/tasks/:cropId" element={<div className="p-4"><OptimizedTaskDashboard /></div>} />
              <Route path="/tasks/detail/:id" element={<div className="p-4"><OptimizedTaskDetail /></div>} />

              {/* Crop routes */}
              <Route path="/crops/:id" element={<CropDetails />} />

              {/* Fallback routes */}
              <Route path="/" element={<ModernLandingPage />} />
              {/* <Route path="*" element={<Navigate to="/home" replace />} /> */}
            </Routes>
          </main>
          <ToastContainer
            position="bottom-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            limit={1} // Limit to just one toast at a time
            toastStyle={{
              marginBottom: '10px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          />

          {/* Translation Debugger - Helps troubleshoot translation issues */}
          {/* <TranslationDebugger /> */}
        </AppLayout>
      </ErrorBoundary>
    </Router>
  )
}

export default App
