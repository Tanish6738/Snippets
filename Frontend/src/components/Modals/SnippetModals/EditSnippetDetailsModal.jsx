import { useState, useEffect } from 'react';
import axios from '../../../Config/Axios';
import { FiCode, FiType, FiAlignLeft, FiTag, FiEye, FiX, FiSave, FiLock, FiGlobe, FiShare2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const EditSnippetDetailsModal = ({ isOpen, onClose, snippet, onSnippetUpdated }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    language: '',
    tags: [],
    visibility: 'private',
    description: ''
  });
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (snippet) {
      setFormData({
        title: snippet.title,
        content: snippet.content,
        language: snippet.programmingLanguage,
        tags: snippet.tags,
        visibility: snippet.visibility,
        description: snippet.description
      });
    }
  }, [snippet]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagInput = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getVisibilityIcon = () => {
    switch (formData.visibility) {
      case 'private': return <FiLock size={16} />;
      case 'public': return <FiGlobe size={16} />;
      case 'shared': return <FiShare2 size={16} />;
      default: return <FiLock size={16} />;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Validate required fields
      if (!formData.title.trim()) {
        setError('Title is required');
        setIsSubmitting(false);
        return;
      }
      if (!formData.content.trim()) {
        setError('Content is required');
        setIsSubmitting(false);
        return;
      }
      if (!formData.language.trim()) {
        setError('Programming language is required');
        setIsSubmitting(false);
        return;
      }
      
      const snippetData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        programmingLanguage: formData.language.trim(),
        description: formData.description.trim(),
        visibility: formData.visibility,
        tags: formData.tags.filter(Boolean),
        commentsEnabled: formData.commentsEnabled
      };

      const { data } = await axios.patch(`/api/snippets/${snippet._id}`, snippetData);
      
      // Track activity
      await axios.post('/api/activities', {
        action: 'edit',
        targetType: 'snippet',
        targetId: snippet._id
      });

      onSnippetUpdated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update snippet');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto pt-16 sm:pt-20">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-sm"></div>
      
      <div className="flex min-h-full items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative max-w-2xl w-full bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/40 overflow-hidden transition-all transform duration-300 hover:border-slate-600/70"
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-700/40 bg-gradient-to-r from-slate-800/40 to-slate-900/40">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/40 shadow-lg">
                  <FiCode className="text-slate-300" size={18} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Edit Snippet
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Update your snippet details
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

          {/* Form Content */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto 
            scrollbar-thin scrollbar-track-slate-900/20 
            scrollbar-thumb-slate-700/40 
            hover:scrollbar-thumb-slate-700/60
            scrollbar-thumb-rounded-full
            scrollbar-track-rounded-full">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1.5">
                  <FiType size={15} />
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 
                  focus:border-slate-600 focus:ring-1 focus:ring-slate-500 hover:border-slate-600/70 transition-all duration-200"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter a descriptive title"
                />
              </div>

              {/* Content */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1.5">
                  <FiCode size={15} />
                  Content <span className="text-red-400">*</span>
                </label>
                <div className="relative group">
                  <textarea
                    name="content"
                    required
                    rows="6"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white font-mono text-sm 
                    placeholder-slate-500 focus:border-slate-600 focus:ring-1 focus:ring-slate-500 hover:border-slate-600/70 transition-all duration-200"
                    value={formData.content}
                    onChange={handleChange}
                    placeholder="// Your code goes here..."
                  />
                </div>
              </div>

              {/* Two-column layout for smaller fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Language */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1.5">
                    <FiCode size={15} />
                    Programming Language <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="language"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 
                    focus:border-slate-600 focus:ring-1 focus:ring-slate-500 hover:border-slate-600/70 transition-all duration-200"
                    value={formData.language}
                    onChange={handleChange}
                    placeholder="e.g., JavaScript, Python"
                  />
                </div>

                {/* Visibility */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1.5">
                    <FiEye size={15} />
                    Visibility
                  </label>
                  <div className="relative">
                    <select
                      name="visibility"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white 
                      focus:border-slate-600 focus:ring-1 focus:ring-slate-500 hover:border-slate-600/70 appearance-none transition-all duration-200"
                      value={formData.visibility}
                      onChange={handleChange}
                    >
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                      <option value="shared">Shared</option>
                    </select>
                    <div className="absolute left-3.5 top-3.5 text-slate-400">
                      {getVisibilityIcon()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1.5">
                  <FiTag size={15} />
                  Tags
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagInput}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 
                    focus:border-slate-600 focus:ring-1 focus:ring-slate-500 hover:border-slate-600/70 transition-all duration-200"
                    placeholder="Press Enter to add tags"
                  />
                  <FiTag className="absolute left-3.5 top-3.5 text-slate-500" />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <AnimatePresence>
                    {formData.tags.map(tag => (
                      <motion.span 
                        key={tag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className="group px-2.5 py-1 rounded-full text-xs bg-slate-800/80 text-slate-300 border border-slate-700/50 flex items-center gap-1.5"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <FiX size={12} />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                  {formData.tags.length === 0 && (
                    <span className="text-xs text-slate-500 italic">No tags added yet</span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1.5">
                  <FiAlignLeft size={15} />
                  Description
                </label>
                <textarea
                  name="description"
                  rows="3"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 
                  focus:border-slate-600 focus:ring-1 focus:ring-slate-500 hover:border-slate-600/70 transition-all duration-200"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Add a brief description (optional)"
                />
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-700/40 bg-slate-800/20 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-300 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-200"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 
              border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 shadow-md shadow-slate-900/30 
              disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <FiSave size={16} />
                  <span>Update Snippet</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EditSnippetDetailsModal;