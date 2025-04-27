import { useState, useEffect } from 'react';
import { useUser } from '../../../Context/UserContext';
import { useLocation } from 'react-router-dom';
import axios from '../../../Config/Axios';
import ViewSnippetModal from './ViewSnippetModal';
import BulkCreateSnippetModal from './BulkCreateSnippetModal';
import CreateSnippetModal from './CreateSnippetModal';
import BulkDocumentationModal from './BulkDocumentationModal';
import EditSnippetDetailsModal from './EditSnippetDetailsModal';
import { FiFileText, FiPlus, FiUploadCloud } from 'react-icons/fi';

const Snippets = () => {
  const { isAuthenticated, user } = useUser();
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'user'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [bulkCreateModalOpen, setBulkCreateModalOpen] = useState(false);
  const [bulkDocumentationModalOpen, setBulkDocumentationModalOpen] = useState(false);
  const [selectedSnippetId, setSelectedSnippetId] = useState(null);

  const location = useLocation();
  const isMySnippetsPage = location.pathname === '/my-snippets';

  // Add language options based on actual used languages
  const languageOptions = [
    { value: '', label: 'All Languages' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'typescript', label: 'TypeScript' }
  ];

  // Update fetchSnippets function to handle all filters
  const fetchSnippets = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        language: selectedLanguage,
        search: searchQuery,
      };

      const endpoint = isMySnippetsPage ? '/api/snippets/user/snippets' : '/api/snippets';
      const { data } = await axios.get(endpoint, { params });
      
      setSnippets(data.snippets);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message || 'Failed to fetch snippets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnippets();
  }, [currentPage, searchQuery, selectedLanguage, isMySnippetsPage]);

  const handleViewSnippet = (snippetId) => {
    setSelectedSnippetId(snippetId);
    setViewModalOpen(true);
  };

  const handleEditSnippet = (snippetId) => {
    setViewModalOpen(false);
    setSelectedSnippetId(snippetId);
    setEditModalOpen(true);
  };

  const handleDelete = async (snippetId) => {
    if (!isAuthenticated) return;
    try {
      await axios.delete(`/api/snippets/${snippetId}`);
      fetchSnippets();
    } catch (err) {
      setError(err.message || 'Failed to delete snippet');
    }
  };

  const handleSnippetCreated = () => {
    fetchSnippets();
  };

  // Update page title based on current view
  const pageTitle = isMySnippetsPage ? "My Snippets" : "Code Snippets";

  return (
    <div className="container mx-auto p-6 text-white">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
          {pageTitle}
        </h1>
        {isAuthenticated && (
          <div className="space-x-3">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-6 py-2 rounded-xl text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_25px_rgba(99,102,241,0.35)]"
            >
              <span className="flex items-center gap-2">
                <FiPlus size={16} />
                Create Snippet
              </span>
            </button>
            <button
              onClick={() => setBulkCreateModalOpen(true)}
              className="px-6 py-2 rounded-xl text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 transition-all duration-200"
            >
              <span className="flex items-center gap-2">
                <FiUploadCloud size={16} />
                Bulk Create
              </span>
            </button>
            <button
              onClick={() => setBulkDocumentationModalOpen(true)}
              className="px-6 py-2 rounded-xl text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 transition-all duration-200"
            >
              <span className="flex items-center gap-2">
                <FiFileText size={16} />
                Generate Docs
              </span>
            </button>
          </div>
        )}
      </div>

      <div className="mb-8 flex flex-wrap gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder={`Search ${isMySnippetsPage ? 'your' : ''} snippets...`}
            className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white placeholder-indigo-400/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
        >
          {languageOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {isAuthenticated && (
          <select
            className="p-2 border rounded"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="all">All Snippets</option>
            <option value="user">My Snippets</option>
          </select>
        )}
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
        <div className="grid gap-6">
          {snippets.map(snippet => (
            <div key={snippet._id} className="backdrop-blur-lg bg-white/5 p-6 rounded-2xl border border-indigo-500/30 hover:border-indigo-400/50 transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{snippet.title}</h3>
                  <p className="text-gray-600 mb-2">{snippet.description}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewSnippet(snippet._id)}
                    className="px-3 py-1 text-blue-600 hover:text-blue-800"
                  >
                    View
                  </button>
                  {isAuthenticated && snippet.createdBy === user._id && (
                    <>
                      <button
                        onClick={() => handleDelete(snippet._id)}
                        className="px-3 py-1 text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {snippet.tags.map(tag => (
                  <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <span className="mr-4">Language: {snippet.programmingLanguage}</span>
                <span className="mr-4">Views: {snippet.stats?.views || 0}</span>
                <span>Created: {new Date(snippet.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center space-x-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {viewModalOpen && (
        <ViewSnippetModal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          snippetId={selectedSnippetId}
          onEdit={handleEditSnippet}
        />
      )}

      {createModalOpen && (
        <CreateSnippetModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSnippetCreated={handleSnippetCreated}
        />
      )}

      {bulkCreateModalOpen && (
        <BulkCreateSnippetModal
          isOpen={bulkCreateModalOpen}
          onClose={() => setBulkCreateModalOpen(false)}
          onSnippetsCreated={handleSnippetCreated}
        />
      )}

      {bulkDocumentationModalOpen && (
        <BulkDocumentationModal
          isOpen={bulkDocumentationModalOpen}
          onClose={() => setBulkDocumentationModalOpen(false)}
        />
      )}

      {editModalOpen && (
        <EditSnippetDetailsModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          snippetId={selectedSnippetId}
          onSnippetUpdated={() => {
            setEditModalOpen(false);
            fetchSnippets();
          }}
        />
      )}
    </div>
  );
};

export default Snippets;