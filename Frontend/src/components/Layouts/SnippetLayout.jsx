import React, { useState, useEffect, useCallback } from 'react';
import { FiCode, FiLayout, FiGrid, FiList, FiSearch, FiTrash2, FiFilter, FiDownload, FiEye, FiStar } from 'react-icons/fi';
import { useUser } from '../../Context/UserContext';
import axios from '../../Config/Axios';
import ViewSnippetModal from '../Modals/SnippetModals/ViewSnippetModal';
import CreateSnippetModal from '../Modals/SnippetModals/CreateSnippetModal';
import BulkCreateSnippetModal from '../Modals/SnippetModals/BulkCreateSnippetModal';

const SnippetLayout = () => {
  const { isAuthenticated, user } = useUser();
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedSnippetId, setSelectedSnippetId] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [bulkCreateModalOpen, setBulkCreateModalOpen] = useState(false);
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'title', 'tags', 'language'
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSnippets = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      let queryParams = {};
      
      // Only add search params if there's actually a search query
      if (debouncedSearchQuery.trim()) {
        if (filterBy === 'all') {
          queryParams.search = debouncedSearchQuery;
        } else {
          queryParams[filterBy] = debouncedSearchQuery;
        }
      }

      const { data } = await axios.get('/api/snippets', {
        params: queryParams
      });

      // Client-side filtering based on selected filter
      let filteredSnippets = data.snippets;
      
      if (debouncedSearchQuery.trim() && filterBy !== 'all') {
        filteredSnippets = data.snippets.filter(snippet => {
          const searchTerm = debouncedSearchQuery.toLowerCase();
          switch (filterBy) {
            case 'title':
              return snippet.title.toLowerCase().includes(searchTerm);
            case 'tags':
              return snippet.tags.some(tag => 
                tag.toLowerCase().includes(searchTerm)
              );
            case 'language':
              return snippet.programmingLanguage.toLowerCase().includes(searchTerm);
            default:
              return true;
          }
        });
      }

      setSnippets(filteredSnippets);
    } catch (err) {
      setError(err.message || 'Failed to fetch snippets');
      setSnippets([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery, filterBy]);

  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets, debouncedSearchQuery]);

  const handleViewSnippet = (snippetId) => {
    setSelectedSnippetId(snippetId);
    setViewModalOpen(true);
  };

  const handleDeleteSnippet = async (snippetId) => {
    if (!isAuthenticated) return;
    try {
      await axios.delete(`/api/snippets/${snippetId}`);
      fetchSnippets();
    } catch (err) {
      setError(err.message || 'Failed to delete snippet');
    }
  };

  const renderSnippetCard = (snippet) => (
    <div key={snippet._id} className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-slate-700/30 shadow-lg hover:shadow-xl hover:border-slate-600/50 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700/5 via-transparent to-slate-800/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700/50 group-hover:border-slate-600/70 transition-colors">
              <FiCode className="text-slate-300 group-hover:text-slate-200" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                {snippet.title}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-sm px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700/50 text-slate-300">
                  {snippet.programmingLanguage}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(snippet.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleViewSnippet(snippet._id)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
              aria-label="View snippet"
            >
              <FiLayout size={18} />
            </button>
            {snippet.exportFormats?.length > 0 && (
              <button 
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
                aria-label="Download snippet"
              >
                <FiDownload size={18} />
              </button>
            )}
            {isAuthenticated && snippet.createdBy._id === user?._id && (
              <button
                onClick={() => handleDeleteSnippet(snippet._id)}
                className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                aria-label="Delete snippet"
              >
                <FiTrash2 size={18} />
              </button>
            )}
          </div>
        </div>

        {snippet.description && (
          <p className="text-sm text-slate-400 line-clamp-2">
            {snippet.description}
          </p>
        )}

        <div className="relative group/code overflow-hidden rounded-lg bg-slate-900 border border-slate-800/50">
          <div className="absolute top-0 right-0 px-3 py-1.5 text-xs text-slate-400 bg-slate-800/80 rounded-bl-lg border-l border-b border-slate-700/30">
            {snippet.programmingLanguage}
          </div>
          <pre className="p-4 pt-8 font-mono text-sm text-slate-300/90 overflow-x-auto styled-scrollbar">
            <code>{snippet.content ? `${snippet.content.slice(0, 100)}...` : 'No content available'}</code>
          </pre>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap">
            {(snippet.tags || []).map((tag) => (
              <span 
                key={tag} 
                className="px-2.5 py-1 text-xs rounded-full bg-slate-800 text-slate-300 border border-slate-700/50 hover:border-slate-600/70 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5">
                <FiEye size={14} className="text-slate-500" />
                {snippet.stats.views}
              </span>
              <span className="flex items-center gap-1.5">
                <FiCode size={14} className="text-slate-500" />
                {snippet.stats.copies}
              </span>
              <span className="flex items-center gap-1.5">
                <FiStar size={14} className="text-slate-500" />
                {snippet.stats.favorites}
              </span>
            </div>
            <div className="flex gap-4">
              <span>{snippet.versionHistory?.length || 1} versions</span>
              {snippet.commentsEnabled && (
                <span>{snippet.commentCount} comments</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Update input handler to show immediate visual feedback
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (!e.target.value.trim()) {
      fetchSnippets(); // Fetch all snippets when search is cleared
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 pt-16">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Header section - made responsive */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Code Snippets
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-2">
              Organize and manage your code snippets efficiently
            </p>
          </div>
          {isAuthenticated && (
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300"
              >
                Create Snippet
              </button>
              <button
                onClick={() => setBulkCreateModalOpen(true)}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-slate-300 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-200"
              >
                Bulk Create
              </button>
            </div>
          )}
        </div>

        {/* Search and filter section - updated design and responsiveness */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Search by ${filterBy === 'all' ? 'anything' : filterBy}...`}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full px-4 py-3 pl-12 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder-slate-400 
                  focus:border-slate-600 focus:ring-1 focus:ring-slate-500 hover:border-slate-600/70
                  transition-all duration-200"
                />
                <FiSearch className="absolute left-4 top-3.5 text-slate-400" size={20} />
              </div>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 
                text-slate-300 hover:text-slate-200 hover:bg-slate-700/50 hover:border-slate-600
                transition-all duration-200 flex items-center justify-center sm:justify-start gap-2"
              >
                <FiFilter size={18} />
                <span className="capitalize">{filterBy}</span>
              </button>

              {showFilterDropdown && (
                <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-48 rounded-xl 
                bg-slate-800 border border-slate-700/50 shadow-xl shadow-black/20 z-20">
                  {['all', 'title', 'tags', 'language'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        setFilterBy(filter);
                        setShowFilterDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2.5 text-slate-300 hover:bg-slate-700/50 
                      first:rounded-t-xl last:rounded-b-xl capitalize transition-colors duration-200"
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl 
              ${viewMode === 'grid' 
                ? 'bg-slate-700/70 text-slate-200 border-slate-600' 
                : 'bg-slate-800/50 text-slate-400 border-slate-700/50'} 
              hover:bg-slate-700/60 border transition-all duration-200 
              flex items-center justify-center sm:justify-start gap-2`}
            >
              <FiGrid size={18} />
              <span className="hidden sm:inline">Grid View</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl 
              ${viewMode === 'list' 
                ? 'bg-slate-700/70 text-slate-200 border-slate-600' 
                : 'bg-slate-800/50 text-slate-400 border-slate-700/50'} 
              hover:bg-slate-700/60 border transition-all duration-200 
              flex items-center justify-center sm:justify-start gap-2`}
            >
              <FiList size={18} />
              <span className="hidden sm:inline">List View</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className={`grid gap-4 sm:gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {snippets.map(renderSnippetCard)}
          </div>
        )}

        {viewModalOpen && (
          <ViewSnippetModal
            isOpen={viewModalOpen}
            onClose={() => setViewModalOpen(false)}
            snippetId={selectedSnippetId}
          />
        )}

        {createModalOpen && (
          <CreateSnippetModal
            isOpen={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onSnippetCreated={fetchSnippets}
          />
        )}

        {bulkCreateModalOpen && (
          <BulkCreateSnippetModal
            isOpen={bulkCreateModalOpen}
            onClose={() => setBulkCreateModalOpen(false)}
            onSnippetsCreated={fetchSnippets}
          />
        )}
      </div>
    </div>
  );
};

export default SnippetLayout;
