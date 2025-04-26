import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiDownload, FiCode, FiCheckSquare, FiSquare, FiBook, FiLoader } from 'react-icons/fi';
import axios from '../../../Config/Axios';

const CheatSheetModal = ({ isOpen, onClose, snippets = [], directories = [] }) => {
  const [formData, setFormData] = useState({
    title: 'Code Cheat Sheet',
    format: 'markdown',
    includeExplanations: true,
    selectedSnippets: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedCheatSheet, setGeneratedCheatSheet] = useState(null);
  const [directorySnippets, setDirectorySnippets] = useState({});
  const [allSnippets, setAllSnippets] = useState([]);
  const [directoryExpanded, setDirectoryExpanded] = useState({});
  
  // Use refs to prevent infinite loops
  const initialized = useRef(false);
  const directorySnippetsLoaded = useRef(false);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      // Initialize once when the modal opens
      if (!initialized.current) {
        initialized.current = true;
        
        setFormData({
          title: 'Code Cheat Sheet',
          format: 'markdown',
          includeExplanations: true,
          selectedSnippets: []
        });
        setGeneratedCheatSheet(null);
        setError('');
        
        // Handle snippets based on whether they come from directories or direct prop
        if (directories && directories.length > 0 && !directorySnippetsLoaded.current) {
          loadDirectorySnippets();
        } else if (snippets?.length > 0) {
          setAllSnippets(snippets);
        }
      }
    } else {
      // Reset initialization state when modal closes
      initialized.current = false;
      directorySnippetsLoaded.current = false;
    }
  }, [isOpen]);
  
  // This is now a standalone function, not a useCallback
  const loadDirectorySnippets = async () => {
    if (directorySnippetsLoaded.current) return;
    
    setLoading(true);
    try {
      const dirSnippets = {};
      for (const dir of directories) {
        try {
          const response = await axios.get(`/api/directories/${dir._id}/snippets`);
          dirSnippets[dir._id] = response.data;
        } catch (err) {
          console.error(`Failed to load snippets for directory ${dir._id}:`, err);
          dirSnippets[dir._id] = [];
        }
      }
      
      setDirectorySnippets(dirSnippets);
      
      // Flatten all snippets for selection
      const allSnips = Object.values(dirSnippets).flat();
      setAllSnippets(allSnips);
      
      // Mark as loaded to prevent future loads
      directorySnippetsLoaded.current = true;
    } catch (err) {
      setError('Failed to load snippets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (formData.selectedSnippets.length === 0) {
      setError('Please select at least one snippet');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Get the full snippet objects for the selected IDs
      const selectedSnippetObjects = allSnippets.filter(
        snippet => formData.selectedSnippets.includes(snippet._id)
      );

      // Call the API to generate the cheat sheet
      const response = await axios.post('/api/ai/generate-cheatsheet', {
        snippets: selectedSnippetObjects,
        title: formData.title,
        format: formData.format,
        includeExplanations: formData.includeExplanations
      });

      if (response.data.success) {
        setGeneratedCheatSheet(response.data.cheatSheet);
      } else {
        setError(response.data.message || 'Failed to generate cheat sheet');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate cheat sheet');
    } finally {
      setLoading(false);
    }
  };

  // Rest of your component code...
  const handleToggleSnippet = (snippetId) => {
    setFormData(prev => {
      const isSelected = prev.selectedSnippets.includes(snippetId);
      
      return {
        ...prev,
        selectedSnippets: isSelected
          ? prev.selectedSnippets.filter(id => id !== snippetId)
          : [...prev.selectedSnippets, snippetId]
      };
    });
  };

  const handleToggleAllSnippets = (checked) => {
    setFormData(prev => ({
      ...prev,
      selectedSnippets: checked ? allSnippets.map(s => s._id) : []
    }));
  };

  const toggleDirectoryExpanded = (dirId) => {
    setDirectoryExpanded(prev => ({
      ...prev,
      [dirId]: !prev[dirId]
    }));
  };

  const handleToggleDirectorySnippets = (dirId, checked) => {
    const dirSnippetIds = (directorySnippets[dirId] || []).map(s => s._id);
    
    setFormData(prev => {
      const remainingSnippets = prev.selectedSnippets.filter(
        id => !dirSnippetIds.includes(id)
      );
      
      return {
        ...prev,
        selectedSnippets: checked 
          ? [...remainingSnippets, ...dirSnippetIds]
          : remainingSnippets
      };
    });
  };

  const downloadCheatSheet = () => {
    if (!generatedCheatSheet) return;
    
    const blob = new Blob([generatedCheatSheet.content], { 
      type: formData.format === 'html' 
        ? 'text/html' 
        : 'text/markdown'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedCheatSheet.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${formData.format === 'html' ? 'html' : 'md'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isDirectorySelected = (dirId) => {
    const dirSnippetIds = (directorySnippets[dirId] || []).map(s => s._id);
    return dirSnippetIds.every(id => formData.selectedSnippets.includes(id));
  };

  const isDirectoryPartiallySelected = (dirId) => {
    const dirSnippetIds = (directorySnippets[dirId] || []).map(s => s._id);
    const someSelected = dirSnippetIds.some(id => formData.selectedSnippets.includes(id));
    const allSelected = dirSnippetIds.every(id => formData.selectedSnippets.includes(id));
    return someSelected && !allSelected;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto pt-16 sm:pt-20">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-sm"></div>
      
      <div className="flex min-h-full items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/40 overflow-hidden transition-all transform duration-300 hover:border-slate-600/70"
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-700/40 bg-gradient-to-r from-slate-800/40 to-slate-900/40">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/40 shadow-lg">
                  <FiBook className="text-slate-300" size={18} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Create Cheat Sheet
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Convert snippets into a downloadable cheat sheet
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  initialized.current = false;
                  directorySnippetsLoaded.current = false;
                  onClose();
                }} 
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

          {/* Main Content */}
          {!generatedCheatSheet ? (
            <div className="p-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-track-slate-900/20 scrollbar-thumb-slate-700/40">
              {loading && !directorySnippetsLoaded.current ? (
                <div className="flex justify-center items-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <FiLoader className="animate-spin text-indigo-500" size={32} />
                    <p className="text-slate-400">Loading snippets...</p>
                  </div>
                </div>
              ) : (
                <form className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1.5">
                      Cheat Sheet Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:border-slate-600 focus:ring-1 focus:ring-slate-500 hover:border-slate-600/70 transition-all duration-200"
                      placeholder="Enter cheat sheet title"
                    />
                  </div>

                  {/* Format & Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Output Format
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { value: 'markdown', label: 'Markdown' },
                          { value: 'html', label: 'HTML' },
                        ].map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, format: value }))}
                            className={`p-3 rounded-xl flex items-center justify-center border ${formData.format === value
                              ? 'border-slate-600 bg-slate-700/70 text-slate-200'
                              : 'border-slate-700/50 hover:border-slate-600/70 text-slate-400 hover:bg-slate-800/60'
                              } transition-all duration-200`}
                          >
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Options
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-700/50 hover:border-slate-600/70 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.includeExplanations}
                            onChange={(e) => setFormData(prev => ({ ...prev, includeExplanations: e.target.checked }))}
                            className="sr-only"
                          />
                          <span className="text-slate-200">
                            {formData.includeExplanations ? (
                              <FiCheckSquare className="text-indigo-400" size={20} />
                            ) : (
                              <FiSquare className="text-slate-400" size={20} />
                            )}
                          </span>
                          <span className="text-slate-300">Include AI-powered explanations</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Snippet Selection */}
                  {allSnippets.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-slate-300">
                          Select Snippets
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-400">
                          <input
                            type="checkbox"
                            checked={formData.selectedSnippets.length === allSnippets.length && allSnippets.length > 0}
                            onChange={(e) => handleToggleAllSnippets(e.target.checked)}
                            className="sr-only"
                          />
                          <span>
                            {formData.selectedSnippets.length === allSnippets.length && allSnippets.length > 0 ? (
                              <FiCheckSquare className="text-indigo-400" size={18} />
                            ) : (
                              <FiSquare className="text-slate-400" size={18} />
                            )}
                          </span>
                          Select All
                        </label>
                      </div>

                      {/* Directory-based snippet selection */}
                      {directories && directories.length > 0 ? (
                        <div className="space-y-4 border border-slate-700/50 rounded-xl p-4 bg-slate-800/30">
                          {directories.map((directory) => (
                            <div key={directory._id} className="space-y-2">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleDirectoryExpanded(directory._id)}
                                  className="text-slate-400"
                                >
                                  {directoryExpanded[directory._id] ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  )}
                                </button>

                                <label className="flex-1 flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox" 
                                    checked={isDirectorySelected(directory._id)}
                                    onChange={(e) => handleToggleDirectorySnippets(directory._id, e.target.checked)}
                                    className="sr-only"
                                  />
                                  <span>
                                    {isDirectorySelected(directory._id) ? (
                                      <FiCheckSquare className="text-indigo-400" size={18} />
                                    ) : isDirectoryPartiallySelected(directory._id) ? (
                                      <div className="w-[18px] h-[18px] border-2 border-indigo-400 flex items-center justify-center">
                                        <div className="w-2 h-2 bg-indigo-400"></div>
                                      </div>
                                    ) : (
                                      <FiSquare className="text-slate-400" size={18} />
                                    )}
                                  </span>
                                  <div className="flex items-center gap-2 text-slate-200">
                                    <FiCode size={16} />
                                    <span>{directory.name}</span>
                                    <span className="text-xs text-slate-400">
                                      ({(directorySnippets[directory._id] || []).length})
                                    </span>
                                  </div>
                                </label>
                              </div>

                              {directoryExpanded[directory._id] && (
                                <div className="pl-8 space-y-2">
                                  {(directorySnippets[directory._id] || []).map(snippet => (
                                    <label key={snippet._id} className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={formData.selectedSnippets.includes(snippet._id)}
                                        onChange={() => handleToggleSnippet(snippet._id)}
                                        className="sr-only"
                                      />
                                      <span>
                                        {formData.selectedSnippets.includes(snippet._id) ? (
                                          <FiCheckSquare className="text-indigo-400" size={18} />
                                        ) : (
                                          <FiSquare className="text-slate-400" size={18} />
                                        )}
                                      </span>
                                      <span className="text-slate-300">
                                        {snippet.title}
                                      </span>
                                      <span className="text-xs px-2 py-0.5 bg-slate-700/70 text-slate-400 rounded-full">
                                        {snippet.programmingLanguage}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* List snippets directly if not organized by directories */
                        <div className="space-y-2 max-h-[300px] overflow-y-auto border border-slate-700/50 rounded-xl p-4 bg-slate-800/30">
                          {allSnippets.map(snippet => (
                            <label key={snippet._id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.selectedSnippets.includes(snippet._id)}
                                onChange={() => handleToggleSnippet(snippet._id)}
                                className="sr-only"
                              />
                              <span>
                                {formData.selectedSnippets.includes(snippet._id) ? (
                                  <FiCheckSquare className="text-indigo-400" size={18} />
                                ) : (
                                  <FiSquare className="text-slate-400" size={18} />
                                )}
                              </span>
                              <span className="text-slate-300">
                                {snippet.title}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-slate-700/70 text-slate-400 rounded-full">
                                {snippet.programmingLanguage}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}

                      <div className="mt-2 text-sm text-slate-400">
                        {formData.selectedSnippets.length} snippets selected
                      </div>
                    </div>
                  )}

                  {allSnippets.length === 0 && !loading && (
                    <div className="text-center py-8 text-slate-400">
                      No snippets available
                    </div>
                  )}
                </form>
              )}
            </div>
          ) : (
            /* Show generated cheat sheet preview */
            <div className="p-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-track-slate-900/20 scrollbar-thumb-slate-700/40">
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden">
                <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FiBook className="text-slate-300" size={18} />
                    {generatedCheatSheet.title}
                  </h3>
                </div>
                <pre className="p-4 whitespace-pre-wrap text-slate-300 font-mono text-sm overflow-x-auto">
                  {generatedCheatSheet.content.substring(0, 1000)}
                  {generatedCheatSheet.content.length > 1000 && '...'}
                </pre>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-700/40 bg-slate-800/20 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                initialized.current = false;
                directorySnippetsLoaded.current = false;
                onClose();
              }}
              className="px-4 py-2 rounded-lg text-slate-300 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-200"
            >
              Cancel
            </button>
            {!generatedCheatSheet ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={loading || formData.selectedSnippets.length === 0}
                className="px-5 py-2 rounded-lg text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 
                border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 shadow-md shadow-slate-900/30 
                disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <FiLoader className="animate-spin" size={16} />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <FiBook size={16} />
                    <span>Generate Cheat Sheet</span>
                  </>
                )}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={downloadCheatSheet}
                className="px-5 py-2 rounded-lg text-white bg-gradient-to-r from-indigo-700 to-indigo-800 hover:from-indigo-600 hover:to-indigo-700 
                border border-indigo-600/30 hover:border-indigo-500/50 transition-all duration-300 shadow-md shadow-slate-900/30 
                flex items-center gap-2"
              >
                <FiDownload size={16} />
                <span>Download Cheat Sheet</span>
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CheatSheetModal;