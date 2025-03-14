import { useState } from 'react';
import axios from '../../../Config/Axios';
import { FiCode, FiPlusCircle, FiTrash2, FiSave, FiGrid, FiTag, FiLock, FiEye, FiGlobe, FiShare2, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const BulkCreateSnippetModal = ({ isOpen, onClose, onSnippetsCreated }) => {
  const [snippets, setSnippets] = useState([{
    title: '',
    content: '',
    programmingLanguage: '',
    tags: [],
    visibility: 'private',
    description: ''
  }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tagInputs, setTagInputs] = useState(['']);
  const [activeSnippetIndex, setActiveSnippetIndex] = useState(0);

  const handleChange = (index, field, value) => {
    const newSnippets = [...snippets];
    newSnippets[index] = { ...newSnippets[index], [field]: value };
    setSnippets(newSnippets);
  };

  const handleTagInput = (index, e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newSnippets = [...snippets];
      const newTag = e.target.value.trim();
      if (!newSnippets[index].tags.includes(newTag)) {
        newSnippets[index].tags = [...newSnippets[index].tags, newTag];
        setSnippets(newSnippets);
      }
      const newTagInputs = [...tagInputs];
      newTagInputs[index] = '';
      setTagInputs(newTagInputs);
    }
  };

  const removeTag = (snippetIndex, tagToRemove) => {
    const newSnippets = [...snippets];
    newSnippets[snippetIndex].tags = newSnippets[snippetIndex].tags.filter(tag => tag !== tagToRemove);
    setSnippets(newSnippets);
  };

  const addSnippet = () => {
    const newSnippet = {
      title: '',
      content: '',
      programmingLanguage: '',
      tags: [],
      visibility: 'private',
      description: ''
    };
    setSnippets([...snippets, newSnippet]);
    setTagInputs([...tagInputs, '']);
    setActiveSnippetIndex(snippets.length);
  };

  const removeSnippet = (index) => {
    const newSnippets = snippets.filter((_, i) => i !== index);
    const newTagInputs = tagInputs.filter((_, i) => i !== index);
    setSnippets(newSnippets);
    setTagInputs(newTagInputs);
    
    // Adjust active snippet index if needed
    if (activeSnippetIndex >= newSnippets.length) {
      setActiveSnippetIndex(Math.max(0, newSnippets.length - 1));
    } else if (activeSnippetIndex === index) {
      setActiveSnippetIndex(Math.max(0, activeSnippetIndex - 1));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate snippets
      const invalidSnippets = snippets.filter(
        snippet => !snippet.title.trim() || !snippet.content.trim() || !snippet.programmingLanguage.trim()
      );
      
      if (invalidSnippets.length > 0) {
        const missingFields = [];
        if (invalidSnippets.some(s => !s.title.trim())) missingFields.push('title');
        if (invalidSnippets.some(s => !s.content.trim())) missingFields.push('content');
        if (invalidSnippets.some(s => !s.programmingLanguage.trim())) missingFields.push('programming language');
        
        throw new Error(`Please fill in all required fields (${missingFields.join(', ')}) for all snippets.`);
      }

      const formattedSnippets = snippets.map(snippet => ({
        title: snippet.title.trim(),
        content: snippet.content.trim(),
        programmingLanguage: snippet.programmingLanguage.trim(),
        description: snippet.description?.trim() || '',
        visibility: snippet.visibility,
        tags: snippet.tags.filter(Boolean),
        commentsEnabled: true
      }));

      const { data } = await axios.post('/api/snippets/bulk', { 
        snippets: formattedSnippets 
      });

      await axios.post('/api/activities', {
        action: 'create',
        targetType: 'snippet',
        targetId: data[0]._id,
        metadata: { 
          count: data.length,
          snippetIds: data.map(s => s._id),
          operation: 'bulk_create',
          snippetTitles: data.map(s => s.title)
        }
      });

      onSnippetsCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create snippets');
    } finally {
      setLoading(false);
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

  const getLanguageColor = (language) => {
    const colors = {
      javascript: 'from-yellow-600/20 to-yellow-500/10 border-yellow-600/30',
      python: 'from-blue-600/20 to-blue-500/10 border-blue-600/30',
      html: 'from-orange-600/20 to-orange-500/10 border-orange-600/30',
      css: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30',
      java: 'from-red-600/20 to-red-500/10 border-red-600/30',
      typescript: 'from-blue-600/20 to-blue-400/10 border-blue-400/30',
      php: 'from-purple-600/20 to-purple-500/10 border-purple-600/30',
      ruby: 'from-red-700/20 to-red-600/10 border-red-700/30',
      swift: 'from-orange-600/20 to-orange-500/10 border-orange-600/30',
      kotlin: 'from-purple-600/20 to-purple-400/10 border-purple-500/30',
      go: 'from-blue-500/20 to-blue-400/10 border-blue-500/30',
      rust: 'from-orange-700/20 to-orange-600/10 border-orange-700/30',
      // Add more language-specific colors as needed
    };
    
    const lang = language.toLowerCase();
    return colors[lang] || 'from-slate-600/20 to-slate-500/10 border-slate-600/30';
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
                  <FiGrid className="text-indigo-300" size={18} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Bulk Create Snippets
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Create multiple code snippets at once
                  </p>
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

          {/* Body */}
          <div className="flex flex-col md:flex-row h-[60vh] sm:h-[50vh] overflow-hidden">
            {/* Snippet Sidebar */}
            <div className="w-full md:w-64 h-48 md:h-auto border-b md:border-b-0 md:border-r border-slate-700/30 bg-slate-900/20 p-2 sm:p-3 overflow-y-auto styled-scrollbar">
              <div className="mb-2 sm:mb-3">
                <button
                  onClick={addSnippet}
                  className="w-full py-1.5 sm:py-2 rounded-xl text-slate-300 bg-gradient-to-r from-indigo-900/50 to-purple-900/30 hover:from-indigo-800/50 hover:to-purple-800/30 border border-indigo-600/30 hover:border-indigo-500/50 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
                >
                  <FiPlusCircle size={15} />
                  <span className="text-sm">Add Snippet</span>
                </button>
              </div>

              {/* Snippet List */}
              <div className="space-y-1.5">
                {snippets.map((snippet, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`relative p-2 sm:p-2.5 rounded-xl cursor-pointer group transition-all duration-200 ${
                      activeSnippetIndex === index 
                      ? 'bg-gradient-to-r from-indigo-900/30 to-slate-800/50 border border-indigo-500/40' 
                      : 'hover:bg-slate-800/40 border border-slate-700/40 hover:border-slate-600/40'
                    }`}
                    onClick={() => setActiveSnippetIndex(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${getLanguageColor(snippet.programmingLanguage)} border`}>
                          <FiCode size={10} className="text-slate-300" />
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="font-medium text-xs sm:text-sm text-slate-300 truncate">
                            {snippet.title || `Snippet ${index + 1}`}
                          </h3>
                          <div className="flex items-center text-xs text-slate-400 mt-0.5">
                            {snippet.programmingLanguage && (
                              <span className="truncate text-xs">{snippet.programmingLanguage}</span>
                            )}
                            {!snippet.programmingLanguage && (
                              <span className="italic text-slate-500 text-xs">No language</span>
                            )}
                            <span className="mx-1">•</span>
                            <span className="flex items-center gap-1">
                              {getVisibilityIcon(snippet.visibility)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {snippets.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSnippet(index);
                          }}
                          className="text-slate-500 hover:text-red-400 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>
                    
                    {snippet.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {snippet.tags.slice(0, 2).map((tag, tagIndex) => (
                          <span 
                            key={tagIndex} 
                            className="px-1.5 py-0.5 text-xs rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/40"
                          >
                            {tag}
                          </span>
                        ))}
                        {snippet.tags.length > 2 && (
                          <span className="text-xs text-slate-500">
                            +{snippet.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Main Form Area */}
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto styled-scrollbar">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3 sm:mb-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/50 text-red-300 flex items-start gap-2 text-sm"
                >
                  <FiX className="mt-0.5" />
                  <p>{error}</p>
                </motion.div>
              )}
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSnippetIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3 sm:space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700/30">
                    <h3 className="text-sm sm:text-base font-medium text-white">
                      {snippets[activeSnippetIndex].title ? 
                        snippets[activeSnippetIndex].title : 
                        `Snippet ${activeSnippetIndex + 1}`}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="px-2 py-1 rounded-full bg-slate-800/70 border border-slate-700/50">
                        {activeSnippetIndex + 1} / {snippets.length}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                      Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter a descriptive title"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 
                      focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200 text-sm"
                      value={snippets[activeSnippetIndex].title}
                      onChange={(e) => handleChange(activeSnippetIndex, 'title', e.target.value)}
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                      Content <span className="text-red-400">*</span>
                    </label>
                    <div className="relative group">
                      <textarea
                        rows="3"
                        placeholder="// Your code goes here..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white font-mono placeholder-slate-500 
                        focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200 text-sm"
                        value={snippets[activeSnippetIndex].content}
                        onChange={(e) => handleChange(activeSnippetIndex, 'content', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Two-column layout for smaller fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Programming Language */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                        Programming Language <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., JavaScript, Python"
                        className="w-full px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 
                        focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200 text-sm"
                        value={snippets[activeSnippetIndex].programmingLanguage}
                        onChange={(e) => handleChange(activeSnippetIndex, 'programmingLanguage', e.target.value)}
                      />
                    </div>

                    {/* Visibility */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">Visibility</label>
                      <div className="relative">
                        <select
                          className="w-full px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 
                          focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200 appearance-none text-sm"
                          value={snippets[activeSnippetIndex].visibility}
                          onChange={(e) => handleChange(activeSnippetIndex, 'visibility', e.target.value)}
                        >
                          <option value="private">Private</option>
                          <option value="public">Public</option>
                          <option value="shared">Shared</option>
                        </select>
                        <div className="absolute right-3 top-2.5 pointer-events-none">
                          {getVisibilityIcon(snippets[activeSnippetIndex].visibility)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                      <FiTag size={14} /> Tags
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Press Enter to add tags"
                        className="w-full px-3 py-2 pl-8 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 
                        focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200 text-sm"
                        value={tagInputs[activeSnippetIndex] || ''}
                        onChange={(e) => {
                          const newTagInputs = [...tagInputs];
                          newTagInputs[activeSnippetIndex] = e.target.value;
                          setTagInputs(newTagInputs);
                        }}
                        onKeyPress={(e) => handleTagInput(activeSnippetIndex, e)}
                      />
                      <FiTag className="absolute left-3 top-2.5 text-slate-500" />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <AnimatePresence>
                        {snippets[activeSnippetIndex].tags.map((tag, tagIndex) => (
                          <motion.span
                            key={tag}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.15 }}
                            className="group px-2 py-1 rounded-full text-xs bg-gradient-to-r from-slate-800 to-slate-800/80 text-slate-300 border border-slate-700/50 flex items-center gap-1.5"
                          >
                            {tag}
                            <button
                              onClick={() => removeTag(activeSnippetIndex, tag)}
                              className="text-slate-400 hover:text-red-400 transition-colors duration-200"
                            >
                              <FiX size={12} />
                            </button>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                      {snippets[activeSnippetIndex].tags.length === 0 && (
                        <span className="text-xs sm:text-sm text-slate-500 italic">No tags added yet</span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">Description</label>
                    <textarea
                      rows="2"
                      placeholder="Add a brief description (optional)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 
                      focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200 text-sm"
                      value={snippets[activeSnippetIndex].description}
                      onChange={(e) => handleChange(activeSnippetIndex, 'description', e.target.value)}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-4 sm:px-5 py-3 border-t border-slate-700/40 bg-slate-900/50 flex justify-between items-center">
            <div className="text-xs text-slate-400">
              <span className="font-medium text-indigo-400">{snippets.length}</span> snippet{snippets.length !== 1 ? 's' : ''} ready to create
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-200 text-sm"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={loading}
                className="px-3 sm:px-4 py-1.5 rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 
                border border-indigo-500/50 transition-all duration-300 shadow-md shadow-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <FiSave size={15} />
                    <span>Create All</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BulkCreateSnippetModal;