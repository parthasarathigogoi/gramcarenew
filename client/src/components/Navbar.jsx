import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ online }) => {
  const { t, toggleLanguage } = useLanguage();
  const { isAuthenticated, currentUser, toggleLoginModal, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  return (
    <nav className="bg-blue-600 text-white sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clipRule="evenodd" />
              </svg>
              <span className="font-bold text-xl">SwasthAI</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className={`hover:text-blue-200 transition-colors py-2 ${location.pathname === '/' ? 'border-b-2 border-white font-medium' : ''}`}
            >
              {t('home')}
            </Link>
            <Link 
              to="/dashboard" 
              className={`hover:text-blue-200 transition-colors py-2 ${location.pathname === '/dashboard' ? 'border-b-2 border-white font-medium' : ''}`}
            >
              {t('dashboard')}
            </Link>
            <Link 
              to="/booking" 
              className={`hover:text-blue-200 transition-colors py-2 ${location.pathname === '/booking' ? 'border-b-2 border-white font-medium' : ''}`}
            >
              {t('bookConsultation')}
            </Link>
            <Link 
              to="/hotzones" 
              className={`hover:text-blue-200 transition-colors py-2 ${location.pathname === '/hotzones' ? 'border-b-2 border-white font-medium' : ''}`}
            >
              {t('hotzones')}
            </Link>

          </div>
          
          <div className="flex items-center space-x-3">
            {!online && (
              <div className="mr-4 text-sm bg-red-500 px-2 py-1 rounded-full flex items-center">
                <span className="inline-block w-2 h-2 bg-white rounded-full mr-1"></span>
                Offline
              </div>
            )}
            <button 
              onClick={toggleLanguage}
              className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              {t('languageToggle')}
            </button>
            
            {/* Profile Icon */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-white text-blue-600 flex items-center justify-center">
                  {isAuthenticated ? (
                    <span className="font-medium text-sm">
                      {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
              
              {/* Profile Dropdown */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
                        <p className="text-xs text-gray-500">{currentUser?.id}</p>
                      </div>
                      <Link 
                        to="/profile" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        {t('profile') || 'Profile'}
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setProfileMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {t('logout') || 'Logout'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        toggleLoginModal();
                        setProfileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('login') || 'Login'}
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden ml-1">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex items-center p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="flex flex-col space-y-3 pb-3">
              <Link to="/" className="hover:bg-blue-700 px-2 py-1 rounded">{t('home')}</Link>
              <Link to="/dashboard" className="hover:bg-blue-700 px-2 py-1 rounded">{t('dashboard')}</Link>
              <Link to="/booking" className="hover:bg-blue-700 px-2 py-1 rounded">{t('bookConsultation')}</Link>
              <Link to="/hotzones" className="hover:bg-blue-700 px-2 py-1 rounded">{t('hotzones')}</Link>
              
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="hover:bg-blue-700 px-2 py-1 rounded">{t('profile') || 'Profile'}</Link>
                  <button 
                    onClick={logout}
                    className="text-left hover:bg-blue-700 px-2 py-1 rounded"
                  >
                    {t('logout') || 'Logout'}
                  </button>
                </>
              ) : (
                <button 
                  onClick={toggleLoginModal}
                  className="text-left hover:bg-blue-700 px-2 py-1 rounded"
                >
                  {t('login') || 'Login'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;