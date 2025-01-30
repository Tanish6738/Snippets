import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { debounce } from 'lodash';
import Highlighter from 'react-highlight-words';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../Context/UserContext'; // Add this import
import axios from '../../Config/Axios';
import {
  FiCode, FiFolder, FiUsers, FiSearch, FiStar, FiShare2, 
  FiEye, FiCopy, FiHeart, FiChevronLeft, FiFilter, FiTag,
  FiTrendingUp, FiClock
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const PublicData = () => {
  // State management
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [categories, setCategories] = useState([
    { icon: <FiTrendingUp />, label: "Popular", count: 0 },
    { icon: <FiClock />, label: "Recent", count: 0 },
    { icon: <FiStar />, label: "Featured", count: 0 },
    { icon: <FiCode />, label: "Snippets", count: 0 },
    { icon: <FiFolder />, label: "Collections", count: 0 },
    { icon: <FiUsers />, label: "Groups", count: 0 },
  ]);
  const [activeTab, setActiveTab] = useState('public'); // 'public' or 'personal'
  const [activeView, setActiveView] = useState('snippets'); // 'snippets', 'directories', 'groups'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [language, setLanguage] = useState('');
  const [stats, setStats] = useState({
    snippetCount: 0,
    userCount: 0,
    groupCount: 0,
    activityCount: 0
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState(''); // New state for input value
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const { isAuthenticated, user } = useUser();

  const fetchPublicContent = useCallback(async () => {
    try {
      setIsTransitioning(true); // Start transition
      setLoading(true);
      setError(null);
      setItems([]); // Clear existing items before loading new ones

      const params = {
        page: currentPage,
        limit: 10,
        language,
        sort: sortBy
      };

      let data;
      switch (activeView) {
        case 'snippets':
          const snippetRes = await axios.get('/api/public/snippets', { params });
          data = snippetRes.data.snippets.map(snippet => ({
            ...snippet,
            id: snippet._id, // Ensure unique id
            type: 'snippet',
            title: snippet.title,
            description: snippet.description,
            stars: snippet.stats.favorites,
            views: snippet.stats.views,
            author: snippet.createdBy.username
          }));
          setTotalPages(snippetRes.data.totalPages);
          break;

        case 'directories':
          const dirRes = await axios.get('/api/public/directories', { params });
          data = dirRes.data.directories.map(dir => ({
            ...dir,
            id: dir._id, // Ensure unique id
            type: 'directory',
            title: dir.name,
            description: dir.description || 'No description',
            itemCount: dir.metadata.snippetCount + dir.metadata.subDirectoryCount,
            members: dir.sharedWith?.length || 0,
            author: dir.createdBy.username
          }));
          setTotalPages(dirRes.data.totalPages);
          break;

        case 'groups':
          const groupRes = await axios.get('/api/public/groups', { params });
          data = groupRes.data.map(group => ({
            ...group,
            id: group._id, // Ensure unique id
            type: 'group',
            title: group.name,
            memberCount: group.memberCount,
            snippetCount: group.snippetCount,
            author: group.createdBy?.username || 'Unknown'
          }));
          setTotalPages(Math.ceil(groupRes.data.length / 10));
          break;
      }

      setItems(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch content');
      toast.error('Failed to fetch content');
    } finally {
      // Add a small delay before removing loading state for smooth transition
      setTimeout(() => {
        setLoading(false);
        setIsTransitioning(false);
      }, 300);
    }
  }, [activeView, currentPage, sortBy, language]); // Add dependencies here

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/public/stats');
      setStats({
        snippetCount: data.snippetCount || 0,
        userCount: data.userCount || 0,
        groupCount: data.groupCount || 0,
        activityCount: data.activityCount || 0
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  // Handle search with debounce
  const handleSearch = useCallback(
    debounce(async (query) => {
      setSearchQuery(query); // This will trigger the search functionality
      
      if (!query.trim()) {
        fetchPublicContent();
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data } = await axios.get('/api/public/search', {
          params: {
            query: query.trim(),
            type: activeView,
            page: currentPage,
            limit: 10
          }
        });

        const processedData = data.map(item => ({
          ...item,
          relevanceScore: calculateRelevanceScore(item, query),
          type: activeView === 'snippets' ? 'snippet' : 
                activeView === 'directories' ? 'directory' : 'group'
        }));

        // Sort by relevance score
        const sortedData = processedData
          .filter(item => item.relevanceScore > 0)
          .sort((a, b) => b.relevanceScore - a.relevanceScore);

        setItems(sortedData);
      } catch (err) {
        setError(err.response?.data?.message || 'Search failed');
        toast.error('Search failed');
      } finally {
        setLoading(false);
      }
    }, 300),
    [activeView, currentPage, fetchPublicContent]
  );

  // Add utility function for calculating search relevance
  const calculateRelevanceScore = (item, searchQuery) => {
    if (!searchQuery) return 0;
    
    const searchWords = searchQuery.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    let score = 0;
    const searchableFields = ['title', 'description', 'author'];
    const weights = {
      title: 3,
      description: 2,
      author: 1
    };
    
    searchableFields.forEach(field => {
      const fieldValue = item[field]?.toLowerCase() || '';
      searchWords.forEach(word => {
        // Exact match gets higher score
        if (fieldValue.includes(word)) {
          score += weights[field];
        }
        // Partial match gets lower score
        else if (fieldValue.split(/\s+/).some(fieldWord => 
          fieldWord.includes(word) || word.includes(fieldWord)
        )) {
          score += weights[field] * 0.5;
        }
      });
    });
    
    return score;
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when view changes
  }, [activeView]);

  // Update the main data fetching useEffect
  useEffect(() => {
    fetchPublicContent();
    fetchStats();
  }, [fetchPublicContent, fetchStats, activeView, currentPage, sortBy, language]);

  const filteredItems = useMemo(() => {
    return items;
  }, [items]);

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get('/api/public/stats');
      const updatedCategories = categories.map(cat => {
        switch(cat.label) {
          case 'Snippets':
            return { ...cat, count: data.snippetCount };
          case 'Groups':
            return { ...cat, count: data.groupCount };
          case 'Collections':
            return { ...cat, count: data.directoryCount };
          default:
            return cat;
        }
      });
      setCategories(updatedCategories);
    } catch (err) {
      console.error('Failed to fetch category counts:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const StatCard = ({ label, value }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20"
    >
      <div className="text-2xl font-bold text-indigo-300">{value}</div>
      <div className="text-xs text-indigo-400">{label}</div>
    </motion.div>
  );

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchInputValue(value); // Update input value immediately
    handleSearch(value); // Trigger debounced search
  };

  const PublicRightSidebar = ({ isCollapsed, onToggleCollapse, handleSearchInput, searchInputValue }) => (
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
            value={searchInputValue} // Use searchInputValue instead of searchQuery
            onChange={handleSearchInput}
            placeholder="Search..."
            className="w-full px-4 py-2 pl-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 
                    text-sm placeholder:text-indigo-400/60 focus:outline-none focus:border-indigo-500/40"
          />
          <FiSearch className="absolute left-3 top-2.5 text-indigo-400/50" size={16} />
        </div>

        {/* Add filters and stats similar to BlogLayout */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-indigo-300">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Snippets" value={stats.snippetCount} />
            <StatCard label="Users" value={stats.userCount} />
            <StatCard label="Groups" value={stats.groupCount} />
            <StatCard label="Activities" value={stats.activityCount} />
          </div>
        </div>
      </div>

      {/* Collapsed View */}
      <div className={`p-4 ${isCollapsed ? 'block' : 'hidden'}`}>
        <div className="flex flex-col items-center space-y-4">
          <IconButton 
            icon={<FiSearch />} 
            onClick={() => setIsRightSidebarCollapsed(false)}
          />
          <IconButton icon={<FiFilter />} />
        </div>
      </div>
    </motion.div>
  );

  const SortControls = () => (
    <select 
      value={sortBy}
      onChange={(e) => setSortBy(e.target.value)}
      className="px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300"
    >
      <option value="newest">Newest</option>
      <option value="oldest">Oldest</option>
      <option value="popular">Popular</option>
      <option value="favorites">Most Favorited</option>
    </select>
  );

  const Pagination = () => (
    <div className="flex justify-center gap-2 mt-8">
      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i}
          onClick={() => setCurrentPage(i + 1)}
          className={`px-4 py-2 rounded-lg ${
            currentPage === i + 1
              ? 'bg-indigo-500 text-white'
              : 'bg-indigo-500/10 text-indigo-300'
          }`}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );

  // Updated ViewButton component inside PublicData
  const ViewButton = ({ children, active, onClick, icon }) => (
    <button
      onClick={() => {
        setIsTransitioning(true);
        setItems([]); 
        setLoading(true);
        onClick();
      }}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300
                ${active 
                  ? 'bg-indigo-500/20 text-indigo-300' 
                  : 'text-indigo-400/60 hover:text-indigo-300 hover:bg-indigo-500/10'}`}
    >
      {icon}
      {children}
    </button>
  );

  // Add mobile search component
  const MobileSearch = () => (
    <div className="lg:hidden mb-6">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search..."
          className="w-full px-4 py-3 pl-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 
                    text-sm placeholder:text-indigo-400/60 focus:outline-none focus:border-indigo-500/40"
        />
        <FiSearch className="absolute left-3 top-3.5 text-indigo-400/50" size={16} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#030712] text-white pt-16">
      <div className="relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
            <motion.div 
              className="hidden lg:block flex-shrink-0"
              animate={{ width: isLeftSidebarCollapsed ? '60px' : '280px' }}
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

            <main className="flex-1 min-w-0">
              <MobileSearch /> {/* Add mobile search */}
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
                      onClick={() => {
                        setItems([]); // Clear items before view change
                        setLoading(true); // Show loading state
                        setActiveView('snippets');
                      }}
                      icon={<FiCode />}
                    >
                      Snippets
                    </ViewButton>
                    <ViewButton 
                      active={activeView === 'directories'} 
                      onClick={() => {
                        setItems([]); // Clear items before view change
                        setLoading(true); // Show loading state
                        setActiveView('directories');
                      }}
                      icon={<FiFolder />}
                    >
                      Directories
                    </ViewButton>
                    <ViewButton 
                      active={activeView === 'groups'} 
                      onClick={() => {
                        setItems([]); // Clear items before view change
                        setLoading(true); // Show loading state
                        setActiveView('groups');
                      }}
                      icon={<FiUsers />}
                    >
                      Groups
                    </ViewButton>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mb-6">
                <SortControls />
                {/* ... existing tab controls ... */}
              </div>

              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
              >
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                      {Array(6).fill(0).map((_, i) => (
                        <ItemCardSkeleton key={i} />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                      {filteredItems.map(item => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ItemCard item={item} searchQuery={searchQuery} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <Pagination />
            </main>

            <motion.div 
              className="hidden xl:block flex-shrink-0"
              animate={{ width: isRightSidebarCollapsed ? '60px' : '300px' }}
            >
              <div className="sticky top-20">
                <PublicRightSidebar 
                  isCollapsed={isRightSidebarCollapsed}
                  onToggleCollapse={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
                  handleSearchInput={handleSearchInput} // Add this prop
                  searchInputValue={searchInputValue} // Add this prop
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

const SnippetCard = ({ item }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="bg-gradient-to-br from-indigo-900/20 to-indigo-800/10 rounded-xl border border-indigo-500/20 
               hover:border-indigo-500/40 transition-all duration-300 overflow-hidden"
  >
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-medium text-indigo-300 truncate">{item.title}</h3>
        <FiCode className="text-indigo-400 flex-shrink-0 ml-2" />
      </div>
      <p className="text-sm text-indigo-400/60 mb-4 line-clamp-2">{item.description}</p>
      <div className="bg-black/30 rounded-lg p-3 mb-4 overflow-x-auto">
        <pre className="text-xs text-indigo-300">
          <code>{item.codePreview || '// Code snippet preview'}</code>
        </pre>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-yellow-500">
            <FiStar /> {item.stars}
          </span>
          <span className="flex items-center gap-1 text-indigo-400/60">
            <FiEye /> {item.views}
          </span>
        </div>
        <span className="text-xs bg-indigo-500/10 px-2 py-1 rounded-full">
          {item.author}
        </span>
      </div>
    </div>
  </motion.div>
);

const DirectoryCard = ({ item, searchQuery = '' }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 rounded-xl border border-purple-500/20 
               hover:border-purple-500/40 transition-all duration-300 relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 via-transparent to-transparent" />
    <div className="p-6 relative z-10">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <FiFolder className="text-purple-400 text-xl" />
            </div>
            <h3 className="text-lg font-medium text-purple-300">
              <Highlighter
                highlightClassName="bg-purple-500/20 text-purple-200 px-1 rounded"
                searchWords={getSearchWords(searchQuery)}
                textToHighlight={item.title}
                autoEscape={true}
              />
            </h3>
          </div>
          <p className="text-sm text-purple-400/60 line-clamp-2">
            <Highlighter
              highlightClassName="bg-purple-500/20 text-purple-200 px-1 rounded"
              searchWords={getSearchWords(searchQuery)}
              textToHighlight={item.description}
            />
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-purple-500/10 rounded-lg p-4 text-center backdrop-blur-sm">
          <div className="text-2xl font-bold text-purple-300">{item.itemCount}</div>
          <div className="text-xs text-purple-400/60 mt-1">Total Items</div>
        </div>
        <div className="bg-purple-500/10 rounded-lg p-4 text-center backdrop-blur-sm">
          <div className="text-2xl font-bold text-purple-300">{item.members}</div>
          <div className="text-xs text-purple-400/60 mt-1">Members</div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.author}`}
            alt={item.author}
            className="w-6 h-6 rounded-full bg-purple-500/10"
          />
          <span className="text-sm text-purple-300">{item.author}</span>
        </div>
        <div className="flex gap-2">
          <IconButton 
            icon={<FiShare2 />} 
            className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400"
          />
          <IconButton 
            icon={<FiStar />} 
            className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400"
          />
        </div>
      </div>
    </div>
  </motion.div>
);

const GroupCard = ({ item, searchQuery = '' }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 rounded-xl border border-emerald-500/20 
               hover:border-emerald-500/40 transition-all duration-300 relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-transparent" />
    <div className="p-6 relative z-10">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <FiUsers className="text-emerald-400 text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-emerald-300">
              <Highlighter
                highlightClassName="bg-emerald-500/20 text-emerald-200 px-1 rounded"
                searchWords={getSearchWords(searchQuery)}
                textToHighlight={item.title}
                autoEscape={true}
              />
            </h3>
            <span className="text-xs text-emerald-400/60">
              Created by {item.author}
            </span>
          </div>
        </div>
        <span className="px-3 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-300">
          {item.visibility || 'Public'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-emerald-500/10 rounded-lg p-4 text-center backdrop-blur-sm">
          <div className="text-2xl font-bold text-emerald-300">{item.memberCount}</div>
          <div className="text-xs text-emerald-400/60 mt-1">Members</div>
        </div>
        <div className="bg-emerald-500/10 rounded-lg p-4 text-center backdrop-blur-sm">
          <div className="text-2xl font-bold text-emerald-300">{item.snippetCount}</div>
          <div className="text-xs text-emerald-400/60 mt-1">Snippets</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {/* Add dummy avatar stack for visual representation */}
          {[...Array(3)].map((_, i) => (
            <img
              key={i}
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`}
              alt="Member avatar"
              className="w-8 h-8 rounded-full border-2 border-emerald-900"
            />
          ))}
          {item.memberCount > 3 && (
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border-2 border-emerald-900
                          flex items-center justify-center text-xs text-emerald-300">
              +{item.memberCount - 3}
            </div>
          )}
        </div>
        <button className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 
                         hover:bg-emerald-500/30 transition-colors flex items-center gap-2">
          <FiUsers className="text-sm" />
          Join Group
        </button>
      </div>
    </div>
  </motion.div>
);

const ItemCard = ({ item, searchQuery }) => {
  switch (item.type) {
    case 'snippet':
      return <SnippetCard item={item} searchQuery={searchQuery} />;
    case 'directory':
      return <DirectoryCard item={item} searchQuery={searchQuery} />;
    case 'group':
      return <GroupCard item={item} searchQuery={searchQuery} />;
    default:
      return null;
  }
};

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

const getSearchWords = (searchQuery) => {
  return searchQuery
    ? searchQuery.toLowerCase().split(/\s+/).filter(word => word.length > 0)
    : [];
};

export default PublicData;
