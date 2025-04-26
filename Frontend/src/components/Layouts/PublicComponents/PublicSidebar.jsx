import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { 
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';

// Sidebar Component
const PublicSidebar = ({ 
  isCollapsed, 
  onToggleCollapse, 
  categories, 
  activeCategory,
  onCategoryChange 
}) => {
  return (
    <motion.div 
      className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 
                shadow-lg shadow-slate-900/10 h-full relative"
    >
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-4 p-1.5 rounded-full bg-slate-700 text-white
                  hover:bg-slate-600 transition-colors z-10"
      >
        <FiChevronLeft className={`transform transition-transform duration-300 
                                ${isCollapsed ? 'rotate-180' : ''}`} />
      </button>

      <div className={`p-4 ${isCollapsed ? 'hidden' : 'block'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-300">Categories</h2>
        </div>

        <nav className="space-y-2">
          {categories.map((category, index) => (
            <CategoryLink 
              key={index}
              {...category}
              isActive={activeCategory === category.label.toLowerCase()}
              onClick={() => onCategoryChange(category.label.toLowerCase())}
            />
          ))}
        </nav>
      </div>

      {/* Collapsed View */}
      <div className={`p-4 ${isCollapsed ? 'block' : 'hidden'}`}>
        {categories.map((category, index) => (
          <div key={index} className="mb-4 flex justify-center">
            <motion.span
              whileHover={{ scale: 1.1 }}
              className="text-slate-300 hover:text-slate-200 cursor-pointer"
              onClick={() => onCategoryChange(category.label.toLowerCase())}
            >
              {category.icon}
            </motion.span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Utility Components
const CategoryLink = ({ icon, label, count, isActive, onClick }) => (
  <motion.button
    whileHover={{ x: 4 }}
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-2 rounded-xl 
                transition-all duration-300 group
                ${isActive 
                  ? 'bg-slate-800/60 text-slate-300' 
                  : 'text-slate-400/60 hover:text-slate-300 hover:bg-slate-800/40'}`}
  >
    <div className="flex items-center gap-3">
      <span className="group-hover:scale-110 transition-transform duration-300">
        {icon}
      </span>
      <span>{label}</span>
    </div>
    <span className="px-2 py-1 text-xs rounded-full bg-slate-800/60">
      {count}
    </span>
  </motion.button>
);

PublicSidebar.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
  onToggleCollapse: PropTypes.func.isRequired,
  categories: PropTypes.array.isRequired,
  activeCategory: PropTypes.string.isRequired,
  onCategoryChange: PropTypes.func.isRequired
};

CategoryLink.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
};

export { PublicSidebar, CategoryLink };
