import { useState } from 'react';
import axios from '../../../Config/Axios';

const BulkCreateSnippetModal = ({ isOpen, onClose, onSnippetsCreated }) => {
  const [snippets, setSnippets] = useState([{
    title: '',
    content: '',
    programmingLanguage: '', // Changed from 'language'
    tags: [],
    visibility: 'private',
    description: ''
  }]);
  const [error, setError] = useState('');
  const [tagInputs, setTagInputs] = useState(['']);

  const handleChange = (index, field, value) => {
    const newSnippets = [...snippets];
    // Special handling for programming language
    if (field === 'language') {
      newSnippets[index] = { 
        ...newSnippets[index], 
        programmingLanguage: value  // Store as programmingLanguage
      };
    } else {
      newSnippets[index] = { 
        ...newSnippets[index], 
        [field]: value 
      };
    }
    setSnippets(newSnippets);
  };

  const handleTagInput = (index, e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newSnippets = [...snippets];
      if (!newSnippets[index].tags.includes(e.target.value.trim())) {
        newSnippets[index].tags = [...newSnippets[index].tags, e.target.value.trim()];
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
    setSnippets([...snippets, {
      title: '',
      content: '',
      programmingLanguage: '', // Changed from 'language'
      tags: [],
      visibility: 'private',
      description: ''
    }]);
    setTagInputs([...tagInputs, '']);
  };

  const removeSnippet = (index) => {
    const newSnippets = snippets.filter((_, i) => i !== index);
    const newTagInputs = tagInputs.filter((_, i) => i !== index);
    setSnippets(newSnippets);
    setTagInputs(newTagInputs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Format snippets before sending
      const formattedSnippets = snippets.map(snippet => ({
        title: snippet.title,
        content: snippet.content,
        programmingLanguage: snippet.programmingLanguage,
        tags: snippet.tags,
        visibility: snippet.visibility,
        description: snippet.description
      }));

      const { data } = await axios.post('/api/snippets/bulk', { 
        snippets: formattedSnippets 
      });
      onSnippetsCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create snippets');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Bulk Create Snippets</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {snippets.map((snippet, index) => (
            <div key={index} className="border p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Snippet {index + 1}</h3>
                {snippets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSnippet(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Title"
                    className="w-full border rounded p-2"
                    value={snippet.title}
                    onChange={(e) => handleChange(index, 'title', e.target.value)}
                  />
                </div>

                <div>
                  <textarea
                    required
                    rows="4"
                    placeholder="Content"
                    className="w-full border rounded p-2 font-mono"
                    value={snippet.content}
                    onChange={(e) => handleChange(index, 'content', e.target.value)}
                  />
                </div>

                <div>
                  <input
                    type="text"
                    required
                    placeholder="Programming Language"
                    className="w-full border rounded p-2"
                    value={snippet.programmingLanguage} // Changed from snippet.language
                    onChange={(e) => handleChange(index, 'language', e.target.value)}
                  />
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Add tags (press Enter)"
                    className="w-full border rounded p-2"
                    value={tagInputs[index]}
                    onChange={(e) => {
                      const newTagInputs = [...tagInputs];
                      newTagInputs[index] = e.target.value;
                      setTagInputs(newTagInputs);
                    }}
                    onKeyPress={(e) => handleTagInput(index, e)}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {snippet.tags.map(tag => (
                      <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(index, tag)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <select
                    className="w-full border rounded p-2"
                    value={snippet.visibility}
                    onChange={(e) => handleChange(index, 'visibility', e.target.value)}
                  >
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                    <option value="shared">Shared</option>
                  </select>
                </div>

                <div>
                  <textarea
                    placeholder="Description"
                    rows="2"
                    className="w-full border rounded p-2"
                    value={snippet.description}
                    onChange={(e) => handleChange(index, 'description', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-center">
            <button
              type="button"
              onClick={addSnippet}
              className="text-blue-600 hover:text-blue-800"
            >
              + Add Another Snippet
            </button>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Snippets
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkCreateSnippetModal;