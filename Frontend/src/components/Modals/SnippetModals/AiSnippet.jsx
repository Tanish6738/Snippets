import React, { useState, useEffect } from 'react';
import { FiCopy, FiFolder, FiArrowLeft, FiArrowRight, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
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
  
  // New state for bulk generation
  const [generationMode, setGenerationMode] = useState('single'); // 'single' or 'bulk'
  const [snippetCount, setSnippetCount] = useState(3); // Default to 3 snippets
  const [bulkSnippets, setBulkSnippets] = useState([]); // For storing multiple generated snippets
  const [selectedSnippetIndex, setSelectedSnippetIndex] = useState(0); // For navigation in bulk preview
  const [saveAllMode, setSaveAllMode] = useState(false); // Whether to save all snippets
  
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

  // Effect to update formData when a different bulk snippet is selected
  useEffect(() => {
    if (generationMode === 'bulk' && bulkSnippets.length > 0) {
      const selectedSnippet = bulkSnippets[selectedSnippetIndex];
      if (selectedSnippet) {
        setFormData(prev => ({
          ...prev,
          title: selectedSnippet.title || '',
          content: selectedSnippet.content || '',
          language: selectedSnippet.programmingLanguage || '',
          tags: selectedSnippet.tags || [],
          description: selectedSnippet.description || '',
          visibility: selectedSnippet.visibility || 'private'
        }));
      }
    }
  }, [selectedSnippetIndex, bulkSnippets, generationMode]);

  const handlePromptSubmit = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (generationMode === 'single') {
        // Generate a single snippet (existing implementation)
        const { data } = await axios.get(`/api/ai/get-result?prompt=${encodeURIComponent(prompt)}`);
        
        const parsedResponse = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
        setAiResponse(parsedResponse);

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
        }
      } else {
        // Generate multiple snippets
        const { data } = await axios.post('/api/ai/snippets/bulk', {
          prompt: prompt,
          count: snippetCount,
          language: '' // Optional, can be added later for language preference
        });
        
        if (data.success && Array.isArray(data.snippets)) {
          setBulkSnippets(data.snippets);
          setSelectedSnippetIndex(0);
          
          // Reset aiResponse since we're handling bulk snippets differently
          setAiResponse(null);
          
          // Update form data with the first snippet
          if (data.snippets.length > 0) {
            const firstSnippet = data.snippets[0];
            setFormData(prev => ({
              ...prev,
              title: firstSnippet.title || '',
              content: firstSnippet.content || '',
              language: firstSnippet.programmingLanguage || '',
              tags: firstSnippet.tags || [],
              description: firstSnippet.description || '',
              visibility: firstSnippet.visibility || 'private'
            }));
          }
        } else {
          throw new Error('Invalid response format for bulk generation');
        }
      }
    } catch (err) {
      const errorMsg = 'Failed to generate response: ' + (err.response?.data?.message || err.message);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Update the current bulk snippet if we're in bulk mode
    if (generationMode === 'bulk' && bulkSnippets.length > 0) {
      const updatedSnippets = [...bulkSnippets];
      updatedSnippets[selectedSnippetIndex] = {
        ...updatedSnippets[selectedSnippetIndex],
        [name]: value,
        // Handle special case for programmingLanguage/language mapping
        ...(name === 'language' ? { programmingLanguage: value } : {})
      };
      setBulkSnippets(updatedSnippets);
    }
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
        
        // Update the current bulk snippet if we're in bulk mode
        if (generationMode === 'bulk' && bulkSnippets.length > 0) {
          const updatedSnippets = [...bulkSnippets];
          updatedSnippets[selectedSnippetIndex] = {
            ...updatedSnippets[selectedSnippetIndex],
            tags: [...(updatedSnippets[selectedSnippetIndex].tags || []), newTag]
          };
          setBulkSnippets(updatedSnippets);
        }
      }
      e.target.value = '';
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
    
    // Update the current bulk snippet if we're in bulk mode
    if (generationMode === 'bulk' && bulkSnippets.length > 0) {
      const updatedSnippets = [...bulkSnippets];
      updatedSnippets[selectedSnippetIndex] = {
        ...updatedSnippets[selectedSnippetIndex],
        tags: (updatedSnippets[selectedSnippetIndex].tags || []).filter(tag => tag !== tagToRemove)
      };
      setBulkSnippets(updatedSnippets);
    }
  };

  // Function to navigate between bulk snippets
  const navigateBulkSnippets = (direction) => {
    if (bulkSnippets.length <= 1) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (selectedSnippetIndex + 1) % bulkSnippets.length;
    } else {
      newIndex = (selectedSnippetIndex - 1 + bulkSnippets.length) % bulkSnippets.length;
    }
    
    setSelectedSnippetIndex(newIndex);
  };

  // Save a single snippet
  const saveSnippet = async (snippetData) => {
    try {
      if (!snippetData.directoryId) {
        return { error: 'Please select a directory' };
      }

      const { data } = await axios.post('/api/snippets', snippetData);

      // Log activity
      await axios.post('/api/activities', {
        action: 'create',
        targetType: 'snippet',
        targetId: data._id
      });

      return { success: true, data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to save snippet';
      return { error: errorMessage };
    }
  };

  // Save all snippets in bulk
  const saveBulkSnippets = async () => {
    if (!formData.directoryId) {
      setError('Please select a directory');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Format snippets for bulk creation
      const snippetsToSave = bulkSnippets.map(snippet => ({
        title: snippet.title.trim(),
        content: snippet.content.trim(),
        programmingLanguage: snippet.programmingLanguage.trim(),
        description: snippet.description?.trim() || '',
        visibility: snippet.visibility || formData.visibility,
        tags: snippet.tags || [],
        directoryId: formData.directoryId
      }));
      
      // Use the existing bulk create API endpoint
      const { data } = await axios.post('/api/snippets/bulk', {
        snippets: snippetsToSave
      });
      
      // Log activity for each created snippet
      await Promise.all(data.map(snippet => 
        axios.post('/api/activities', {
          action: 'create',
          targetType: 'snippet',
          targetId: snippet._id
        })
      ));
      
      // Call the parent component's callback
      if (typeof onSnippetCreated === 'function') {
        onSnippetCreated(data);
      }
      
      // Close the modal
      onClose();
      
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to save snippets';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Modified handleSave to work with both single and bulk modes
  const handleSave = async () => {
    if (generationMode === 'bulk' && saveAllMode) {
      // Save all snippets in bulk
      await saveBulkSnippets();
    } else {
      // Save single snippet (either the only one in single mode or the selected one in bulk mode)
      setIsLoading(true);
      setError('');
      
      try {
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
        
        const result = await saveSnippet(snippetData);
        
        if (result.error) {
          setError(result.error);
        } else {
          // Only call onSnippetCreated if it exists and is a function
          if (typeof onSnippetCreated === 'function') {
            onSnippetCreated(result.data);
          }
          // Always close modal after successful save
          onClose();
        }
      } catch (err) {
        const errorMessage = err.response?.data?.error || 'Failed to save snippet';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const resetForm = () => {
    setPrompt('');
    setAiResponse(null);
    setError('');
    setIsLoading(false);
    setEditMode(false);
    setBulkSnippets([]);
    setSelectedSnippetIndex(0);
    setSaveAllMode(false);
    setFormData({
      title: '',
      content: '',
      language: '',
      tags: [],
      visibility: 'private',
      description: '',
      directoryId: location.state?.currentDirectory?._id || null
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderFormFields = () => (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white focus:border-slate-600 focus:ring-1 focus:ring-slate-500 transition-all duration-200"
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Content</label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          rows="6"
          className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white font-mono focus:border-slate-600 focus:ring-1 focus:ring-slate-500 transition-all duration-200"
        />
      </div>

      {/* Language */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Programming Language</label>
        <input
          type="text"
          name="language"
          value={formData.language}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white focus:border-slate-600 focus:ring-1 focus:ring-slate-500 transition-all duration-200"
        />
      </div>

      {/* Directory Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Select Directory</label>
        <div className="relative">
          <FiFolder className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <select
            name="directoryId"
            value={formData.directoryId || ''}
            onChange={handleChange}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 focus:border-slate-600 focus:ring-1 focus:ring-slate-500 transition-all duration-200"
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
        <label className="block text-sm font-medium text-slate-300 mb-1">Tags</label>
        <input
          type="text"
          onKeyPress={handleTagInput}
          className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white focus:border-slate-600 focus:ring-1 focus:ring-slate-500 transition-all duration-200"
          placeholder="Press Enter to add tags"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {formData.tags.map(tag => (
            <span key={tag} className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700/50">
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-2 text-slate-400 hover:text-slate-300"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Visibility</label>
        <select
          name="visibility"
          value={formData.visibility}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 focus:border-slate-600 focus:ring-1 focus:ring-slate-500 transition-all duration-200"
        >
          <option value="private">Private</option>
          <option value="public">Public</option>
          <option value="shared">Shared</option>
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white focus:border-slate-600 focus:ring-1 focus:ring-slate-500 transition-all duration-200"
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
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/40 transition-all duration-300">
            <p className="text-slate-300">{text}</p>
          </div>
        )}

        {/* Snippet Details */}
        <div className="space-y-4">
          {/* Title Section */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
            <div className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white">
              {file.title}
            </div>
          </div>

          {/* Code Content Section */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Code</label>
            <div className="relative group">
              <pre className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white font-mono text-sm overflow-x-auto whitespace-pre styled-scrollbar">
                <code className="language-javascript">
                  {file.content}
                </code>
              </pre>
              <div className="absolute top-2 right-2 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => navigator.clipboard.writeText(file.content)}
                  className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 transition-all duration-200"
                  title="Copy to clipboard"
                >
                  <FiCopy />
                </button>
              </div>
            </div>
          </div>

          {/* Language Section */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Programming Language</label>
            <div className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white capitalize">
              {file.programmingLanguage}
            </div>
          </div>

          {/* Description Section */}
          {file.description && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
              <div className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white">
                {file.description}
              </div>
            </div>
          )}

          {/* Tags Section */}
          {file.tags && file.tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Tags</label>
              <div className="flex flex-wrap gap-2">
                {file.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700/50 text-slate-300 text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Visibility Section */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Visibility</label>
            <div className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white capitalize">
              {file.visibility || 'private'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // New component for bulk snippet navigation
  const renderBulkSnippetNavigation = () => {
    if (generationMode !== 'bulk' || bulkSnippets.length <= 1) return null;
    
    return (
      <div className="flex justify-between items-center my-4 px-4 py-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
        <button
          onClick={() => navigateBulkSnippets('prev')}
          disabled={isLoading}
          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 transition-all duration-200"
        >
          <FiArrowLeft />
        </button>
        
        <div className="text-slate-300 text-sm">
          Snippet {selectedSnippetIndex + 1} of {bulkSnippets.length}
        </div>
        
        <button
          onClick={() => navigateBulkSnippets('next')}
          disabled={isLoading}
          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 transition-all duration-200"
        >
          <FiArrowRight />
        </button>
      </div>
    );
  };

  const renderFooterButtons = () => (
    <div className="flex justify-between space-x-3">
      {/* Left side - Mode toggle when in input state */}
      <div>
        {!aiResponse && bulkSnippets.length === 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-400">Mode:</span>
            <div className="flex bg-slate-800/80 p-1 rounded-lg">
              <button
                onClick={() => setGenerationMode('single')}
                className={`px-3 py-1 text-sm transition-all duration-200 rounded-md ${
                  generationMode === 'single' 
                    ? 'bg-slate-700 text-white' 
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Single
              </button>
              <button
                onClick={() => setGenerationMode('bulk')}
                className={`px-3 py-1 text-sm transition-all duration-200 rounded-md ${
                  generationMode === 'bulk' 
                    ? 'bg-slate-700 text-white' 
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Bulk
              </button>
            </div>
          </div>
        )}
        
        {/* Snippet count selector when in bulk mode */}
        {generationMode === 'bulk' && !aiResponse && bulkSnippets.length === 0 && (
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-sm text-slate-400">Count:</span>
            <div className="flex bg-slate-800/80 p-1 rounded-lg">
              {[2, 3, 5].map((count) => (
                <button
                  key={count}
                  onClick={() => setSnippetCount(count)}
                  className={`px-3 py-1 text-sm transition-all duration-200 rounded-md ${
                    snippetCount === count
                      ? 'bg-slate-700 text-white' 
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Bulk save toggle when in bulk edit mode */}
        {generationMode === 'bulk' && bulkSnippets.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-400">Save:</span>
            <div className="flex bg-slate-800/80 p-1 rounded-lg">
              <button
                onClick={() => setSaveAllMode(false)}
                className={`px-3 py-1 text-sm transition-all duration-200 rounded-md ${
                  !saveAllMode
                    ? 'bg-slate-700 text-white' 
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Current
              </button>
              <button
                onClick={() => setSaveAllMode(true)}
                className={`px-3 py-1 text-sm transition-all duration-200 rounded-md ${
                  saveAllMode
                    ? 'bg-slate-700 text-white' 
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                All
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Right side buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={handleClose}
          className="px-4 py-2 rounded-xl text-slate-300 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-200"
        >
          Cancel
        </button>
        {!aiResponse && bulkSnippets.length === 0 ? (
          <button
            onClick={handlePromptSubmit}
            disabled={isLoading}
            className="px-6 py-2 rounded-xl text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Generating...' : generationMode === 'single' ? 'Generate' : `Generate ${snippetCount}`}
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-xl text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 shadow-lg"
          >
            {saveAllMode ? 'Save All Snippets' : 'Save Snippet'}
          </button>
        )}
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto styled-scrollbar">
      {/* Prompt Input */}
      {!aiResponse && bulkSnippets.length === 0 ? (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Enter your prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-400 focus:border-slate-600 focus:ring-1 focus:ring-slate-500 transition-all duration-200"
            rows="4"
            placeholder={`Describe what code you want to generate${generationMode === 'bulk' ? ' (multiple snippets)' : ''}...`}
          />
        </div>
      ) : (
        <>
          {/* Display bulk navigation when in bulk mode */}
          {renderBulkSnippetNavigation()}
          
          {/* Generated Content Form */}
          {renderFormFields()}
        </>
      )}

      {/* Display single snippet response in the old format */}
      {aiResponse && renderResponse()}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm"></div>
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative max-w-2xl w-full bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-xl rounded-xl shadow-lg border border-slate-700/30 overflow-hidden transition-all transform duration-300 hover:border-slate-600/50 hover:shadow-slate-700/10">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-700/30">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                AI Snippet Generator
                {generationMode === 'bulk' && <span className="ml-2 text-sm font-normal text-slate-400">(Bulk Mode)</span>}
              </h2>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-300 transition-colors duration-200 text-2xl font-semibold">
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
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-500"></div>
            </div>
          ) : (
            renderContent()
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-700/30 bg-slate-800/20">
            {renderFooterButtons()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiSnippet;