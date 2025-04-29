import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../Context/UserContext';
import axios from '../../Config/Axios';
import {
  FiCode, FiFolder, FiUsers, FiSearch, FiStar, 
  FiTrendingUp, FiClock, FiDownload, FiChevronLeft,
  FiFilter, FiGrid, FiList
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import ViewSnippetModal from '../Modals/SnippetModals/ViewSnippetModal';
import ExportSnippetModal from '../Modals/SnippetModals/ExportSnippetModal';

// Import our component files
import { PublicSidebar } from './PublicComponents/PublicSidebar';
import { 
  ItemCardSkeleton, 
  ItemCard, 
  getSearchWords 
} from './PublicComponents/PublicCards';
import { 
  TabButton, 
  ViewButton, 
  SearchBar, 
  Pagination, 
  SortControls,
  StatBox
} from './PublicComponents/PublicUI';

// Container component for consistent styling
const Container = ({ children }) => (
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
    {children}
  </div>
);

// Glass card component
const GlassCard = ({ title, icon, children, action }) => (
  <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
    {(title || icon) && (
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          {icon && <span className="text-slate-300">{icon}</span>}
          {title && <h3 className="text-lg font-medium text-slate-300">{title}</h3>}
        </div>
        {action}
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
);

// Right sidebar component
const PublicRightSidebar = ({ 
  isCollapsed, 
  onToggleCollapse, 
  handleSearchInput,
  searchInputValue,
  stats
}) => {
  return (
    <motion.div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 
                          shadow-lg shadow-slate-900/10 h-full relative">
      <button
        onClick={onToggleCollapse}
        className="absolute -left-3 top-4 p-1.5 rounded-full bg-slate-700 text-white
                  hover:bg-slate-600 transition-colors z-10"
      >
        <FiChevronLeft className={`transform transition-transform duration-300 
                                ${isCollapsed ? '' : 'rotate-180'}`} />
      </button>

      <div className={`p-4 ${isCollapsed ? 'hidden' : 'block'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-300">Search & Stats</h2>
        </div>

        <div className="space-y-6">
          <SearchBar 
            value={searchInputValue}
            onChange={handleSearchInput}
            placeholder="Search (multiple words allowed)..."
          />

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-400">Platform Stats</h3>
            <div className="grid grid-cols-1 gap-4">
              <StatBox 
                label="Snippets" 
                value={stats.snippetCount} 
                icon={<FiCode />} 
              />
              <StatBox 
                label="Users" 
                value={stats.userCount} 
                icon={<FiUsers />} 
              />
              <StatBox 
                label="Groups" 
                value={stats.groupCount} 
                icon={<FiUsers />} 
              />
              <StatBox 
                label="Activities" 
                value={stats.activityCount} 
                icon={<FiClock />} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Collapsed View */}
      <div className={`p-4 ${isCollapsed ? 'block' : 'hidden'}`}>
        <div className="space-y-6 flex flex-col items-center">
          <FiSearch className="text-slate-300 text-xl" />
          <FiCode className="text-slate-300 text-xl" />
          <FiUsers className="text-slate-300 text-xl" />
          <FiStar className="text-slate-300 text-xl" />
        </div>
      </div>
    </motion.div>
  );
};

// Main PublicData component
const PublicData = () => {
  // State management
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [categories, setCategories] = useState([
    { icon: <FiTrendingUp />, label: "Popular", count: 0 },
    { icon: <FiClock />, label: "Recent", count: 0 },
    { icon: <FiStar />, label: "Featured", count: 0 },
    { icon: <FiCode />, label: "Snippets", count: 0 },
    { icon: <FiFolder />, label: "Collections", count: 0 },
    { icon: <FiUsers />, label: "Groups", count: 0 },
  ]);
  const [activeTab, setActiveTab] = useState('public');
  const [activeView, setActiveView] = useState('snippets');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [language, setLanguage] = useState('');
  const [languages, setLanguages] = useState([]);
  const [stats, setStats] = useState({
    snippetCount: 0,
    userCount: 0,
    groupCount: 0,
    activityCount: 0
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSnippetId, setSelectedSnippetId] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [filters, setFilters] = useState({
    language: '',
    tags: [],
    author: '',
    dateRange: 'all'
  });

  const navigate = useNavigate();
  const { isAuthenticated, user } = useUser();

  // Enhanced search functionality
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchQuery(value.toLowerCase().trim());
    }, 300),
    []
  );

  // Handle search input with debounce
  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchInputValue(value);
    debouncedSearch(value);
  };

  // Filter items based on enhanced search query and active filters
  const filteredItems = useMemo(() => {
    if (!items.length) return [];
    
    let filtered = [...items];
    
    // Apply search query filter
    if (searchQuery) {
      const searchTerms = searchQuery.split(' ').filter(term => term.length > 0);
      filtered = filtered.filter(item => {
        const searchableText = `${item.title} ${item.description} ${item.tags?.join(' ')} ${item.language} ${item.author}`.toLowerCase();
        return searchTerms.every(term => searchableText.includes(term));
      });
    }
    
    // Apply category filter
    if (activeCategory !== 'all') {
      switch (activeCategory) {
        case 'popular':
          filtered = filtered.sort((a, b) => (b.stars || 0) - (a.stars || 0));
          break;
        case 'recent':
          filtered = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'featured':
          filtered = filtered.filter(item => item.featured);
          break;
        case 'snippets':
          filtered = filtered.filter(item => item.type === 'snippet');
          break;
        case 'collections':
          filtered = filtered.filter(item => item.type === 'directory');
          break;
        case 'groups':
          filtered = filtered.filter(item => item.type === 'group');
          break;
      }
    }

    // Apply additional filters
    if (filters.language) {
      filtered = filtered.filter(item => item.language === filters.language);
    }
    if (filters.tags.length) {
      filtered = filtered.filter(item => 
        filters.tags.every(tag => item.tags?.includes(tag))
      );
    }
    if (filters.author) {
      filtered = filtered.filter(item => item.author === filters.author);
    }
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      switch (filters.dateRange) {
        case 'today':
          cutoff.setDate(now.getDate() - 1);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
      }
      filtered = filtered.filter(item => new Date(item.createdAt) > cutoff);
    }
    
    return filtered;
  }, [items, activeCategory, searchQuery, filters]);

  // Fetch public content
  const fetchPublicContent = useCallback(async () => {
    try {
      setIsTransitioning(true);
      setLoading(true);
      setError(null);
      setItems([]);

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
            id: snippet._id,
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
            id: dir._id,
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
            id: group._id,
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
      
      // Update category counts
      updateCategoryCounts(data);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch content');
      toast.error('Failed to fetch content');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setIsTransitioning(false);
      }, 300);
    }
  }, [activeView, currentPage, sortBy, language]);

  // Update category counts
  const updateCategoryCounts = (data) => {
    if (!data) return;
    
    const counts = {
      snippets: data.filter(item => item.type === 'snippet').length,
      collections: data.filter(item => item.type === 'directory').length,
      groups: data.filter(item => item.type === 'group').length,
      featured: data.filter(item => item.featured).length,
      // We'll use the total for popular and recent
      popular: data.length,
      recent: data.length
    };
    
    setCategories(prev => prev.map(cat => ({
      ...cat,
      count: counts[cat.label.toLowerCase()] || 0
    })));
  };

  // Fetch stats
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

  // Fetch available languages
  const fetchLanguages = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/public/languages');
      setLanguages(data || []);
    } catch (err) {
      console.error('Failed to fetch languages:', err);
      // Set default languages if API endpoint is not available
      setLanguages([
        'JavaScript', 'Python', 'Java', 'C#', 'C++', 'PHP', 'Ruby', 'Go',
        'TypeScript', 'Swift', 'Kotlin', 'Rust', 'HTML', 'CSS', 'SQL'
      ]);
    }
  }, []);

  // Handle view snippet
  const handleViewSnippet = (snippetId) => {
    setSelectedSnippetId(snippetId);
    setShowViewModal(true);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Effects
  useEffect(() => {
    fetchPublicContent();
  }, [fetchPublicContent]);

  useEffect(() => {
    fetchStats();
    fetchLanguages();
  }, [fetchStats, fetchLanguages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex">
        {/* Left Sidebar */}
        <PublicSidebar
          isCollapsed={isLeftSidebarCollapsed}
          onToggleCollapse={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
                Discover Code Snippets
              </h1>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-colors"
                >
                  {viewMode === 'grid' ? <FiList /> : <FiGrid />}
                </button>
                <button
                  onClick={() => setShowFilters(prev => !prev)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-colors"
                >
                  <FiFilter />
                  <span>Filters</span>
                </button>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-[1fr,auto] gap-4">
              <SearchBar
                value={searchInputValue}
                onChange={handleSearchInput}
                placeholder="Search snippets by title, description, tags, or language..."
              />
              <SortControls
                sortBy={sortBy}
                onSortChange={setSortBy}
                language={language}
                onLanguageChange={setLanguage}
                languages={languages}
                options={[
                  { value: 'newest', label: 'Newest' },
                  { value: 'popular', label: 'Most Popular' },
                  { value: 'trending', label: 'Trending' }
                ]}
              />
            </div>
          </header>

          {/* Content Grid/List */}
          <AnimatePresence mode="wait">
            {loading ? (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {[...Array(6)].map((_, i) => (
                  <ItemCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/50 text-red-300">
                {error}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}
              >
                {filteredItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    searchQuery={searchQuery}
                    handleViewSnippet={handleViewSnippet}
                    setShowExportModal={setShowExportModal}
                    setSelectedSnippetId={setSelectedSnippetId}
                    viewMode={viewMode}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <PublicRightSidebar
          isCollapsed={isRightSidebarCollapsed}
          onToggleCollapse={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
          handleSearchInput={handleSearchInput}
          searchInputValue={searchInputValue}
          stats={stats}
        />
      </div>

      {/* Modals */}
      <ViewSnippetModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        snippetId={selectedSnippetId}
      />
      <ExportSnippetModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        snippetId={selectedSnippetId}
      />
    </div>
  );
};

export default PublicData;
