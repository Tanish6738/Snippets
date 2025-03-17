import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiBell, FiGrid, FiCode, FiFolder, FiUsers, FiMenu, FiX, FiChevronDown, FiUser, FiSettings, FiLogOut } from "react-icons/fi";
import { Link } from "react-router-dom";

export const TopBar = ({ user }) => (
  <motion.header
    initial={{ y: -100 }}
    animate={{ y: 0 }}
    className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/50 shadow-lg shadow-slate-900/20"
  >

  </motion.header>
);

export const DashboardTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    {
      key: "overview",
      label: "Overview",
      icon: <FiGrid className="w-5 h-5" />,
    },
    {
      key: "snippets",
      label: "Snippets",
      icon: <FiCode className="w-5 h-5" />,
    },
    {
      key: "directories",
      label: "Directories",
      icon: <FiFolder className="w-5 h-5" />,
    },
    { 
      key: "groups", 
      label: "Groups", 
      icon: <FiUsers className="w-5 h-5" /> 
    },
  ];

  return (
    <>
      {/* Desktop Tabs */}
      <div className="hidden md:block sticky top-16 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 shadow-lg shadow-slate-900/20">
        <Container>
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <motion.button
                key={tab.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative group ${
                  activeTab === tab.key
                    ? "text-slate-200 bg-slate-800/50"
                    : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/30"
                }`}
              >
                <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-slate-500/0 to-slate-600/0 group-hover:from-slate-500/20 group-hover:to-slate-600/20 transition-all duration-300"></div>
                <div className="relative z-10 flex items-center gap-2">
                  <span className={`transition-colors duration-200 ${
                    activeTab === tab.key ? "text-slate-300" : "text-slate-500 group-hover:text-slate-400"
                  }`}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </div>
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-500 to-slate-600 rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </Container>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/50 shadow-lg shadow-slate-900/20">
        <div className="grid grid-cols-4 gap-1 p-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 relative group ${
                activeTab === tab.key
                  ? "text-slate-200"
                  : "text-slate-400"
              }`}
            >
              <div className={`absolute inset-0 rounded-xl transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-slate-800/50"
                  : "group-hover:bg-slate-800/30"
              }`} />
              
              <div className="relative z-10 flex flex-col items-center gap-1">
                <span className={`transition-colors duration-200 ${
                  activeTab === tab.key ? "text-slate-200" : "text-slate-400 group-hover:text-slate-300"
                }`}>
                  {tab.icon}
                </span>
                <span className={`text-xs font-medium transition-colors duration-200 ${
                  activeTab === tab.key ? "text-slate-200" : "text-slate-400 group-hover:text-slate-300"
                }`}>
                  {tab.label}
                </span>
              </div>

              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeTabMobile"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-500 to-slate-600 rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Add padding to main content for mobile bottom nav */}
      <div className="md:hidden h-20" />
    </>
  );
};

// Mobile Navigation Drawer - Enhanced to match Navbar style
export const MobileDrawer = ({ isOpen, onClose, children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: isOpen ? 1 : 0 }}
    className={`fixed inset-0 z-50 lg:hidden ${
      isOpen ? "pointer-events-auto" : "pointer-events-none"
    }`}
  >
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isOpen ? 1 : 0 }}
      className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    />
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: isOpen ? 0 : "100%" }}
      transition={{ type: "spring", damping: 20 }}
      className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-slate-900 border-l border-slate-800/50 shadow-xl"
    >
      <div className="p-4 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-200">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800/60 text-slate-400 hover:text-slate-300 transition-colors duration-200"
          >
            <FiX className="text-xl" />
          </button>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  </motion.div>
);

export const Container = ({ children, className = "" }) => (
  <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
    {children}
  </div>
);

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen w-full bg-slate-950">
    <div className="relative">
      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-slate-500 to-slate-600 opacity-70 blur-sm animate-pulse"></div>
      <div className="relative h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center">
        <div className="h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  </div>
);

// Add responsive section headings
export const SectionHeading = ({ title, description }) => (
  <div className="mb-8">
    <h2 className="text-2xl font-bold text-slate-200 mb-2">{title}</h2>
    {description && (
      <p className="text-slate-400/80">{description}</p>
    )}
  </div>
);

// Add CSS for hiding scrollbar on some elements
export const ScrollbarStyles = () => (
  <style jsx global>{`
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    ::-webkit-scrollbar-track {
      background: rgb(15 23 42 / 0.5);
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb {
      background: rgb(51 65 85 / 0.5);
      border-radius: 4px;
      transition: background 0.2s;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: rgb(71 85 105 / 0.5);
    }
  `}</style>
);
