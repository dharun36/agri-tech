import React from 'react';
import './index.css';
import './theme.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DetectDisease from './components/DetectDisease';
import Header from './components/Header';
import Home from './components/Home';
import CropRecommendation from './components/CropRecommendation';
import MarketPrices from './components/MarketPrices';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GovSchemes from './components/GovSchemes';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Signup from './components/Signup';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
          <Header />
          <main>
            <Routes>
              <Route path="/lan" element={<LandingPage />} />
              <Route path="/" element={<Home />} />
              <Route path="/disease-detection" element={<DetectDisease />} />
              <Route path="/crop-recommendation" element={<CropRecommendation />} />
              <Route path="/market-prices" element={<MarketPrices />} />
              <Route path="/government-schemes" element={<GovSchemes />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </main>
          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;