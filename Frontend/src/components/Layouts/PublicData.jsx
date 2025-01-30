import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import {
  FiCode, FiFolder, FiUsers, FiSearch, FiStar, FiShare2, 
  FiEye, FiCopy, FiHeart, FiChevronLeft, FiFilter, FiTag,
  FiTrendingUp, FiClock
} from 'react-icons/fi';
import { useUser } from '../../Context/UserContext';
import { toast } from 'react-toastify';
import { dummyData } from '../../data/dummyData';

const PublicData = () => {
  // State management
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [categories, setCategories] = useState([
    { icon: <FiTrendingUp />, label: "Popular", count: 25 },
    { icon: <FiClock />, label: "Recent", count: 15 },
    { icon: <FiStar />, label: "Featured", count: 8 },
    { icon: <FiCode />, label: "Snippets", count: 42 },
    { icon: <FiFolder />, label: "Collections", count: 12 },
    { icon: <FiUsers />, label: "Groups", count: 6 },
  ]);
  const [activeTab, setActiveTab] = useState('public'); // 'public' or 'personal'
  const [activeView, setActiveView] = useState('snippets'); // 'snippets', 'directories', 'groups'

  const navigate = useNavigate();
  const { isAuthenticated, user } = useUser();

  // Handle search with debounce
  const handleSearch = useCallback(
    debounce((query) => {
      setGlobalSearchQuery(query);
      // Implement search logic here
    }, 300),
    []
  );

  const filteredItems = useMemo(() => {
    const items = activeTab === 'public' ? dummyData[activeView] : dummyData[activeView].filter(item => item.author === user?.username);
    return items;
  }, [activeTab, activeView, user]);

  return (
    <div className="min-h-screen bg-[#030712] text-white pt-16">
      <div className="relative">
        {/* Mobile Sidebar */}
        <motion.div
          initial={false}
          animate={{ x: sidebarOpen ? 0 : '-100%' }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed inset-y-0 left-0 w-[280px] z-40 md:hidden"
        >
          <PublicSidebar 
            onClose={() => setSidebarOpen(false)}
            isCollapsed={isLeftSidebarCollapsed}
            onToggleCollapse={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </motion.div>

        {/* Backdrop */}
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="container mx-auto px-4 py-4 md:py-8">
          <div className="flex gap-8">
            {/* Desktop Left Sidebar */}
            <motion.div 
              className="hidden md:block"
              animate={{ width: isLeftSidebarCollapsed ? '60px' : '280px' }}
              transition={{ duration: 0.3 }}
            >
              <div className="sticky top-20">
                <PublicSidebar 
                  isCollapsed={isLeftSidebarCollapsed}
                  onToggleCollapse={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
                  categories={categories}
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                />
              </div>
            </motion.div>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              {/* Tabs */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <TabButton 
                      active={activeTab === 'public'} 
                      onClick={() => setActiveTab('public')}
                    >
                      Public
                    </TabButton>
                    <TabButton 
                      active={activeTab === 'personal'} 
                      onClick={() => setActiveTab('personal')}
                      disabled={!isAuthenticated}
                    >
                      Personal
                    </TabButton>
                  </div>
                  <div className="flex gap-2">
                    <ViewButton 
                      active={activeView === 'snippets'} 
                      onClick={() => setActiveView('snippets')}
                      icon={<FiCode />}
                    >
                      Snippets
                    </ViewButton>
                    <ViewButton 
                      active={activeView === 'directories'} 
                      onClick={() => setActiveView('directories')}
                      icon={<FiFolder />}
                    >
                      Directories
                    </ViewButton>
                    <ViewButton 
                      active={activeView === 'groups'} 
                      onClick={() => setActiveView('groups')}
                      icon={<FiUsers />}
                    >
                      Groups
                    </ViewButton>
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {loading ? (
                  Array(6).fill(0).map((_, i) => <ItemCardSkeleton key={i} />)
                ) : (
                  filteredItems.map(item => (
                    <ItemCard key={item.id} item={item} />
                  ))
                )}
              </motion.div>
            </main>

            {/* Right Sidebar */}
            <motion.div 
              className="hidden lg:block"
              animate={{ width: isRightSidebarCollapsed ? '60px' : '300px' }}
              transition={{ duration: 0.3 }}
            >
              <div className="sticky top-20">
                <PublicRightSidebar 
                  isCollapsed={isRightSidebarCollapsed}
                  onToggleCollapse={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
                  onSearch={handleSearch}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Left Sidebar Component
const PublicSidebar = ({ 
  onClose, 
  isCollapsed, 
  onToggleCollapse, 
  categories, 
  activeCategory,
  onCategoryChange 
}) => {
  return (
    <motion.div className="bg-[#0B1120]/50 backdrop-blur-xl rounded-2xl border border-indigo-500/20 
                          shadow-lg shadow-indigo-500/10 h-full relative">
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-4 p-1.5 rounded-full bg-indigo-500 text-white
                  hover:bg-indigo-600 transition-colors z-10"
      >
        <FiChevronLeft className={`transform transition-transform duration-300 
                                ${isCollapsed ? 'rotate-180' : ''}`} />
      </button>

      <div className={`p-4 ${isCollapsed ? 'hidden' : 'block'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-indigo-300">Categories</h2>
          {onClose && (
            <button onClick={onClose} className="md:hidden p-2 text-indigo-400 hover:text-indigo-300">
              <FiChevronLeft size={20} />
            </button>
          )}
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
              className="text-indigo-300 hover:text-indigo-200 cursor-pointer"
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

// Right Sidebar Component with similar structure to BlogLayout
const PublicRightSidebar = ({ isCollapsed, onToggleCollapse, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <motion.div className="bg-[#0B1120]/50 backdrop-blur-xl rounded-2xl border border-indigo-500/20 
                          shadow-lg shadow-indigo-500/10 relative">
      <button
        onClick={onToggleCollapse}
        className="absolute -left-3 top-4 p-1.5 rounded-full bg-indigo-500 text-white
                  hover:bg-indigo-600 transition-colors z-10"
      >
        <FiChevronLeft className={`transform transition-transform duration-300 
                                ${!isCollapsed ? 'rotate-180' : ''}`} />
      </button>

      <div className={`p-4 ${isCollapsed ? 'hidden' : 'block'}`}>
        <div className="relative mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search..."
            className="w-full px-4 py-2 pl-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 
                     text-sm placeholder:text-indigo-400/60"
          />
          <FiSearch className="absolute left-3 top-2.5 text-indigo-400/50" size={16} />
        </div>

        {/* Add filters and stats similar to BlogLayout */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-indigo-300">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Total Items" value="124" />
            <StatCard label="Views" value="1.2k" />
            <StatCard label="Shares" value="356" />
            <StatCard label="Active" value="45" />
          </div>
        </div>
      </div>

      {/* Collapsed View */}
      <div className={`p-4 ${isCollapsed ? 'block' : 'hidden'}`}>
        <div className="flex flex-col items-center space-y-4">
          <IconButton icon={<FiSearch />} />
          <IconButton icon={<FiFilter />} />
        </div>
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
                  ? 'bg-indigo-500/20 text-indigo-300' 
                  : 'text-indigo-400/60 hover:text-indigo-300 hover:bg-indigo-500/10'}`}
  >
    <div className="flex items-center gap-3">
      <span className="group-hover:scale-110 transition-transform duration-300">
        {icon}
      </span>
      <span>{label}</span>
    </div>
    <span className="px-2 py-1 text-xs rounded-full bg-indigo-500/10">
      {count}
    </span>
  </motion.button>
);

const StatCard = ({ label, value }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20"
  >
    <div className="text-2xl font-bold text-indigo-300">{value}</div>
    <div className="text-xs text-indigo-400">{label}</div>
  </motion.div>
);

const IconButton = ({ icon, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="p-2 rounded-lg text-indigo-400/60 hover:text-indigo-400 
               hover:bg-indigo-500/10 transition-all duration-200"
  >
    {icon}
  </motion.button>
);

// Add skeleton loading components
const ItemCardSkeleton = () => (
  <div className="animate-pulse bg-white/[0.01] rounded-xl border border-indigo-500/20 p-6">
    <div className="h-6 bg-indigo-500/20 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-indigo-500/20 rounded w-full mb-3"></div>
    <div className="h-4 bg-indigo-500/20 rounded w-2/3 mb-4"></div>
    <div className="flex justify-between items-center">
      <div className="h-4 bg-indigo-500/20 rounded w-20"></div>
      <div className="h-4 bg-indigo-500/20 rounded w-20"></div>
    </div>
  </div>
);

const ItemCard = ({ item }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="bg-white/[0.01] rounded-xl border border-indigo-500/20 p-6 hover:border-indigo-500/40
               transition-all duration-300"
  >
    <div className="flex items-start justify-between mb-4">
      <h3 className="text-lg font-medium text-indigo-300">{item.title}</h3>
      <div className="flex gap-2">
        {item.type === 'snippet' && <FiCode className="text-indigo-400" />}
        {item.type === 'directory' && <FiFolder className="text-indigo-400" />}
        {item.type === 'group' && <FiUsers className="text-indigo-400" />}
      </div>
    </div>
    
    <p className="text-sm text-indigo-400/60 mb-4">{item.description}</p>
    
    <div className="flex items-center justify-between text-sm text-indigo-400/60">
      <div className="flex items-center gap-4">
        {item.type === 'snippet' && (
          <>
            <span className="flex items-center gap-1">
              <FiStar className="text-yellow-500" /> {item.stars}
            </span>
            <span className="flex items-center gap-1">
              <FiEye /> {item.views}
            </span>
          </>
        )}
        {item.type === 'directory' && (
          <>
            <span className="flex items-center gap-1">
              <FiFolder /> {item.itemCount} items
            </span>
            <span className="flex items-center gap-1">
              <FiUsers /> {item.members}
            </span>
          </>
        )}
        {item.type === 'group' && (
          <>
            <span className="flex items-center gap-1">
              <FiUsers /> {item.memberCount}
            </span>
            <span className="flex items-center gap-1">
              <FiCode /> {item.snippetCount}
            </span>
          </>
        )}
      </div>
      <span className="text-xs bg-indigo-500/10 px-2 py-1 rounded-full">
        {item.author}
      </span>
    </div>
  </motion.div>
);

const TabButton = ({ children, active, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-xl transition-all duration-300
                ${active 
                  ? 'bg-indigo-500/20 text-indigo-300' 
                  : 'text-indigo-400/60 hover:text-indigo-300 hover:bg-indigo-500/10'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    {children}
  </button>
);

const ViewButton = ({ children, active, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300
                ${active 
                  ? 'bg-indigo-500/20 text-indigo-300' 
                  : 'text-indigo-400/60 hover:text-indigo-300 hover:bg-indigo-500/10'}`}
  >
    {icon}
    {children}
  </button>
);

export default PublicData;
