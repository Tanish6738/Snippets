import { useState, useEffect } from 'react';
import axios from '../../../Config/Axios';

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

  useEffect(() => {
    // console.log('EditSnippetDetailsModal props:', {
    //   isOpen,
    //   hasSnippet: !!snippet,
    //   snippetData: snippet
    // });

    if (snippet) {
      setFormData({
        title: snippet.title,
        content: snippet.content,
        language: snippet.programmingLanguage,
        tags: snippet.tags,
        visibility: snippet.visibility,
        description: snippet.description
      });
      // console.log('Form data set:', formData);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
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
    }
  };

  if (!isOpen) {
    // console.log('EditSnippetDetailsModal not showing because isOpen is false');
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"></div>
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative max-w-3xl w-full bg-[#0B1120]/95 backdrop-blur-xl rounded-2xl 
                       shadow-lg border border-indigo-500/30 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-indigo-500/20">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 
                           bg-clip-text text-transparent">
                Edit Snippet
              </h2>
              <button onClick={onClose} className="text-2xl text-indigo-400 
                                                hover:text-indigo-300 transition-colors">×</button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-4 rounded-xl bg-red-500/10 border 
                          border-red-500/50 text-red-300">
              {error}
            </div>
          )}

          {/* Form Content */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto 
                         scrollbar-thin scrollbar-track-indigo-500/10 
                         scrollbar-thumb-indigo-500/40">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border 
                           border-indigo-500/20 text-white placeholder-indigo-400/60 
                           focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 
                           transition-all"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>

              {/* Content Area */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">Content</label>
                <textarea
                  name="content"
                  required
                  rows="6"
                  className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border 
                           border-indigo-500/20 text-white font-mono text-sm 
                           placeholder-indigo-400/60 focus:border-indigo-500 
                           focus:ring-1 focus:ring-indigo-500 transition-all"
                  value={formData.content}
                  onChange={handleChange}
                />
              </div>

              {/* Language Select */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Programming Language
                </label>
                <input
                  type="text"
                  name="language"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border 
                           border-indigo-500/20 text-white placeholder-indigo-400/60 
                           focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 
                           transition-all"
                  value={formData.language}
                  onChange={handleChange}
                />
              </div>

              {/* Tags Input */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">Tags</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagInput}
                    className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border 
                             border-indigo-500/20 text-white placeholder-indigo-400/60 
                             focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 
                             transition-all"
                    placeholder="Press Enter to add tags"
                  />
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-indigo-500/20 
                                               text-indigo-300 border border-indigo-500/30 
                                               text-sm flex items-center">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-indigo-400 hover:text-indigo-300"
                        >×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Visibility Select */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">Visibility</label>
                <select
                  name="visibility"
                  className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border 
                           border-indigo-500/20 text-white focus:border-indigo-500 
                           focus:ring-1 focus:ring-indigo-500 transition-all"
                  value={formData.visibility}
                  onChange={handleChange}
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                  <option value="shared">Shared</option>
                </select>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-indigo-500/20 bg-indigo-500/5">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-indigo-300 hover:text-indigo-200 
                         hover:bg-indigo-500/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 rounded-xl text-white bg-gradient-to-r 
                         from-indigo-500 to-violet-500 hover:from-indigo-600 
                         hover:to-violet-600 transition-all shadow-lg 
                         shadow-indigo-500/25"
              >
                Update Snippet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditSnippetDetailsModal;