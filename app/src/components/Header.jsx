import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : 'auto';
    // Listen for login/logout changes from other tabs
    const syncAuth = () => setLoggedIn(!!localStorage.getItem('token'));
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, [menuOpen]);

  // Update loggedIn state on mount and when token changes
  useEffect(() => {
    setLoggedIn(!!localStorage.getItem('token'));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setLoggedIn(false);
    navigate('/login');
  };

  return (
    <nav className="bg-black  px-6 py-4 relative w-full z-50">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <i className="fas fa-seedling text-white text-lg"></i>
          <span className="text-white font-bold text-lg select-none">AgroTech</span>
        </div>

        {/* Hamburger Icon */}
        <div className="lg:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
          </button>
        </div>

        {/* Desktop Navigation */}
        <ul className="hidden lg:flex space-x-4 text-xs font-semibold text-white items-center">
          <li><Link to="/" className="px-3 py-1 rounded hover:bg-gray-800">Home</Link></li>
          <li><Link to="/disease-detection" className="px-3 py-1 rounded hover:bg-gray-800">Disease Detection</Link></li>
          <li><Link to="/market-prices" className="px-3 py-1 rounded hover:bg-gray-800">Market Prices</Link></li>
          <li><Link to="/government-schemes" className="px-3 py-1 rounded hover:bg-gray-800">Government Schemes</Link></li>
          <li><Link to="/crop-recommendation" className="px-3 py-1 rounded hover:bg-gray-800">Crop Recommendation</Link></li>
          {!loggedIn ? (
            <li>
              <Link to="/login" className="border-2 border-white bg-600 hover:bg-700 text-white px-4 py-1 rounded transition font-bold">Sign In</Link>
            </li>
          ) : (
            <li>
              <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded transition font-bold">Logout</button>
            </li>
          )}
        </ul>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-full bg-black text-white px-6 py-4 z-40 transition-transform duration-300 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-lg">AgroTech</span>
          <button onClick={() => setMenuOpen(false)}>
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        <ul className="space-y-4 text-sm font-semibold">
          <li><Link to="/" onClick={() => setMenuOpen(false)} className="block hover:bg-gray-800 rounded px-2 py-1">Home</Link></li>
          <li><Link to="/disease-detection" onClick={() => setMenuOpen(false)} className="block hover:bg-gray-800 rounded px-2 py-1">Disease Detection</Link></li>
          <li><Link to="/market-prices" onClick={() => setMenuOpen(false)} className="block hover:bg-gray-800 rounded px-2 py-1">Market Prices</Link></li>
          <li><Link to="/government-schemes" onClick={() => setMenuOpen(false)} className="block hover:bg-gray-800 rounded px-2 py-1">Government Schemes</Link></li>
          <li><Link to="/crop-recommendation" onClick={() => setMenuOpen(false)} className="block hover:bg-gray-800 rounded px-2 py-1">Crop Recommendation</Link></li>
          {!loggedIn ? (
            <li>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="bg-600 hover:bg-700 text-white px-4 py-1 rounded transition font-bold block text-center">Sign In</Link>
            </li>
          ) : (
            <li>
              <button onClick={() => { setMenuOpen(false); handleLogout(); }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded transition font-bold w-full text-center">Logout</button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Header;
