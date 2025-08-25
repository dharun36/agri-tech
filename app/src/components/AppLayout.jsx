import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import VerticalHeader from './VerticalHeader';
import MobileHeader from './header/MobileHeader';
import MobileBottomNav from './header/MobileBottomNav';
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

  // Use media query for responsive states with device breakpoints
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [isMobile, setIsMobile] = useState(windowWidth < 768);
  const [isTablet, setIsTablet] = useState(windowWidth >= 768 && windowWidth < 1024);
  const [isDesktop, setIsDesktop] = useState(windowWidth >= 1024);

  // Update window width and device states on resize
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);
      setIsMobile(newWidth < 768);
      setIsTablet(newWidth >= 768 && newWidth < 1024);
      setIsDesktop(newWidth >= 1024);
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
          {/* Desktop/Tablet sidebar - only visible on medium screens and above */}
          {!isMobile && (
            <div className="sidebar-container">
              <VerticalHeader collapsed={isTablet} />
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
            isTablet ?
              'with-vertical-header with-collapsed-sidebar' :
              'with-vertical-header'
          : ''}`}
        style={{
          minHeight: isExcludedPath ? '100vh' : isMobile ? 'calc(100vh - 9rem)' : '100vh',
          overflowX: 'hidden'
        }}
        onClick={() => mobileMenuOpen && setMobileMenuOpen(false)}
      >
        {children}
      </div>
    </>
  );
};

export default AppLayout;