import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AlertsBadge from './AlertsBadge';
import { useTranslation } from 'react-i18next';
import {
  FaSeedling,
  FaHome,
  FaSearch,
  FaRupeeSign,
  FaHandHoldingUsd,
  FaLeaf,
  FaSignInAlt,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaBell
} from 'react-icons/fa';

const VerticalHeader = ({ collapsed: propCollapsed }) => {
  const { t, i18n } = useTranslation();
  // Use prop collapsed state if provided, otherwise use local state
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = propCollapsed !== undefined ? propCollapsed : internalCollapsed;

  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();
  const location = useLocation();

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    // Listen for login/logout changes from other tabs
    const syncAuth = () => setLoggedIn(!!localStorage.getItem('token'));
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  // Update loggedIn state on mount and when token changes
  useEffect(() => {
    setLoggedIn(!!localStorage.getItem('token'));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    setLoggedIn(false);
    navigate('/login');
  };

  // Function to check if a path is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className={`h-screen bg-white shadow-md fixed top-0 left-0 z-40 transition-width duration-300 ${collapsed ? 'w-16' : 'w-64'} border-r border-gray-200`}>
      {/* Logo and Collapse Button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white">
              <FaSeedling className="text-lg" />
            </div>
            <div>
              <span className="font-bold text-xl">
                <span className="text-green-600">Agri</span>
                <span className="text-yellow-500">Tech</span>
              </span>
            </div>
          </Link>
        )}
        {collapsed && (
          <Link to="/" className="w-full flex justify-center">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white">
              <FaSeedling className="text-lg" />
            </div>
          </Link>
        )}
        {propCollapsed === undefined && (
          <button
            onClick={() => setInternalCollapsed(!internalCollapsed)}
            className="text-gray-500 hover:bg-gray-100 p-2 rounded-full"
          >
            {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="py-4">
        <ul className="space-y-1">
          <li>
            <Link
              to="/home"
              className={`flex items-center ${collapsed ? 'justify-center' : 'px-4'} py-3 ${isActive('/home') ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <FaHome className={`${collapsed ? 'text-xl' : 'text-lg mr-3'}`} />
              {!collapsed && <span>{t('home')}</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/disease-detection"
              className={`flex items-center ${collapsed ? 'justify-center' : 'px-4'} py-3 ${isActive('/disease-detection') ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <FaSearch className={`${collapsed ? 'text-xl' : 'text-lg mr-3'}`} />
              {!collapsed && <span>{t('disease_detection')}</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/market-prices"
              className={`flex items-center ${collapsed ? 'justify-center' : 'px-4'} py-3 ${isActive('/market-prices') ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <FaRupeeSign className={`${collapsed ? 'text-xl' : 'text-lg mr-3'}`} />
              {!collapsed && <span>{t('market_prices')}</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/government-schemes"
              className={`flex items-center ${collapsed ? 'justify-center' : 'px-4'} py-3 ${isActive('/government-schemes') ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <FaHandHoldingUsd className={`${collapsed ? 'text-xl' : 'text-lg mr-3'}`} />
              {!collapsed && <span>{t('government_schemes')}</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/crop-recommendation"
              className={`flex items-center ${collapsed ? 'justify-center' : 'px-4'} py-3 ${isActive('/crop-recommendation') ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <FaLeaf className={`${collapsed ? 'text-xl' : 'text-lg mr-3'}`} />
              {!collapsed && <span>{t('crop_recommendation')}</span>}
            </Link>
          </li>
        </ul>
      </div>

      {/* Bottom Section - User Controls */}
      <div className={`absolute bottom-0 left-0 w-full pb-4 border-t border-gray-100 pt-4 ${collapsed ? 'px-2' : 'px-4'} bg-white`}>
        <div className={`flex ${collapsed ? 'flex-col items-center' : 'items-center justify-between'} mb-3 space-y-2`}>
          {/* Alert Badge */}
          <div className={`${!collapsed ? "flex-1" : ""}`}>
            {loggedIn && userId ? (
              <AlertsBadge
                userId={userId}
                onClick={() => navigate('/alerts')}
                className={`text-gray-700 hover:bg-gray-100 p-2 rounded-md ${collapsed ? 'mb-2' : ''}`}
                showCount={true}
              />
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="relative p-2 rounded-md hover:bg-gray-100"
                title={t('login_to_see_alerts')}
              >
                <FaBell className="text-gray-700" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
              </button>
            )}
          </div>

          {/* Language Switcher */}
          <div className={`${collapsed ? "mt-2" : ""} language-switcher`}>
            {collapsed ? (
              <div className="flex flex-col items-center space-y-2">
                <button
                  onClick={() => i18n.changeLanguage('en')}
                  className={`w-8 h-8 text-xs font-medium rounded-full flex items-center justify-center transition-colors ${i18n.language === 'en' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  title="English"
                >
                  EN
                </button>
                <button
                  onClick={() => i18n.changeLanguage('ta')}
                  className={`w-8 h-8 text-xs font-medium rounded-full flex items-center justify-center transition-colors ${i18n.language === 'ta' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  title="Tamil"
                >
                  TA
                </button>
              </div>
            ) : (
              <div className="flex items-center rounded-md bg-gray-100 p-1">
                <button
                  onClick={() => i18n.changeLanguage('en')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${i18n.language === 'en' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                  title="English"
                >
                  EN
                </button>
                <button
                  onClick={() => i18n.changeLanguage('ta')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${i18n.language === 'ta' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                  title="Tamil"
                >
                  TA
                </button>
              </div>
            )}
          </div>
        </div>

        {!loggedIn ? (
          <Link
            to="/login"
            className={`${collapsed ? 'justify-center' : ''} flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition font-medium w-full text-center`}
          >
            <FaSignInAlt />
            {!collapsed && <span>{t('sign_in')}</span>}
          </Link>
        ) : (
          <button
            onClick={handleLogout}
            className={`${collapsed ? 'justify-center' : ''} flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition font-medium w-full text-center`}
          >
            <FaSignOutAlt />
            {!collapsed && <span>{t('logout')}</span>}
          </button>
        )}
      </div>
    </div>
  );
};

export default VerticalHeader;
