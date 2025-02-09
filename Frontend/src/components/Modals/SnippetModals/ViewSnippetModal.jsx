import { useEffect, useState } from 'react';
import { useUser } from '../../../Context/UserContext';
import axios from '../../../Config/Axios';
import EditSnippetDetailsModal from './EditSnippetDetailsModal';
import ExportSnippetModal from './ExportSnippetModal';

const ViewSnippetModal = ({ isOpen, onClose, snippetId, onEdit = null }) => {
  const [snippet, setSnippet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useUser();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    const fetchSnippet = async () => {
      if (!snippetId) {
        setError('No snippet ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const { data } = await axios.get(`/api/snippets/get/${snippetId}`);
        
        if (!data) {
          throw new Error('No data received from server');
        }

        setSnippet(data);
        
        console.log('Snippet fetch successful:', {
          snippetId,
          data,
          userID: user?._id,
          creatorID: data.createdBy?._id || data.createdBy
        });

      } catch (err) {
        console.error('Snippet fetch error:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          snippetId
        });

        setError(
          err.response?.data?.error || 
          err.message || 
          'Failed to fetch snippet'
        );
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && snippetId) {
      fetchSnippet();
    }

    return () => {
      if (!isOpen) {
        setSnippet(null);
        setError('');
        setLoading(false);
      }
    };
  }, [snippetId, isOpen, user]);

  const handleEditClick = () => {
    console.log('Edit button clicked', {
      snippet,
      userId: user?._id,
      creatorId: snippet?.createdBy?._id || snippet?.createdBy,
      onEdit
    });
    if (onEdit) {
      onEdit(snippet._id);
    }
    onClose();
  };

  const handleEditComplete = (updatedSnippet) => {
    setShowEditModal(false);
    setSnippet(updatedSnippet);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] overflow-y-auto">
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm"></div>
        
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-[#0B1120]/95 backdrop-blur-xl rounded-2xl shadow-lg border border-indigo-500/30 overflow-hidden transition-all transform duration-300 ease-in-out hover:border-indigo-400/50 hover:shadow-indigo-500/10">
            <div className="px-6 py-4 border-b border-indigo-500/20">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                  {snippet?.title || 'Loading...'}
                </h2>
                <button onClick={onClose} className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200 text-2xl font-semibold">
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-track-indigo-500/10 scrollbar-thumb-indigo-500/40">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : error ? (
                <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl">
                  {error}
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-indigo-300 mb-2">Description</h3>
                    <p className="text-indigo-200/80">{snippet.description || 'No description provided'}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-indigo-300 mb-2">Code</h3>
                    <pre className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
                      <code className="font-mono text-sm text-white">{snippet.content}</code>
                    </pre>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {snippet.tags.map(tag => (
                      <span key={tag} className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30 text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-indigo-300">
                    <div>
                      <p>Language: {snippet.programmingLanguage}</p>
                      <p>Visibility: {snippet.visibility}</p>
                    </div>
                    <div>
                      <p>Created: {new Date(snippet.createdAt).toLocaleDateString()}</p>
                      <p>Last Updated: {new Date(snippet.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="text-sm text-indigo-300 space-y-1">
                    <p>Views: {snippet.stats?.views || 0}</p>
                    <p>Copies: {snippet.stats?.copies || 0}</p>
                    <p>Favorites: {snippet.stats?.favorites || 0}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-indigo-500/20 bg-indigo-500/5">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowExportModal(true)}
                  className="px-4 py-2 rounded-xl text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 transition-all duration-200"
                >
                  Export
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 transition-all duration-200"
                >
                  Close
                </button>
                {user && snippet && user._id === (snippet.createdBy?._id || snippet.createdBy) && (
                  <button
                    onClick={handleEditClick}
                    className="px-6 py-2 rounded-xl text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_25px_rgba(99,102,241,0.35)]"
                  >
                    Edit Snippet
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditSnippetDetailsModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        snippet={snippet}
        onSnippetUpdated={handleEditComplete}
      />

      <ExportSnippetModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        itemId={snippetId}
        itemType="snippet"
      />
    </>
  );
};

export default ViewSnippetModal;