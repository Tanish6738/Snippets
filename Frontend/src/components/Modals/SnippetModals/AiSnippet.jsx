import React, { useState, useEffect } from 'react';
import { FiCopy, FiFolder } from 'react-icons/fi';
import axios from '../../../Config/Axios';
import { useLocation } from 'react-router-dom';

 const logAction = (action, data) => {
  console.group(`🎯 AI Snippet Action: ${action}`);
  console.log('Data:', data);
  console.groupEnd();
};

 const logError = (error, context) => {
  console.group('❌ AI Snippet Error');
  console.error('Context:', context);
  console.error('Error:', error);
  console.groupEnd();
};

 const logState = (state, newValue) => {
  console.group(`📝 AI Snippet State Change: ${state}`);
  console.log('New Value:', newValue);
  console.groupEnd();
};

const AiSnippet = ({ 
  isOpen, 
  onClose = () => {}, // Provide default empty function
  onSnippetCreated = () => {} // Provide default empty function
}) => {
  const location = useLocation();
  const [prompt, setPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  
  // Match CreateSnippet form structure
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    language: '',
    tags: [],
    visibility: 'private',
    description: '',
    directoryId: null
  });

  // Directory handling
  const [availableDirectories, setAvailableDirectories] = useState([]);
  const [isLoadingDirectories, setIsLoadingDirectories] = useState(false);

  // Add new state for form editing
  const [isEditing, setIsEditing] = useState(false);

  // Fetch directories when modal opens
  useEffect(() => {
    const fetchDirectories = async () => {
      if (!isOpen) return;
      setIsLoadingDirectories(true);
      // logAction('Fetching Directories');
      
      try {
        const response = await axios.get('/api/directories');
        const directories = response.data.directories || response.data || [];
        setAvailableDirectories(directories);
        // logState('availableDirectories', directories);
      } catch (error) {
        setError('Failed to load directories');
        // logError(error, 'Fetch Directories');
      } finally {
        setIsLoadingDirectories(false);
      }
    };

    fetchDirectories();
  }, [isOpen]);

  // Update formData when directory context changes
  useEffect(() => {
    if (isOpen && location.state?.currentDirectory) {
      setFormData(prev => ({
        ...prev,
        directoryId: location.state.currentDirectory._id
      }));
    }
  }, [isOpen, location.state]);

  const handlePromptSubmit = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      // logError('Empty prompt', 'Validation');
      return;
    }

    setIsLoading(true);
    setError('');
    // logAction('Generate Snippet', { prompt });

    try {
      const { data } = await axios.get(`/api/ai/get-result?prompt=${encodeURIComponent(prompt)}`);
      // logAction('AI Response Received', data);
      
      const parsedResponse = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      setAiResponse(parsedResponse);
      // logState('aiResponse', parsedResponse);

      // Populate formData from AI response
      if (parsedResponse?.fileTree?.snippet?.file) {
        const { file } = parsedResponse.fileTree.snippet;
        const newFormData = {
          title: file.title || '',
          content: file.content || '',
          language: file.programmingLanguage || '',
          tags: file.tags || [],
          visibility: file.visibility || 'private',
          description: file.description || '',
          directoryId: formData.directoryId
        };
        setFormData(newFormData);
        // logState('formData', newFormData);
      }
    } catch (err) {
      const errorMsg = 'Failed to generate response: ' + (err.response?.data?.message || err.message);
      setError(errorMsg);
      // logError(err, 'API Call');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newTag = e.target.value.trim();
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      e.target.value = '';
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Update the handleSave function with proper error handling
  const handleSave = async () => {
    try {
      if (!formData.directoryId) {
        setError('Please select a directory');
        // logError('No directory selected', 'Validation');
        return;
      }

      const snippetData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        programmingLanguage: formData.language.trim(),
        description: formData.description.trim(),
        visibility: formData.visibility,
        tags: formData.tags,
        directoryId: formData.directoryId,
        commentsEnabled: true
      };

      // logAction('Save Snippet', snippetData);

      const { data } = await axios.post('/api/snippets', snippetData);
      // logAction('Snippet Saved', data);

      // Log activity
      await axios.post('/api/activities', {
        action: 'create',
        targetType: 'snippet',
        targetId: data._id
      });

      // Only call onSnippetCreated if it exists and is a function
      if (typeof onSnippetCreated === 'function') {
        onSnippetCreated(data);
      }

      // Always close modal after successful save
      onClose();

    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to save snippet';
      setError(errorMessage);
      // logError(err, 'Save Snippet');
    }
  };

  const renderFormFields = () => (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-indigo-300 mb-1">Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white"
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-indigo-300 mb-1">Content</label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          rows="6"
          className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white font-mono"
        />
      </div>

      {/* Language */}
      <div>
        <label className="block text-sm font-medium text-indigo-300 mb-1">Programming Language</label>
        <input
          type="text"
          name="language"
          value={formData.language}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white"
        />
      </div>

      {/* Directory Selection */}
      <div>
        <label className="block text-sm font-medium text-indigo-300 mb-1">Select Directory</label>
        <div className="relative">
          <FiFolder className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400" />
          <select
            name="directoryId"
            value={formData.directoryId || ''}
            onChange={handleChange}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white"
            disabled={isLoadingDirectories}
          >
            <option value="">Select a directory</option>
            {availableDirectories.map(dir => (
              <option key={dir._id} value={dir._id}>
                {dir.path ? `${dir.path}/${dir.name}` : dir.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-indigo-300 mb-1">Tags</label>
        <input
          type="text"
          onKeyPress={handleTagInput}
          className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white"
          placeholder="Press Enter to add tags"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {formData.tags.map(tag => (
            <span key={tag} className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full">
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-2 text-indigo-400 hover:text-indigo-300"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-sm font-medium text-indigo-300 mb-1">Visibility</label>
        <select
          name="visibility"
          value={formData.visibility}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white"
        >
          <option value="private">Private</option>
          <option value="public">Public</option>
          <option value="shared">Shared</option>
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-indigo-300 mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white"
        />
      </div>
    </div>
  );

  const renderResponse = () => {
    if (!aiResponse) {
      return null;
    }

    const { text, fileTree } = aiResponse;
    const file = fileTree?.snippet?.file;

    if (!file) {
      return null;
    }

    return (
      <div className="space-y-6">
        {/* Response Overview */}
        {text && (
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <p className="text-indigo-300">{text}</p>
          </div>
        )}

        {/* Snippet Details */}
        <div className="space-y-4">
          {/* Title Section */}
          <div>
            <label className="block text-sm font-medium text-indigo-300 mb-1">Title</label>
            <div className="px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white">
              {file.title}
            </div>
          </div>

          {/* Code Content Section */}
          <div>
            <label className="block text-sm font-medium text-indigo-300 mb-1">Code</label>
            <div className="relative group">
              <pre className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white font-mono text-sm overflow-x-auto whitespace-pre">
                <code className="language-javascript">
                  {file.content}
                </code>
              </pre>
              <div className="absolute top-2 right-2 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => navigator.clipboard.writeText(file.content)}
                  className="p-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300"
                  title="Copy to clipboard"
                >
                  <FiCopy />
                </button>
              </div>
            </div>
          </div>

          {/* Language Section */}
          <div>
            <label className="block text-sm font-medium text-indigo-300 mb-1">Programming Language</label>
            <div className="px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white capitalize">
              {file.programmingLanguage}
            </div>
          </div>

          {/* Description Section */}
          {file.description && (
            <div>
              <label className="block text-sm font-medium text-indigo-300 mb-1">Description</label>
              <div className="px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white">
                {file.description}
              </div>
            </div>
          )}

          {/* Tags Section */}
          {file.tags && file.tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-indigo-300 mb-1">Tags</label>
              <div className="flex flex-wrap gap-2">
                {file.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Visibility Section */}
          <div>
            <label className="block text-sm font-medium text-indigo-300 mb-1">Visibility</label>
            <div className="px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white capitalize">
              {file.visibility || 'private'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFooterButtons = () => (
    <div className="flex justify-end space-x-3">
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 rounded-xl text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10"
      >
        Cancel
      </button>
      {!aiResponse ? (
        <button
          onClick={handlePromptSubmit}
          disabled={isLoading}
          className="px-6 py-2 rounded-xl text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600"
        >
          {isLoading ? 'Generating...' : 'Generate'}
        </button>
      ) : (
        <button
          onClick={handleSave}
          className="px-6 py-2 rounded-xl text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600"
        >
          Save Snippet
        </button>
      )}
    </div>
  );

  const renderContent = () => (
    <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
      {/* Prompt Input */}
      <div>
        <label className="block text-sm font-medium text-indigo-300 mb-1">
          Enter your prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white"
          rows="4"
          placeholder="Describe what code you want to generate..."
        />
      </div>

      {/* Generated Content Form */}
      {aiResponse && renderFormFields()}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm"></div>
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative max-w-2xl w-full bg-[#0B1120]/95 backdrop-blur-xl rounded-2xl shadow-lg border border-indigo-500/30 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-indigo-500/20">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                AI Snippet Generator
              </h2>
              <button onClick={onClose} className="text-indigo-400 hover:text-indigo-300">
                ×
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            renderContent()
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-indigo-500/20 bg-indigo-500/5">
            {renderFooterButtons()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiSnippet;