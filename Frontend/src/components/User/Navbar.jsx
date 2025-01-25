import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../Context/UserContext';
import AiSnippet from '../Modals/SnippetModals/AiSnippet';
import {motion} from "framer-motion";
const Navbar = () => {
  const { isAuthenticated, user, logout } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRefs = useRef({});
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !dropdownRefs.current[activeDropdown]?.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  const isActivePath = (path) => location.pathname === path;

  const navCategories = {
    tools: {
      label: 'Developer Tools',
      items: [
        { to: '/snippets', label: 'Code Snippets' },
        { to: '/directories', label: 'Directories' },
        { to: '/groups', label: 'Groups' },
      ]
    },
    media: {
      label: 'Media',
      items: [
        { to: '/blog', label: 'Blog' },
        { to: '/blog/create', label: 'Create Blog' },
        { to: '/public', label: 'Public Data' }
      ]
    }
  };

  const NavDropdown = ({ category, items, isActive }) => (
    <div 
      className="relative group"
      ref={el => dropdownRefs.current[category] = el}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className={`px-4 py-2 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-500/10 transition-all duration-200 flex items-center gap-1 text-sm font-medium ${
          isActive ? 'text-white bg-indigo-500/10' : ''
        }`}
        onClick={() => setActiveDropdown(isActive ? null : category)}
      >
        {category}
        <svg className={`w-4 h-4 transition-transform ${isActive ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isActive && (
        <div className="absolute top-full left-0 mt-1 py-2 bg-[#0B1120]/90 rounded-xl border border-indigo-500/30 shadow-lg min-w-[200px] backdrop-blur-xl z-50">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`block px-4 py-2 text-sm text-indigo-300 hover:text-white hover:bg-indigo-500/10 transition-all duration-200 ${
                isActivePath(item.to) && 'bg-indigo-500/10 text-white'
              }`}
              onClick={() => {
                setActiveDropdown(null);
                setIsMobileMenuOpen(false);
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSaveAiSnippet = (snippetData) => {
    // Handle saving the AI generated snippet
    console.log('Saving AI snippet:', snippetData);
    setIsAiModalOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B1120]/80 backdrop-blur-xl border-b border-indigo-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-indigo-300 
                         hover:text-white hover:bg-indigo-500/10 transition-all"
              >
                <span className="sr-only">Open menu</span>
                <svg className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <Link to={isAuthenticated ? "/" : "/"} className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                  CodeArc
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {isAuthenticated ? (
                <>
                  {/* Add Home button here */}
                  <Link
                    to="/home"
                    className={`px-4 py-2 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-500/10 
                               transition-all duration-200 flex items-center gap-1 text-sm font-medium ${
                               isActivePath('/') ? 'text-white bg-indigo-500/10' : ''
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Home
                  </Link>
                  
                  {Object.entries(navCategories).map(([key, { label, items }]) => (
                    <NavDropdown
                      key={key}
                      category={label}
                      items={items}
                      isActive={activeDropdown === label}
                    />
                  ))}
                  <button
                    onClick={() => setIsAiModalOpen(true)}
                    className="px-4 py-2 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-500/10 transition-all duration-200 text-sm font-medium"
                  >
                    AI Snippet
                  </button>
                  <div className="relative ml-3 group">
                    <button className="flex items-center space-x-1 px-4 py-2 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-500/10 transition-all duration-200">
                      <span className="text-sm font-medium">{user?.username}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className="hidden group-hover:block absolute right-0 mt-1 w-48 rounded-xl bg-[#0B1120]/90 backdrop-blur-xl border border-indigo-500/30 shadow-lg py-1">
                      <Link to="/profile" className="block px-4 py-2 text-sm text-indigo-300 hover:text-white transition-colors duration-200">
                        Profile
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-indigo-300 hover:text-white transition-colors duration-200"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-4 ml-4">
                  <Link to="/login" className="text-indigo-300 hover:text-white transition-colors duration-200 text-sm font-medium">
                    Sign in
                  </Link>
                  <Link to="/register" className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_25px_rgba(99,102,241,0.35)]">
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button removed as it's now part of the logo section */}
          </div>
        </div>

        {/* Mobile menu with animation */}
        <motion.div 
          initial={false}
          animate={{
            height: isMobileMenuOpen ? 'auto' : 0,
            opacity: isMobileMenuOpen ? 1 : 0
          }}
          transition={{ duration: 0.2 }}
          className={`md:hidden overflow-hidden bg-[#0B1120]/90 backdrop-blur-xl border-t border-indigo-500/20`}
        >
          <div className="px-4 py-2 space-y-1">
            {/* ...existing mobile menu items with enhanced styles... */}
            {isAuthenticated ? (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-2"
              >
                {/* Add Home button to mobile menu */}
                <Link
                  to="/"
                  className="px-4 py-2 rounded-xl text-indigo-300 hover:text-white 
                           hover:bg-indigo-500/10 transition-all text-sm font-medium flex items-center gap-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Home
                </Link>

                {Object.entries(navCategories).map(([key, { items }]) => (
                  <div key={key} className="space-y-1">
                    {items.map(item => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="block px-4 py-2 rounded-xl text-indigo-300 hover:text-white 
                                 hover:bg-indigo-500/10 transition-all text-sm font-medium"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ))}
                <button
                  onClick={() => {
                    setIsAiModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 rounded-xl text-indigo-300 
                           hover:text-white hover:bg-indigo-500/10 transition-all text-sm font-medium"
                >
                  AI Snippet
                </button>
                <hr className="border-indigo-500/20 my-2" />
                <Link
                  to="/profile"
                  className="block px-4 py-2 rounded-xl text-indigo-300 hover:text-white 
                           hover:bg-indigo-500/10 transition-all text-sm font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 rounded-xl text-indigo-300 
                           hover:text-white hover:bg-indigo-500/10 transition-all text-sm font-medium"
                >
                  Sign out
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-2 p-4"
              >
                <Link
                  to="/login"
                  className="w-full px-4 py-2 rounded-xl text-center text-indigo-300 
                           hover:text-white border border-indigo-500/20 transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="w-full px-4 py-2 rounded-xl text-center text-white 
                           bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </motion.div>
            )}
          </div>
        </motion.div>
      </nav>

      {/* Backdrop for mobile menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* AI Snippet Modal */}
      <AiSnippet
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSaveSnippet={handleSaveAiSnippet}
      />
    </>
  );
};

export default Navbar;