import { useEffect, useState } from 'react';
import { useUser } from '../../../Context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from '../../../Config/Axios';
import EditSnippetDetailsModal from './EditSnippetDetailsModal';
import ExportSnippetModal from './ExportSnippetModal';

const ViewSnippetModal = ({ isOpen, onClose, snippetId, onEdit = null }) => {
  const navigate = useNavigate();
  const [snippet, setSnippet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useUser();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [explanationData, setExplanationData] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);

  useEffect(() => {
    const fetchSnippet = async () => {
      if (!snippetId) {
        setError('No snippet ID provided');
        setLoading(false);
      }

      try {
        setLoading(true);
        setError('');

        const { data } = await axios.get(`/api/snippets/get/${snippetId}`);
        
        if (!data) {
          throw new Error('No data received from server');
        }

        setSnippet(data);

      } catch (err) {
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
    if (onEdit) {
      onEdit(snippet._id);
    }
    onClose();
  };

  const handleEditComplete = (updatedSnippet) => {
    setShowEditModal(false);
    setSnippet(updatedSnippet);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(snippet.content);
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2000); // Reset after 2 seconds
    } catch (err) {
      setCopyStatus('Failed to copy');
    }
  };

  const handleExplainCode = async () => {
    if (snippet?.content) {
      try {
        setIsExplaining(true);
        const response = await axios.post('/api/ai/explain-code', {
          code: snippet.content,
          language: snippet.programmingLanguage
        });
        
        setExplanationData(response.data.explanation);
        setIsExplaining(false);
      } catch (error) {
        console.error('Failed to explain code:', error);
        setExplanationData(null);
        setError('Failed to generate explanation. Please try again.');
        setIsExplaining(false);
      }
    }
  };

  const handleRunSnippet = () => {
    if (snippet?.content) {
      let detectedLanguage = 'javascript'; // Default language
      
      if (snippet.programmingLanguage) {
        const lang = snippet.programmingLanguage.toLowerCase();
        if (lang.includes('python') || lang.includes('py')) {
          detectedLanguage = 'python';
        } else if (lang.includes('javascript') || lang.includes('js')) {
          detectedLanguage = 'javascript';
        }
      }

      onClose();

      navigate('/run-code', {
        state: {
          code: snippet.content,
          language: detectedLanguage
        }
      });
    }
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
              ) : snippet ? ( // Add this check
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-indigo-300 mb-2">Description</h3>
                    <p className="text-indigo-200/80">{snippet?.description || 'No description provided'}</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium text-indigo-300">Code</h3>
                      <button
                        onClick={handleCopyCode}
                        className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 transition-all duration-200"
                      >
                        {copyStatus ? (
                          <>
                            <span className="text-green-400">{copyStatus}</span>
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
                      <code className="font-mono text-sm text-white">{snippet?.content || ''}</code>
                    </pre>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {snippet?.tags?.map(tag => (
                      <span key={tag} className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30 text-sm">
                        {tag}
                      </span>
                    )) || null}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-indigo-300">
                    <div>
                      <p>Language: {snippet?.programmingLanguage || 'N/A'}</p>
                      <p>Visibility: {snippet?.visibility || 'N/A'}</p>
                    </div>
                    <div>
                      <p>Created: {snippet?.createdAt ? new Date(snippet.createdAt).toLocaleDateString() : 'N/A'}</p>
                      <p>Last Updated: {snippet?.updatedAt ? new Date(snippet.updatedAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>

                  <div className="text-sm text-indigo-300 space-y-1">
                    <p>Views: {snippet?.stats?.views || 0}</p>
                    <p>Copies: {snippet?.stats?.copies || 0}</p>
                    <p>Favorites: {snippet?.stats?.favorites || 0}</p>
                  </div>

                  {isExplaining && (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                      <span className="ml-2 text-indigo-300">Generating explanation...</span>
                    </div>
                  )}

                  {explanationData && (
                    <div className="mt-6 space-y-4">
                      <div className="border-b border-indigo-500/20 pb-4">
                        <h3 className="text-lg font-medium text-indigo-300 mb-2">Summary</h3>
                        <p className="text-indigo-200/80">{explanationData.summary}</p>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-indigo-300">Detailed Explanation</h3>
                        
                        <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-indigo-400 mb-1">Title</h4>
                              <p className="text-indigo-200">{explanationData.details.title}</p>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-indigo-400 mb-1">Analysis</h4>
                              <pre className="whitespace-pre-wrap text-sm text-white font-mono overflow-x-auto">
                                {explanationData.details.content}
                              </pre>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-indigo-400 mb-1">Tags</h4>
                              <div className="flex flex-wrap gap-2">
                                {explanationData.details.tags.map((tag, index) => (
                                  <span 
                                    key={index}
                                    className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30 text-sm"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : ( // Add this fallback
                <div className="flex justify-center items-center h-32">
                  <p className="text-indigo-300">No snippet data available</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-indigo-500/20 bg-indigo-500/5">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleExplainCode}
                  disabled={isExplaining}
                  className={`px-4 py-2 rounded-xl text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 transition-all duration-200 flex items-center gap-2 ${
                    isExplaining ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {isExplaining ? 'Explaining...' : 'Explain'}
                </button>
                <button
                  onClick={handleRunSnippet}
                  className="px-4 py-2 rounded-xl text-indigo-300 hover:text-indigo-200 
                           hover:bg-indigo-500/10 transition-all duration-200 
                           flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" 
                       className="h-5 w-5" 
                       viewBox="0 0 20 20" 
                       fill="currentColor"
                  >
                    <path fillRule="evenodd" 
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" 
                          clipRule="evenodd" 
                    />
                  </svg>
                  Run Snippet
                </button>
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