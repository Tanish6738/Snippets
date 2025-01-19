import { useState, useEffect } from 'react';
import { useUser } from '../../../Context/UserContext';
import axios from '../../../Config/Axios';
import ViewSnippetModal from './ViewSnippetModal';
import BulkCreateSnippetModal from './BulkCreateSnippetModal';
import CreateSnippetModal from './CreateSnippetModal';

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
  
  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [bulkCreateModalOpen, setBulkCreateModalOpen] = useState(false);
  const [selectedSnippetId, setSelectedSnippetId] = useState(null);

  const fetchSnippets = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        language: selectedLanguage,
        q: searchQuery
      };

      if (viewMode === 'user' && isAuthenticated) {
        params.createdBy = user._id;
      }

      const { data } = await axios.get('/api/snippets', { params });
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
  }, [viewMode, currentPage, searchQuery, selectedLanguage, isAuthenticated]);

  const handleViewSnippet = (snippetId) => {
    setSelectedSnippetId(snippetId);
    setViewModalOpen(true);
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

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Code Snippets</h1>
        {isAuthenticated && (
          <div className="space-x-3">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Snippet
            </button>
            <button
              onClick={() => setBulkCreateModalOpen(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Bulk Create
            </button>
          </div>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search snippets..."
            className="w-full p-2 border rounded"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="p-2 border rounded"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
        >
          <option value="">All Languages</option>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          {/* Add more language options */}
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid gap-6">
          {snippets.map(snippet => (
            <div key={snippet._id} className="border rounded-lg p-4 bg-white shadow">
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
    </div>
  );
};

export default Snippets;