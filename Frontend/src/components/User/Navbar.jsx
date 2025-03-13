import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../Context/UserContext';
import AiSnippet from '../Modals/SnippetModals/AiSnippet';
import {motion, AnimatePresence} from "framer-motion";

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
        { to : "/public", label: "All content" },
        { to: '/run-code', label: 'Code Runner' },
        { to: '/scrape', label: 'Web Scrapper' },
        // { to: '/snippets', label: 'Code Snippets' },
        // { to: '/directories', label: 'Directories' },
        // { to: '/groups', label: 'Groups' },
      ]
    },
    media: {
      label: 'Media',
      items: [
        { to: '/blog', label: 'Blog' },
        { to: '/blog/create', label: 'Create Blog' },
        { to: '/create-pdf', label: 'Create Pdf' },
        // { to: '/public', label: 'Public Data' }
      ]
    }
  };

  const buttonHoverVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.02 }
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -5 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const colors = {
    background: "bg-slate-900/75",  // More transparent background
    border: "border-white/10",      // Subtle border
    text: {
      primary: "text-white",
      secondary: "text-slate-400",
      hover: "hover:text-indigo-400"
    },
    accent: {
      primary: "from-indigo-500 to-purple-500",
      hover: "from-indigo-400 to-purple-400",
      light: "from-indigo-500/10 to-purple-500/10"
    },
    button: {
      hover: "hover:bg-white/5"
    }
  }

  const NavDropdown = ({ category, items, isActive, colors }) => (
    <div 
      className="relative group"
      ref={el => dropdownRefs.current[category] = el}
      onClick={(e) => e.stopPropagation()}
    >
      <motion.button
        variants={buttonHoverVariants}
        initial="initial"
        whileHover="hover"
        className={`px-4 py-2 rounded-md ${colors.text.secondary} ${colors.text.hover} transition-all duration-200 
                  flex items-center gap-2 text-sm font-medium ${
        isActive ? `${colors.text.primary} bg-gradient-to-r ${colors.accent.light}` : ''
      }`}
        onClick={() => setActiveDropdown(isActive ? null : category)}
      >
        {category}
        <motion.svg 
          animate={{ rotate: isActive ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </motion.button>
      
      <AnimatePresence>
        {isActive && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={`absolute top-full left-0 mt-2 py-2 ${colors.background} rounded-md ${colors.border} 
                      border shadow-lg min-w-[200px] backdrop-blur-xl z-50`}
          >
            {items.map((item) => (
              <motion.div
                key={item.to}
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <Link
                  to={item.to}
                  className={`block px-4 py-2 text-sm ${colors.text.secondary} ${colors.text.hover} transition-all duration-200 ${
                    isActivePath(item.to) ? `bg-gradient-to-r ${colors.accent.light} ${colors.text.primary}` : ''
                  }`}
                  onClick={() => {
                    setActiveDropdown(null);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
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
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed top-0 left-0 right-0 z-50 ${colors.background} backdrop-blur-2xl 
                  ${colors.border} border-b shadow-2xl shadow-black/5 font-['Plus_Jakarta_Sans',sans-serif]`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20"> {/* Increased height */}
            {/* Logo */}
            <div className="flex items-center gap-6"> {/* Increased gap */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`md:hidden inline-flex items-center justify-center p-2.5 rounded-full 
                         ${colors.text.secondary} ${colors.text.hover} ${colors.button.hover} 
                         transition-all duration-300 hover:rotate-90`} // Added rotation
              >
                <span className="sr-only">Open menu</span>
                <svg className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <Link to={isAuthenticated ? "/home" : "/"} 
                    className="flex items-center justify-center space-x-3 group relative">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative z-10"
                >
                  <span className={`text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r 
                                ${colors.accent.primary} bg-clip-text text-transparent
                                transition-all duration-300`}>
                    CodeArc
                  </span>
                  {/* Added glow effect */}
                  <div className="absolute -inset-x-6 -inset-y-4 z-[-1] bg-gradient-to-r from-indigo-600/20 
                               to-purple-600/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 
                               transition-all duration-300" />
                </motion.div>
                <div className="hidden sm:block">
                  <p className={`text-xs ${colors.text.secondary} font-medium tracking-widest uppercase`}>
                    Code Smarter, Build Faster
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              {isAuthenticated ? (
                <>
                  {/* Home button */}
                  <Link
                    to="/home"
                    className={`px-5 py-2.5 rounded-full ${colors.text.secondary} ${colors.text.hover}
                              ${colors.button.hover} transition-all duration-300 flex items-center gap-2 
                              text-sm font-medium ${isActivePath('/home') ? 
                              `${colors.text.primary} bg-gradient-to-r ${colors.accent.light}` : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a 1 1 0 011 1v4a 1 1 0 001 1m-6 0h6" />
                    </svg>
                    Home
                  </Link>
                  
                  {/* Nav categories */}
                  {Object.entries(navCategories).map(([key, { label, items }]) => (
                    <NavDropdown
                      key={key}
                      category={label}
                      items={items}
                      isActive={activeDropdown === label}
                      colors={colors}
                    />
                  ))}
                  
                  {/* AI Snippet Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAiModalOpen(true)}
                    className={`px-6 py-2.5 rounded-full ${colors.text.primary} bg-gradient-to-r 
                              ${colors.accent.primary} hover:${colors.accent.hover} transition-all 
                              duration-300 text-sm font-semibold shadow-lg shadow-indigo-500/25 
                              hover:shadow-xl hover:shadow-indigo-500/40 relative group`}
                  >
                    <span className="relative z-10">AI Snippet</span>
                    {/* Added subtle gradient overlay on hover */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 
                                 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  </motion.button>
                  
                  {/* User Profile Dropdown */}
                  <div className="relative ml-3 group">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      className={`flex items-center space-x-2 px-5 py-2.5 rounded-full ${colors.text.secondary} 
                                ${colors.text.hover} bg-white/5 hover:bg-white/10 transition-all duration-300
                                border border-white/10 hover:border-white/20`}
                    >
                      <span className="text-sm font-medium">{user?.username}</span>
                      <motion.svg 
                        animate={{ rotate: activeDropdown === 'user' ? 180 : 0 }}
                        className="w-4 h-4" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </motion.button>
                    <div className={`hidden group-hover:block absolute right-0 mt-1 w-48 rounded-md 
                                   ${colors.background} backdrop-blur-xl ${colors.border} border 
                                   shadow-lg py-1`}>
                      <Link to="/profile" className={`block px-4 py-2 text-sm ${colors.text.secondary} 
                                                    ${colors.text.hover} transition-colors duration-200`}>
                        Profile
                      </Link>
                      <Link to="/my-snippets" className={`block px-4 py-2 text-sm ${colors.text.secondary} 
                                                        ${colors.text.hover} transition-colors duration-200`}>
                        My Snippets
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className={`block w-full text-left px-4 py-2 text-sm ${colors.text.secondary} 
                                  ${colors.text.hover} transition-colors duration-200`}
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-4 ml-4">
                  <Link to="/login" className={`${colors.text.secondary} ${colors.text.hover} 
                                              transition-colors duration-300 text-sm font-medium 
                                              hover:translate-x-0.5`}>
                    Sign in
                  </Link>
                  <Link to="/register" 
                        className={`px-6 py-2.5 rounded-full text-sm font-semibold ${colors.text.primary} 
                                  bg-gradient-to-r ${colors.accent.primary} hover:${colors.accent.hover} 
                                  transition-all duration-300 shadow-lg shadow-indigo-500/25 
                                  hover:shadow-xl hover:shadow-indigo-500/40 relative group`}>
                    <span className="relative z-10">Register</span>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 
                                 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  </Link>
                </div>
              )}
            </div>
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
          className={`md:hidden overflow-hidden ${colors.background} backdrop-blur-xl ${colors.border} border-t`}
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
                  to="/home"
                  className="px-4 py-2 rounded-xl text-indigo-300 hover:text-white 
                           hover:bg-indigo-500/10 transition-all text-sm font-medium flex items-center gap-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a 1 1 0 011 1v4a 1 1 0 001 1m-6 0h6" />
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
      </motion.nav>

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