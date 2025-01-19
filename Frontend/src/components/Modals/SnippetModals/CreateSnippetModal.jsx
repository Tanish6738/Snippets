import { useState } from 'react';
import axios from '../../../Config/Axios';

const CreateSnippetModal = ({ isOpen, onClose, onSnippetCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    language: '', // Will be mapped to programmingLanguage
    tags: [],
    visibility: 'private',
    description: ''
  });
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');

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
      // Transform the data to match backend expectations
      const snippetData = {
        title: formData.title.trim(),
        content: formData.content,
        programmingLanguage: formData.language.trim(), // Map language to programmingLanguage
        tags: formData.tags,
        visibility: formData.visibility,
        description: formData.description
      };

      const { data } = await axios.post('/api/snippets', snippetData);
      onSnippetCreated(data);
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        language: '',
        tags: [],
        visibility: 'private',
        description: ''
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create snippet');
      console.error('Snippet creation error:', err.response?.data);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create New Snippet</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              name="title"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Content</label>
            <textarea
              name="content"
              required
              rows="6"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={formData.content}
              onChange={handleChange}
            />
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
            <label className="block text-sm font-medium text-gray-700">Tags</label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagInput}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="Press Enter to add tags"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
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

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Snippet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSnippetModal;