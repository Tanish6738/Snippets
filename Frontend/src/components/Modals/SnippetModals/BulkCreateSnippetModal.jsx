import { useState } from 'react';
import axios from '../../../Config/Axios';

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
    setSnippets([...snippets, {
      title: '',
      content: '',
      programmingLanguage: '',
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
    setLoading(true);
    setError('');

    try {
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
      setError(err.response?.data?.error || 'Failed to create snippets');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm"></div>
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative max-w-4xl w-full bg-[#0B1120]/95 backdrop-blur-xl rounded-2xl shadow-lg border border-indigo-500/30 overflow-hidden transition-all transform duration-300 ease-in-out hover:border-indigo-400/50 hover:shadow-indigo-500/10">
          <div className="px-6 py-4 border-b border-indigo-500/20">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                Bulk Create Snippets
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
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl">
                    {error}
                  </div>
                )}

                {snippets.map((snippet, index) => (
                  <div key={index} className="p-6 rounded-xl bg-indigo-500/5 border border-indigo-500/20 hover:border-indigo-400/30 transition-all duration-300">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-indigo-300">Snippet {index + 1}</h3>
                      {snippets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSnippet(index)}
                          className="text-red-400 hover:text-red-300 transition-colors duration-200"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <input
                        type="text"
                        required
                        placeholder="Title"
                        className="w-full px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white placeholder-indigo-400/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                        value={snippet.title}
                        onChange={(e) => handleChange(index, 'title', e.target.value)}
                      />

                      <textarea
                        required
                        rows="4"
                        placeholder="Content"
                        className="w-full px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white placeholder-indigo-400/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200 font-mono"
                        value={snippet.content}
                        onChange={(e) => handleChange(index, 'content', e.target.value)}
                      />

                      <input
                        type="text"
                        required
                        placeholder="Programming Language"
                        className="w-full px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white placeholder-indigo-400/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                        value={snippet.programmingLanguage}
                        onChange={(e) => handleChange(index, 'programmingLanguage', e.target.value)}
                      />

                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Add tags (press Enter)"
                          className="w-full px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white placeholder-indigo-400/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                          value={tagInputs[index]}
                          onChange={(e) => {
                            const newTagInputs = [...tagInputs];
                            newTagInputs[index] = e.target.value;
                            setTagInputs(newTagInputs);
                          }}
                          onKeyPress={(e) => handleTagInput(index, e)}
                        />
                        <div className="flex flex-wrap gap-2">
                          {snippet.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 rounded-full text-sm bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center">
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(index, tag)}
                                className="ml-2 text-indigo-400 hover:text-indigo-300"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      <select
                        className="w-full px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                        value={snippet.visibility}
                        onChange={(e) => handleChange(index, 'visibility', e.target.value)}
                      >
                        <option value="private">Private</option>
                        <option value="public">Public</option>
                        <option value="shared">Shared</option>
                      </select>

                      <textarea
                        placeholder="Description (optional)"
                        rows="2"
                        className="w-full px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white placeholder-indigo-400/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                        value={snippet.description}
                        onChange={(e) => handleChange(index, 'description', e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={addSnippet}
                    className="px-4 py-2 rounded-xl text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 transition-all duration-200"
                  >
                    + Add Another Snippet
                  </button>
                </div>
              </form>
            )}
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
                disabled={loading}
                className="px-6 py-2 rounded-xl text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_25px_rgba(99,102,241,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Snippets'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkCreateSnippetModal;