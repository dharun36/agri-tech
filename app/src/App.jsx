
import './App.css'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DetectDisease from './components/DetectDisease'
import Header from './components/Header'
import Home from './components/Home'
import CropRecommendation from './components/CropRecommendation'
import MarketPrices from './components/MarketPrices'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import GovSchemes from './components/GovSchemes'
import LandingPage from './components/LandingPage'
import Login from './components/Login'
import Signup from './components/Signup'

function App() {

  return (
    <Router>
      <div className="container">
        <Header />
        <main className="main">
          <Routes>
            <Route path="/lan" element={<LandingPage />} />
            <Route path="/" element={<Home />} />
            <Route path="/disease-detection" element={<DetectDisease />} />
            <Route path="/crop-recommendation" element={<CropRecommendation />} />
            <Route path="/market-prices" element={<MarketPrices />} />
            <Route path="/government-schemes" element={<GovSchemes />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </main>
        <ToastContainer position="top-right" autoClose={10000} />
      </div>
    </Router>
  )
}

export default App
