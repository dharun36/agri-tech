import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import VerticalHeader from './VerticalHeader';
import MobileHeader from './MobileHeader';
import MobileBottomNav from './MobileBottomNav';
import '../styles/layout.css';
import '../styles/animations.css';

const AppLayout = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if current path is login, signup, or landing page
  const isExcludedPath = path === '/' || path === '/login' || path === '/signup';

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [path]);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Use media query for initial collapsed state
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [isMobile, setIsMobile] = useState(windowWidth < 768);

  // Update window width on resize
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);
      setIsMobile(newWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get userId for alerts
  const userId = localStorage.getItem('userId');

  return (
    <>
      {/* Navigation components */}
      {!isExcludedPath && (
        <>
          {/* Desktop sidebar - only visible on medium screens and above */}
          {!isMobile && (
            <div className="sidebar-animate-in">
              <VerticalHeader collapsed={false} />
            </div>
          )}

          {/* Mobile top header - only visible on small screens */}
          {isMobile && (
            <>
              <div className="mobile-header-animate">
                <MobileHeader onMenuToggle={toggleMobileMenu} isMenuOpen={mobileMenuOpen} />
              </div>

              {/* Mobile bottom navigation - only visible on small screens */}
              <MobileBottomNav userId={userId} />
            </>
          )}
        </>
      )}

      {/* Mobile menu overlay - only shown when menu is open on mobile */}
      {mobileMenuOpen && !isExcludedPath && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          style={{ animation: 'fadeIn 0.2s ease forwards' }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content area */}
      <div
        className={`transition-all duration-300 flex flex-col ${!isExcludedPath ?
          isMobile ?
            'with-vertical-header with-mobile-bottom-nav' :
            'with-vertical-header'
          : ''}`}
        style={{ minHeight: isExcludedPath ? '100vh' : isMobile ? 'calc(100vh - 9rem)' : '100vh' }}
        onClick={() => mobileMenuOpen && setMobileMenuOpen(false)}
      >
        {children}
      </div>
    </>
  );
};

export default AppLayout;