import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';

export default function ModernLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Custom Light Navbar for Landing Page */}
      <nav className="bg-white shadow-sm py-4 relative w-full z-50">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto px-4">
          {/* Logo */}
          <Link to="/">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🌾</span>
              <span className="text-green-600 font-bold text-xl">AgriTech HUB</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-green-600 transition-colors font-medium">Home</Link>
            <Link to="/about" className="text-gray-700 hover:text-green-600 transition-colors font-medium">About</Link>
            <Link to="/disease-detection" className="text-gray-700 hover:text-green-600 transition-colors font-medium">Products</Link>
            <Link to="/crop-recommendation" className="text-gray-700 hover:text-green-600 transition-colors font-medium">Projects</Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            <button className="hidden md:block text-gray-600 hover:text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="hidden md:block text-gray-600 hover:text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 1.5M6 13v6a2 2 0 002 2h8a2 2 0 002-2v-6" />
              </svg>
            </button>
            <Link
              to="/contact"
              className="bg-yellow-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-yellow-600 transition-colors"
            >
              <span className="hidden sm:inline">Call Anytime</span>
              <span className="sm:hidden">📞</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Light Theme with Background Image */}
      <section 
        className="relative min-h-screen flex items-center justify-start bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1574943320219-553eb213f72d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')"
        }}
      >
        {/* Light Overlay for Better Text Readability */}
        <div className="absolute inset-0 bg-white bg-opacity-40"></div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl">
            {/* Welcome Text */}
            <p className="text-gray-800 text-sm lg:text-base font-semibold mb-4 tracking-wide uppercase">
              WELCOME TO AGRICULTURAL PRODUCTS RURAL
              <br />
              ENTREPRENEURSHIP MANAGEMENT SYSTEM.
            </p>
            
            {/* Main Heading */}
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
              AGRITECH
              <br />
              <span className="text-green-600">HUB</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-gray-700 text-xl lg:text-2xl mb-8 max-w-2xl leading-relaxed font-medium">
              Empowering Rural Dreams, Nurturing Agricultural Growth - 
              AgriTech Hub cultivates prosperity from the roots up.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/disease-detection"
                className="px-8 py-4 bg-yellow-500 text-white rounded-lg text-lg font-semibold hover:bg-yellow-600 transition-all shadow-lg transform hover:scale-105"
              >
                SELL HERE
              </Link>
              <Link
                to="/crop-recommendation"
                className="px-8 py-4 bg-yellow-600 text-white rounded-lg text-lg font-semibold hover:bg-yellow-700 transition-all transform hover:scale-105"
              >
                BUY HERE
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-1/4 right-1/4 z-5">
          <div className="w-16 h-16 bg-yellow-400 transform rotate-45 opacity-60"></div>
          <div className="w-8 h-8 bg-yellow-500 transform rotate-45 opacity-40 mt-4 ml-8"></div>
          <div className="w-4 h-4 bg-yellow-300 transform rotate-45 opacity-30 mt-2 ml-4"></div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <h3 className="text-3xl lg:text-4xl font-bold text-green-600">10K+</h3>
              <p className="text-gray-700 font-medium">Active Farmers</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl lg:text-4xl font-bold text-green-600">95%</h3>
              <p className="text-gray-700 font-medium">Accuracy Rate</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl lg:text-4xl font-bold text-green-600">50+</h3>
              <p className="text-gray-700 font-medium">Crop Types</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl lg:text-4xl font-bold text-green-600">24/7</h3>
              <p className="text-gray-700 font-medium">Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Features</h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              AgriTech Provides Farmers With Essential Tools For Smarter Farming. It Offers
              Personalized Crop Recommendations Based On Soil And Climate, Helps Identify Plant
              Diseases Through Image Analysis, And Provides Real-Time Weather Forecasts.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Link to="/crop-recommendation" className="group">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 h-full">
                <div className="text-4xl mb-4">🌱</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Crop Recommendations</h3>
                <p className="text-gray-600">Get personalized crop suggestions based on your soil, climate, and location data.</p>
              </div>
            </Link>

            <Link to="/disease-detection" className="group">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 h-full">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Plant Disease Detection</h3>
                <p className="text-gray-600">Identify plant diseases instantly by uploading crop images for AI analysis.</p>
              </div>
            </Link>

            <Link to="/" className="group">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 h-full">
                <div className="text-4xl mb-4">🌤️</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Weather Forecast</h3>
                <p className="text-gray-600">Get real-time weather insights and plan your farming activities accordingly.</p>
              </div>
            </Link>

            <Link to="/market-prices" className="group">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 h-full">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Market Prices</h3>
                <p className="text-gray-600">Stay updated with current market prices for better selling decisions.</p>
              </div>
            </Link>

            <Link to="/government-schemes" className="group">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 h-full">
                <div className="text-4xl mb-4">🏛️</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Government Schemes</h3>
                <p className="text-gray-600">Access information about government schemes and subsidies for farmers.</p>
              </div>
            </Link>

            <Link to="/alerts" className="group">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 h-full">
                <div className="text-4xl mb-4">🚨</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Smart Alerts</h3>
                <p className="text-gray-600">Receive real-time notifications about disease outbreaks and farming updates.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Detailed Feature Sections */}
      <section className="py-20 px-24">
        <div className="container mx-auto px-24 lg:px-8 ">
          {/* Weather Forecast Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-gray-900">Weather Forecast</h2>
              <p className="text-xl text-gray-600">
                Plan Your Farming With Precision! Check Real-Time Weather Insights On
                Temperature, Humidity, And More. Integrated With Our Crop-Prediction Model For Optimal
                Decisions.
              </p>
              <Link
                to="/"
                className="inline-block px-8 py- 3 text-white rounded-lg font-semibold hover:bgge-700 transition-all"
              >
                Explore
              </Link>
            </div>
            <div className="lg:flex justify-end">
              <img
                src="https://images.unsplash.com/photo-1592210454359-9043f067919b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                alt="Agricultural Weather Technology"
                className="rounded-2xl shadow-lg w-full max-w-md"
              />
            </div>
          </div>

          {/* Smart Crop Planning Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="lg:flex justify-start order-2 lg:order-1">
              <img
                src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                alt="Crop Planning"
                className="rounded-2xl shadow-lg w-full max-w-md"
              />
            </div>
            <div className="space-y-6 order-1 lg:order-2">
              <h2 className="text-4xl font-bold text-gray-900">Smart Crop Planning</h2>
              <p className="text-xl text-gray-600">
                Harness The Power Of Data Analysis To Predict Crop Suitability, Providing
                Insights Into Optimal Cultivation Conditions. AgriTech Optimizes Farming Decisions
                Based On Comprehensive Factors Like Soil Quality, Weather, And More.
              </p>
              <Link
                to="/crop-recommendation"
                className="inline-block px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
              >
                Explore
              </Link>
            </div>
          </div>

          {/* Plant Disease Identification Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-gray-900">Plant Disease Identification</h2>
              <p className="text-xl text-gray-600">
                Assist Farmers In Detecting Plant Diseases By Enabling Image Uploads, Utilizing
                This Analysis For Prompt And Precise Identification, Enhancing Farming
                Efficiency And Crop Management.
              </p>
              <Link
                to="/disease-detection"
                className="inline-block px-8 py-3 bg-green-600 rounded-lg text-white font-semibold hover:bg-green-700 transition-all"
              >
                Explore
              </Link>
            </div>
            <div className="lg:flex justify-end">
              <img
                src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                alt="Plant Disease Detection and Analysis"
                className="rounded-2xl shadow-lg w-full max-w-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">AgriTech</h3>
              <p className="text-gray-400">
                Your Smart Farming Assistant for modern agriculture solutions.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white transition">Home</Link></li>
                <li><Link to="/modern-landing#features" className="text-gray-400 hover:text-white transition">Features</Link></li>
                <li><Link to="/alerts" className="text-gray-400 hover:text-white transition">Alerts</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Features</h4>
              <ul className="space-y-2">
                <li><Link to="/disease-detection" className="text-gray-400 hover:text-white transition">Disease Detection</Link></li>
                <li><Link to="/crop-recommendation" className="text-gray-400 hover:text-white transition">Crop Recommendations</Link></li>
                <li><Link to="/market-prices" className="text-gray-400 hover:text-white transition">Market Prices</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              &copy; {new Date().getFullYear()} AgriTech. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
