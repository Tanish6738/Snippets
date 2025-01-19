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
    console.log('EditSnippetDetailsModal props:', {
      isOpen,
      hasSnippet: !!snippet,
      snippetData: snippet
    });

    if (snippet) {
      setFormData({
        title: snippet.title,
        content: snippet.content,
        language: snippet.programmingLanguage,
        tags: snippet.tags,
        visibility: snippet.visibility,
        description: snippet.description
      });
      console.log('Form data set:', formData);
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
      // Validate required fields
      if (!formData.title.trim()) {
        setError('Title is required');
        return;
      }
      if (!formData.content.trim()) {
        setError('Content is required');
        return;
      }
      if (!formData.language.trim()) {
        setError('Programming language is required');
        return;
      }

      // Transform the data to match backend expectations
      const snippetData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        programmingLanguage: formData.language.trim(),
        description: formData.description.trim() || '',
        visibility: formData.visibility,
        tags: formData.tags.filter(Boolean).map(tag => tag.trim())
      };

      const { data } = await axios.patch(`/api/snippets/${snippet._id}`, snippetData);
      onSnippetUpdated(data);
      onClose();
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.error || 'Failed to update snippet');
    }
  };

  if (!isOpen) {
    console.log('EditSnippetDetailsModal not showing because isOpen is false');
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm"></div>
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative max-w-2xl w-full bg-[#0B1120]/95 backdrop-blur-xl rounded-2xl shadow-lg border border-indigo-500/30 overflow-hidden transition-all transform duration-300 ease-in-out hover:border-indigo-400/50 hover:shadow-indigo-500/10">
          <div className="px-6 py-4 border-b border-indigo-500/20">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                Edit Snippet
              </h2>
              <button onClick={onClose} className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200 text-2xl font-semibold">×</button>
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-track-indigo-500/10 scrollbar-thumb-indigo-500/40">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white placeholder-indigo-400/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                    value={formData.title}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-1">Content</label>
                  <textarea
                    name="content"
                    required
                    rows="6"
                    className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white placeholder-indigo-400/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200 font-mono"
                    value={formData.content}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-1">Tags</label>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagInput}
                    className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white placeholder-indigo-400/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                    placeholder="Press Enter to add tags"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.tags.map(tag => (
                      <span key={tag} className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30 text-sm flex items-center">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-indigo-400 hover:text-indigo-300"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Programming Language</label>
                  <input
                    type="text"
                    name="language"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={formData.language}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    rows="3"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Visibility</label>
                  <select
                    name="visibility"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={formData.visibility}
                    onChange={handleChange}
                  >
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                    <option value="shared">Shared</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

          <div className="px-6 py-4 border-t border-indigo-500/20 bg-indigo-500/5">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 rounded-xl text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_25px_rgba(99,102,241,0.35)]"
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