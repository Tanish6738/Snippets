import { useEffect, useState } from 'react';
import { useUser } from '../../../Context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from '../../../Config/Axios';
import { FiCode, FiAlignLeft, FiTag, FiEye, FiX, FiEdit, 
         FiDownload, FiExternalLink, FiPlay, FiInfo, 
         FiCopy, FiGlobe, FiLock, FiShare2, FiRefreshCw, FiFileText } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import EditSnippetDetailsModal from './EditSnippetDetailsModal';
import ExportSnippetModal from './ExportSnippetModal';
import ConvertCodeModal from './ConvertCodeModal';
import DocumentationModal from './DocumentationModal';

const ViewSnippetModal = ({ isOpen, onClose, snippetId, onEdit = null }) => {
  const navigate = useNavigate();
  const [snippet, setSnippet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useUser();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showDocumentationModal, setShowDocumentationModal] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [explanationData, setExplanationData] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(true); // Control visibility of the view modal

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

  // Update state when convert modal is opened or closed
  useEffect(() => {
    if (showConvertModal) {
      setViewModalVisible(false);
    } else {
      setViewModalVisible(true);
    }
  }, [showConvertModal]);

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

  const getVisibilityIcon = (visibility) => {
    switch (visibility) {
      case 'private': return <FiLock size={16} />;
      case 'public': return <FiGlobe size={16} />;
      case 'shared': return <FiShare2 size={16} />;
      default: return <FiLock size={16} />;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {viewModalVisible && (
        <div className="fixed inset-0 z-[60] overflow-y-auto pt-16 sm:pt-20">
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm"></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-4xl w-full bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/40 overflow-hidden transition-all transform duration-300 hover:border-slate-600/70"
            >
              {/* Header */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-700/40 bg-gradient-to-r from-slate-800/40 to-slate-900/40">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/40 shadow-lg">
                      <FiCode className="text-slate-300" size={18} />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-[250px] sm:max-w-md">
                        {snippet?.title || 'Loading...'}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        {snippet && (
                          <>
                            <span className="flex items-center gap-1">
                              {getVisibilityIcon(snippet?.visibility)}
                              <span className="capitalize">{snippet?.visibility}</span>
                            </span>
                            <span>•</span>
                            <span>{snippet?.programmingLanguage}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={onClose} 
                    className="text-slate-400 hover:text-slate-300 transition-colors duration-200 p-2 rounded-full hover:bg-slate-800/70"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              </div>

              {/* Error Display */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mx-6 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-300 flex items-start gap-2 text-sm"
                  >
                    <FiX className="mt-0.5" />
                    <p>{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto 
                scrollbar-thin scrollbar-track-slate-900/20 
                scrollbar-thumb-slate-700/40 
                hover:scrollbar-thumb-slate-700/60
                scrollbar-thumb-rounded-full
                scrollbar-track-rounded-full">
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500"></div>
                  </div>
                ) : snippet ? (
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1.5">
                        <FiAlignLeft size={15} />
                        Description
                      </h3>
                      <div className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300">
                        {snippet?.description || 'No description provided'}
                      </div>
                    </div>

                    {/* Code */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <h3 className="flex items-center gap-2 text-sm font-medium text-slate-300">
                          <FiCode size={15} />
                          Code
                        </h3>
                        <button
                          onClick={handleCopyCode}
                          className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm text-slate-400 hover:text-slate-300 hover:bg-slate-800/70 transition-all duration-200"
                        >
                          {copyStatus ? (
                            <span className="text-green-400">{copyStatus}</span>
                          ) : (
                            <>
                              <FiCopy size={14} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="relative group">
                        <pre className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-x-auto">
                          <code className="font-mono text-sm text-slate-300">
                            {snippet?.content || ''}
                          </code>
                        </pre>
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1.5">
                        <FiTag size={15} />
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {snippet?.tags?.map(tag => (
                          <span 
                            key={tag} 
                            className="px-3 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/50 text-sm"
                          >
                            {tag}
                          </span>
                        )) || <span className="text-sm text-slate-500 italic">No tags</span>}
                      </div>
                    </div>

                    {/* Metadata grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div>
                          <h3 className="text-xs font-medium text-slate-400 mb-1">Language</h3>
                          <p className="text-sm text-slate-300">{snippet?.programmingLanguage || 'Not specified'}</p>
                        </div>
                        <div>
                          <h3 className="text-xs font-medium text-slate-400 mb-1">Visibility</h3>
                          <div className="flex items-center gap-1.5">
                            {getVisibilityIcon(snippet?.visibility)}
                            <p className="text-sm text-slate-300 capitalize">{snippet?.visibility || 'private'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <h3 className="text-xs font-medium text-slate-400 mb-1">Created</h3>
                          <p className="text-sm text-slate-300">
                            {snippet?.createdAt ? new Date(snippet.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-xs font-medium text-slate-400 mb-1">Last Updated</h3>
                          <p className="text-sm text-slate-300">
                            {snippet?.updatedAt ? new Date(snippet.updatedAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-2">
                      <div className="px-4 py-3 rounded-xl bg-slate-800/30 border border-slate-700/40 flex flex-col items-center justify-center">
                        <FiEye className="text-slate-400 mb-1" size={16} />
                        <p className="text-xl font-medium text-slate-300">{snippet?.stats?.views || 0}</p>
                        <p className="text-xs text-slate-400">Views</p>
                      </div>
                      <div className="px-4 py-3 rounded-xl bg-slate-800/30 border border-slate-700/40 flex flex-col items-center justify-center">
                        <FiCopy className="text-slate-400 mb-1" size={16} />
                        <p className="text-xl font-medium text-slate-300">{snippet?.stats?.copies || 0}</p>
                        <p className="text-xs text-slate-400">Copies</p>
                      </div>
                      <div className="px-4 py-3 rounded-xl bg-slate-800/30 border border-slate-700/40 flex flex-col items-center justify-center">
                        <FiEye className="text-slate-400 mb-1" size={16} />
                        <p className="text-xl font-medium text-slate-300">{snippet?.stats?.favorites || 0}</p>
                        <p className="text-xs text-slate-400">Favorites</p>
                      </div>
                    </div>

                    {/* AI Explanation Section */}
                    {isExplaining && (
                      <div className="mt-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700/40 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-500"></div>
                        <span className="ml-2 text-slate-300">Generating explanation...</span>
                      </div>
                    )}

                    {explanationData && (
                      <div className="mt-4 space-y-4">
                        <h3 className="flex items-center gap-2 font-medium text-slate-200 border-b border-slate-700/40 pb-2">
                          <FiInfo size={16} />
                          AI Explanation
                        </h3>
                        
                        <div className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300">
                          <h4 className="text-sm font-medium text-slate-200 mb-2">Summary</h4>
                          <p className="text-sm">{explanationData.summary}</p>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-slate-200">Detailed Explanation</h4>
                          
                          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                            <div className="space-y-3">
                              <div>
                                <h4 className="text-xs font-medium text-slate-400 mb-1">Title</h4>
                                <p className="text-sm text-slate-300">{explanationData.details.title}</p>
                              </div>

                              <div>
                                <h4 className="text-xs font-medium text-slate-400 mb-1">Analysis</h4>
                                <pre className="whitespace-pre-wrap text-sm text-slate-300 font-mono">
                                  {explanationData.details.content}
                                </pre>
                              </div>

                              <div>
                                <h4 className="text-xs font-medium text-slate-400 mb-1">Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                  {explanationData.details.tags.map((tag, index) => (
                                    <span 
                                      key={index}
                                      className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/50 text-xs"
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
                ) : (
                  <div className="flex justify-center items-center h-32">
                    <p className="text-slate-400">No snippet data available</p>
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-700/40 bg-slate-800/20 flex justify-end flex-wrap gap-2">
                <button
                  onClick={handleExplainCode}
                  disabled={isExplaining}
                  className={`px-3 py-2 rounded-lg text-slate-300 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-200 flex items-center gap-2 ${
                    isExplaining ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <FiInfo size={16} />
                  {isExplaining ? 'Explaining...' : 'Explain'}
                </button>
                <button
                  onClick={() => setShowDocumentationModal(true)}
                  className="px-3 py-2 rounded-lg text-slate-300 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-200 flex items-center gap-2"
                >
                  <FiFileText size={16} />
                  Document
                </button>
                <button
                  onClick={() => setShowConvertModal(true)}
                  className="px-3 py-2 rounded-lg text-slate-300 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-200 flex items-center gap-2"
                >
                  <FiRefreshCw size={16} />
                  Convert
                </button>
                <button
                  onClick={handleRunSnippet}
                  className="px-3 py-2 rounded-lg text-slate-300 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-200 flex items-center gap-2"
                >
                  <FiPlay size={16} />
                  Run
                </button>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="px-3 py-2 rounded-lg text-slate-300 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-200 flex items-center gap-2"
                >
                  <FiDownload size={16} />
                  Export
                </button>
                <button
                  onClick={onClose}
                  className="px-3 py-2 rounded-lg text-slate-300 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-200 flex items-center gap-2"
                >
                  <FiX size={16} />
                  Close
                </button>
                {user && snippet && user._id === (snippet.createdBy?._id || snippet.createdBy) && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 shadow-md shadow-slate-900/30 flex items-center gap-2"
                  >
                    <FiEdit size={16} />
                    Edit
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}

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

      <ConvertCodeModal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        snippet={snippet}
        onSnippetUpdated={(updatedSnippet) => {
          // Optionally handle the newly created converted snippet
          // For example, you could refresh the snippet list
          // This callback gets triggered when a new snippet is created from a conversion
        }}
      />

      <DocumentationModal
        isOpen={showDocumentationModal}
        onClose={() => setShowDocumentationModal(false)}
        snippet={snippet}
      />
    </>
  );
};

export default ViewSnippetModal;