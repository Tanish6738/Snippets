import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import {
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown
} from 'react-icons/fi';

// Button Components
const TabButton = ({ children, active, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-xl transition-all duration-300
                ${active 
                  ? 'bg-slate-800/60 text-slate-300' 
                  : 'text-slate-400/60 hover:text-slate-300 hover:bg-slate-800/40'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    {children}
  </button>
);

const ViewButton = ({ children, icon, active, onClick }) => (
  <button
    onClick={() => {
      onClick();
    }}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300
                ${active 
                  ? 'bg-slate-800/60 text-slate-300' 
                  : 'text-slate-400/60 hover:text-slate-300 hover:bg-slate-800/40'}`}
  >
    {icon}
    {children}
  </button>
);

const IconButton = ({ icon, onClick, tooltip, className }) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick || (() => {})}
    className={`p-2 rounded-lg text-slate-400 hover:text-slate-300 
               hover:bg-slate-800/40 transition-all duration-200 ${className || ''}`}
    title={tooltip}
  >
    {icon}
  </motion.button>
);

// Search Components
const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="relative">
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder || "Search..."}
      className="w-full bg-slate-800/50 border border-slate-700/50 
               rounded-lg px-4 py-2 pl-10 text-slate-300 
               placeholder:text-slate-500 focus:outline-none 
               focus:border-slate-600/50"
    />
    <FiSearch className="absolute left-3 top-3 text-slate-500" />
  </div>
);

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const renderPageButtons = () => {
    const buttons = [];
    
    // Always show first page
    buttons.push(
      <button
        key="first"
        onClick={() => onPageChange(1)}
        className={`px-3 py-1 rounded-md ${currentPage === 1 
          ? 'bg-slate-700 text-slate-200' 
          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'}`}
      >
        1
      </button>
    );
    
    // Calculate range of pages to show
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      buttons.push(<span key="ellipsis1" className="px-2 text-slate-400">...</span>);
    }
    
    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`px-3 py-1 rounded-md ${currentPage === i 
            ? 'bg-slate-700 text-slate-200' 
            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'}`}
        >
          {i}
        </button>
      );
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      buttons.push(<span key="ellipsis2" className="px-2 text-slate-400">...</span>);
    }
    
    // Always show last page if there is more than one page
    if (totalPages > 1) {
      buttons.push(
        <button
          key="last"
          onClick={() => onPageChange(totalPages)}
          className={`px-3 py-1 rounded-md ${currentPage === totalPages 
            ? 'bg-slate-700 text-slate-200' 
            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'}`}
        >
          {totalPages}
        </button>
      );
    }
    
    return buttons;
  };
  
  return (
    <div className="flex justify-center mt-8 space-x-2">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`flex items-center justify-center px-3 py-1 rounded-md 
                  ${currentPage === 1 
                    ? 'bg-slate-800/30 text-slate-500 cursor-not-allowed' 
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'}`}
      >
        <FiChevronLeft size={16} />
      </button>
      
      {renderPageButtons()}
      
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={`flex items-center justify-center px-3 py-1 rounded-md 
                  ${currentPage === totalPages 
                    ? 'bg-slate-800/30 text-slate-500 cursor-not-allowed' 
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'}`}
      >
        <FiChevronRight size={16} />
      </button>
    </div>
  );
};

// Filter/Sort Controls
const SortControls = ({ sortBy, onSortChange, language, onLanguageChange, languages }) => (
  <div className="flex items-center gap-2">
    <div className="relative">
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="appearance-none bg-slate-800/50 border border-slate-700/50 
                 rounded-lg px-4 py-2 pr-8 text-slate-300 focus:outline-none 
                 focus:border-slate-600/50"
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="popular">Most Popular</option>
        <option value="views">Most Viewed</option>
      </select>
      <FiChevronDown className="absolute right-3 top-3 text-slate-500 pointer-events-none" />
    </div>
    
    <div className="relative">
      <select
        value={language}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="appearance-none bg-slate-800/50 border border-slate-700/50 
                 rounded-lg px-4 py-2 pr-8 text-slate-300 focus:outline-none 
                 focus:border-slate-600/50"
      >
        <option value="">All Languages</option>
        {languages.map((lang) => (
          <option key={lang} value={lang}>{lang}</option>
        ))}
      </select>
      <FiChevronDown className="absolute right-3 top-3 text-slate-500 pointer-events-none" />
    </div>
    
    <IconButton 
      icon={<FiFilter />} 
      tooltip="More Filters"
      className="bg-slate-800/50 border border-slate-700/50"
    />
  </div>
);

// Stats Component
const StatBox = ({ label, value, icon }) => (
  <div className="bg-slate-800/30 rounded-lg p-4 flex items-center gap-3 border border-slate-700/30">
    <div className="p-2 bg-slate-700/30 rounded-lg text-slate-300">
      {icon}
    </div>
    <div>
      <div className="text-2xl font-bold text-slate-300">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  </div>
);

// PropTypes
TabButton.propTypes = {
  children: PropTypes.node.isRequired,
  active: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

ViewButton.propTypes = {
  children: PropTypes.node.isRequired,
  icon: PropTypes.node.isRequired,
  active: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
};

IconButton.propTypes = {
  icon: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  tooltip: PropTypes.string,
  className: PropTypes.string
};

SearchBar.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired
};

SortControls.propTypes = {
  sortBy: PropTypes.string.isRequired,
  onSortChange: PropTypes.func.isRequired,
  language: PropTypes.string.isRequired,
  onLanguageChange: PropTypes.func.isRequired,
  languages: PropTypes.array.isRequired
};

StatBox.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.node.isRequired
};

export {
  TabButton,
  ViewButton,
  IconButton,
  SearchBar,
  Pagination,
  SortControls,
  StatBox
};
