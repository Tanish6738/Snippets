import React, { useState, useEffect, useCallback } from 'react';
import { FiCode, FiLayout, FiGrid, FiList, FiSearch, FiTrash2, FiFilter, FiDownload } from 'react-icons/fi';
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
    <div key={snippet._id} className="group bg-[#0B1120]/80 backdrop-blur-xl rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 transition-all duration-300 overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              <FiCode className="text-indigo-400" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-white">{snippet.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                  {snippet.programmingLanguage}
                </span>
                <span className="text-xs text-indigo-400">
                  {new Date(snippet.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewSnippet(snippet._id)}
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <FiLayout size={18} />
            </button>
            {snippet.exportFormats?.length > 0 && (
              <button className="text-indigo-400 hover:text-indigo-300">
                <FiDownload size={18} />
              </button>
            )}
            {isAuthenticated && snippet.createdBy._id === user?._id && (
              <button
                onClick={() => handleDeleteSnippet(snippet._id)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <FiTrash2 size={18} />
              </button>
            )}
          </div>
        </div>

        {snippet.description && (
          <p className="text-sm text-indigo-300/80 line-clamp-2">
            {snippet.description}
          </p>
        )}

        <div className="bg-black/30 rounded-lg p-4 font-mono text-sm text-indigo-300/90">
          <pre>
            <code>{snippet.content ? `${snippet.content.slice(0, 100)}...` : 'No content available'}</code>
          </pre>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap">
            {(snippet.tags || []).map((tag) => (
              <span key={tag} className="px-2 py-1 text-xs rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {tag}
              </span>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-xs text-indigo-400">
            <div className="flex gap-4">
              <span>{snippet.stats.views} views</span>
              <span>{snippet.stats.copies} copies</span>
              <span>{snippet.stats.favorites} favorites</span>
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
    <div className="min-h-screen bg-gradient-to-br from-[#070B14] to-[#0B1120] pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
              Code Snippets
            </h1>
            <p className="text-indigo-400 mt-2">
              Organize and manage your code snippets efficiently
            </p>
          </div>
          {isAuthenticated && (
            <div className="space-x-3">
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-6 py-2 rounded-xl text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all duration-300"
              >
                Create Snippet
              </button>
              <button
                onClick={() => setBulkCreateModalOpen(true)}
                className="px-6 py-2 rounded-xl text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 transition-all duration-200"
              >
                Bulk Create
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={`Search by ${filterBy === 'all' ? 'anything' : filterBy}...`}
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full px-4 py-3 pl-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white placeholder-indigo-400/60 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-200"
              />
              <FiSearch className="absolute left-4 top-3.5 text-indigo-400/60" size={20} />
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all duration-200 flex items-center gap-2"
              >
                <FiFilter size={18} />
                <span className="capitalize">{filterBy}</span>
              </button>

              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#0B1120] border border-indigo-500/20 shadow-lg z-10">
                  {['all', 'title', 'tags', 'language'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        setFilterBy(filter);
                        setShowFilterDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-indigo-300 hover:bg-indigo-500/10 first:rounded-t-xl last:rounded-b-xl capitalize"
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-xl ${viewMode === 'grid' ? 'bg-indigo-500/30' : 'bg-indigo-500/20'} text-indigo-300 hover:bg-indigo-500/30 transition-all duration-200 flex items-center gap-2`}
            >
              <FiGrid size={18} />
              <span>Grid View</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-xl ${viewMode === 'list' ? 'bg-indigo-500/30' : 'bg-indigo-500/20'} text-indigo-300 hover:bg-indigo-500/30 transition-all duration-200 flex items-center gap-2`}
            >
              <FiList size={18} />
              <span>List View</span>
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
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
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
