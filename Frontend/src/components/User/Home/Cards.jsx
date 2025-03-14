import React from 'react';
import { motion } from 'framer-motion';
import { FiFolder, FiEye, FiEdit, FiShare2, FiUsers } from 'react-icons/fi';
import { DiJavascript, DiPython, DiJava, DiHtml5, DiCss3, DiReact } from 'react-icons/di';
import { VscJson, VscCode } from 'react-icons/vsc';

// Add IconButton component
const IconButton = ({ icon, onClick, tooltip }) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="p-2 rounded-lg hover:bg-slate-800/60 text-slate-400 hover:text-slate-300 transition-all duration-300 relative z-10 group"
  >
    {icon}
    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs rounded-md bg-slate-800 text-slate-200 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg shadow-black/20 border border-slate-700/50 whitespace-nowrap">
      {tooltip}
    </span>
  </motion.button>
);

// Add Button component
const Button = ({ children, onClick, className = '' }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-slate-800/80 to-slate-900/80 hover:from-slate-800 hover:to-slate-900 text-slate-300 hover:text-slate-200 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200 relative z-10 shadow-lg shadow-black/10 ${className}`}
  >
    {children}
  </motion.button>
);

// Add QuickActionButton component
const QuickActionButton = ({ icon, title, description, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="w-full group relative overflow-hidden rounded-xl transition-all duration-300"
  >
    <div className="absolute inset-0 bg-gradient-to-r from-slate-800/80 to-slate-900/80 opacity-80 group-hover:opacity-100 transition-opacity" />
    <div className="relative p-5 border border-slate-700/50 group-hover:border-slate-600/50">
      <div className="flex items-start gap-4">
        <span className="text-2xl text-slate-300 group-hover:scale-110 group-hover:text-slate-200 transition-all duration-300">
          {icon}
        </span>
        <div className="text-left">
          <h4 className="font-medium text-slate-200 group-hover:text-white mb-1">
            {title}
          </h4>
          <p className="text-sm text-slate-400 group-hover:text-slate-300">
            {description}
          </p>
        </div>
      </div>
    </div>
  </motion.button>
);

// Improved language icon mapping with more options
const getLanguageIcon = (language) => {
  const normalizedLang = language?.toLowerCase() || '';
  const icons = {
    javascript: <DiJavascript className="text-slate-400" />,
    typescript: <DiJavascript className="text-slate-400" />,
    python: <DiPython className="text-slate-400" />,
    java: <DiJava className="text-slate-400" />,
    html: <DiHtml5 className="text-slate-400" />,
    css: <DiCss3 className="text-slate-400" />,
    react: <DiReact className="text-slate-400" />,
    json: <VscJson className="text-slate-400" />,
  };
  
  // Check if language contains keywords for better matching
  if (normalizedLang.includes('react')) return <DiReact className="text-slate-400" />;
  if (normalizedLang.includes('type')) return <DiJavascript className="text-slate-400" />;
  
  return icons[normalizedLang] || <VscCode className="text-slate-400" />;
};

// Calculate time since creation
const getTimeSince = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
};

const DirectoryCard = ({ directory, onView }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="group border border-slate-700/30 rounded-xl p-4 hover:border-slate-600/50 transition-all duration-300 bg-gradient-to-r from-slate-800/50 to-slate-900/50 hover:from-slate-800/70 hover:to-slate-900/70"
  >
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <FiFolder className="text-slate-400 group-hover:text-slate-300 transition-colors duration-200" />
          {directory.name}
        </h3>
        <p className="text-sm text-slate-400/80 mt-1">{directory.path}</p>
      </div>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onView}
        className="text-slate-400 hover:text-slate-300 transition-colors duration-200 flex items-center gap-1"
      >
        <FiEye /> View
      </motion.button>
    </div>
  </motion.div>
);

const GlassCard = ({ title, icon, children, action }) => (
  <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-slate-700/30 p-8 shadow-2xl shadow-black/10 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-slate-800/30 via-transparent to-slate-900/30"></div>
    <div className="flex justify-between items-center mb-6 relative z-10">
      <h2 className="text-xl font-bold flex items-center gap-3 text-slate-200">
        <span className="text-slate-400">{icon}</span>
        {title}
      </h2>
      {action}
    </div>
    <div className="relative z-10">{children}</div>
  </div>
);

// Completely redesigned SnippetCard
const SnippetCard = ({ snippet, onView, onEdit, onShare }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.01, y: -2 }}
    transition={{ type: "spring", stiffness: 400, damping: 30 }}
    className="group relative mb-4 overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-slate-700/30 shadow-lg hover:shadow-xl hover:border-slate-600/50 transition-all duration-300"
  >
    {/* Animated gradient accent on hover */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600" />
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600" />
    </div>
    
    <div className="p-3 sm:p-5">
      {/* Header section with language & timestamp */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700/50 text-xl">
            {getLanguageIcon(snippet.language)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-200 group-hover:text-slate-100 transition-colors text-sm sm:text-base truncate max-w-[160px] sm:max-w-[200px] md:max-w-[300px]">
              {snippet.title}
            </h3>
            <div className="flex items-center text-xs text-slate-400 gap-1 sm:gap-2">
              <span className="font-medium text-slate-400/80 uppercase tracking-wide truncate max-w-[80px] sm:max-w-[120px]">
                {snippet.language || 'Text'}
              </span>
              <span className="hidden xs:inline">•</span>
              <span className="text-xs whitespace-nowrap">{getTimeSince(snippet.createdAt)}</span>
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-slate-300 border border-transparent hover:border-slate-600/50 transition-all duration-200 relative group/icon"
            onClick={onView}
            aria-label="View snippet"
          >
            <FiEye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs rounded bg-slate-800 text-slate-200 opacity-0 group-hover/icon:opacity-100 transition-opacity whitespace-nowrap z-10">
              View
            </span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-slate-300 border border-transparent hover:border-slate-600/50 transition-all duration-200 relative group/icon"
            onClick={onEdit}
            aria-label="Edit snippet"
          >
            <FiEdit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs rounded bg-slate-800 text-slate-200 opacity-0 group-hover/icon:opacity-100 transition-opacity whitespace-nowrap z-10">
              Edit
            </span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-slate-300 border border-transparent hover:border-slate-600/50 transition-all duration-200 relative group/icon"
            onClick={onShare}
            aria-label="Share snippet"
          >
            <FiShare2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs rounded bg-slate-800 text-slate-200 opacity-0 group-hover/icon:opacity-100 transition-opacity whitespace-nowrap z-10">
              Share
            </span>
          </motion.button>
        </div>
      </div>
      
      {/* Code preview section */}
      <div className="relative my-2 sm:my-3 rounded-lg bg-slate-900/90 border border-slate-700/50 font-mono text-sm overflow-hidden group-hover:border-slate-600/50 transition-all">
        <div className="absolute top-0 left-0 right-0 h-5 sm:h-6 bg-slate-800/70 border-b border-slate-700/50 flex items-center px-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-500/80" />
          </div>
        </div>
        <pre className="text-slate-300 px-3 sm:px-4 pt-6 sm:pt-8 pb-3 sm:pb-4 max-h-[80px] sm:max-h-[120px] overflow-hidden relative text-xs sm:text-sm">
          <code className="line-clamp-3">{snippet.preview || snippet.description || '// No preview available'}</code>
          <div className="absolute bottom-0 left-0 right-0 h-8 sm:h-12 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none"></div>
        </pre>
      </div>
      
      {/* Footer section */}
      <div className="mt-2 sm:mt-3 flex flex-wrap justify-between items-center gap-y-2 sm:gap-y-0">
        <div className="flex flex-wrap gap-1.5 sm:gap-2 max-w-[65%] sm:max-w-[70%]">
          {snippet.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-md
                       bg-slate-800/50 text-slate-300 border border-slate-700/50
                       group-hover:bg-slate-800/70 group-hover:border-slate-600/50
                       transition-all duration-300 truncate max-w-[80px] sm:max-w-full"
            >
              {tag}
            </span>
          ))}
          {(snippet.tags?.length > 2) && (
            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-slate-400">
              +{snippet.tags.length - 2}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <FiEye className="w-3 h-3" /> {snippet.views || 0}
          </span>
          <span className="bg-slate-800/50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-slate-400 border border-slate-700/50 text-[10px] sm:text-xs">
            {snippet.size || '0.0 KB'}
          </span>
        </div>
      </div>
    </div>
  </motion.div>
);

const GroupCard = ({ group, onView, isJoined = false }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="group border border-slate-700/30 rounded-xl p-4 mb-4 hover:border-slate-600/50 transition-all duration-300 bg-gradient-to-r from-slate-800/50 to-slate-900/50 hover:from-slate-800/70 hover:to-slate-900/70"
  >
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <FiUsers className="text-slate-400 group-hover:text-slate-300 transition-colors duration-200" />
          {group.name}
        </h3>
        <p className="text-sm text-slate-400/80 mt-1">{group.description}</p>
        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400/80">
          <FiUsers size={12} />
          <span>{group.members?.length || 0} members</span>
          {isJoined && (
            <span className="px-2 py-0.5 rounded-full bg-slate-800/50 text-slate-300 border border-slate-700/50">
              Joined
            </span>
          )}
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onView}
        className="text-slate-400 hover:text-slate-300 transition-colors duration-200 flex items-center gap-1"
      >
        <FiEye /> View
      </motion.button>
    </div>
  </motion.div>
);

const StatCard = ({ title, value, icon, trend }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50"
  >
    <div className="absolute inset-0 bg-gradient-to-r from-slate-700/20 to-slate-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative p-6 backdrop-blur-xl border border-slate-700/30">
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl text-slate-400 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </span>
        {trend && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-sm font-medium px-3 py-1 rounded-full
              ${trend > 0 
                ? 'bg-slate-800/50 text-slate-300 border border-slate-700/50' 
                : 'bg-slate-800/50 text-slate-300 border border-slate-700/50'}`}
          >
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </motion.span>
        )}
      </div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold text-slate-200 mb-2"
      >
        {value}
      </motion.p>
      <p className="text-sm text-slate-400">{title}</p>
    </div>
  </motion.div>
);

export { 
  DirectoryCard, 
  GlassCard, 
  SnippetCard, 
  GroupCard, 
  StatCard,
  IconButton,
  Button,
  QuickActionButton 
};