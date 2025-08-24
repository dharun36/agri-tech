
import './App.css'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DetectDisease from './components/DetectDisease'
import Header from './components/Header'
import Home from './components/Home'
import CropRecommendation from './components/CropRecommendation'
import MarketPrices from './components/MarketPrices'
import DiseaseAlerts from './components/DiseaseAlerts'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ModernLandingPage from './components/ModernLandingPage';
import GovSchemes from './components/GovSchemes'
import LandingPage from './components/LandingPage'
import Login from './components/Login'
import Signup from './components/Signup'
import { useEffect } from 'react'

function App() {
  // Get user ID from localStorage for alerts
  const userId = localStorage.getItem('userId') || "6888e92c7ff14b3bfc90158e"; // Temporary hardcode for testing

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
      <div className="container">
        <main className="main">
          <Routes>
            <Route path="/lan" element={<LandingPage />} />
            <Route path="/home" element={<Home />} />
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
            <Route path="/" element={<ModernLandingPage />} />
          </Routes>
        </main>
        <ToastContainer position="bottom-right" autoClose={10000} />
      </div>
    </Router>
  )
}

export default App
