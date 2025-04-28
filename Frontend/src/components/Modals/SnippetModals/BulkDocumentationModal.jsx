import { useState, useEffect } from 'react';
import axios from '../../../Config/Axios';
import { motion } from 'framer-motion';
import { 
  FiX, FiCode, FiFileText, FiChevronDown, FiLoader, 
  FiDownload, FiCopy, FiCheck, FiFolder, FiArrowRight, 
  FiRefreshCw, FiCheckCircle, FiAlertCircle 
} from 'react-icons/fi';

const BulkDocumentationModal = ({ isOpen, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentation, setDocumentation] = useState(null);
  const [error, setError] = useState('');
  const [docStyle, setDocStyle] = useState('standard');
  const [detailLevel, setDetailLevel] = useState('medium');
  const [copiedSection, setCopiedSection] = useState(null);
  const [selectedSnippets, setSelectedSnippets] = useState([]);
  const [availableSnippets, setAvailableSnippets] = useState([]);
  const [availableDirectories, setAvailableDirectories] = useState([]);
  const [isLoadingSnippets, setIsLoadingSnippets] = useState(false);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState(null);
  const [directoryPath, setDirectoryPath] = useState([]);
  const [directoryHistory, setDirectoryHistory] = useState([]);
  const [selectedTab, setSelectedTab] = useState('select'); // 'select', 'results'
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [processedSnippets, setProcessedSnippets] = useState(0);
  const [totalSnippets, setTotalSnippets] = useState(0);

  // Documentation style options
  const docStyles = [
    { value: 'standard', label: 'Standard' },
    { value: 'jsdoc', label: 'JSDoc' },
    { value: 'javadoc', label: 'JavaDoc' },
    { value: 'docstring', label: 'Python Docstring' }
  ];

  // Detail level options
  const detailLevels = [
    { value: 'basic', label: 'Basic' },
    { value: 'medium', label: 'Medium' },
    { value: 'comprehensive', label: 'Comprehensive' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchUserDirectories();
      fetchSnippets();
    }
  }, [isOpen]);

  // Search filter
  const filteredSnippets = availableSnippets.filter(
    snippet => snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
               snippet.programmingLanguage?.toLowerCase().includes(searchTerm.toLowerCase()) || 
               snippet.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle checkbox click
  const handleSnippetSelect = (snippetId) => {
    if (selectedSnippets.includes(snippetId)) {
      setSelectedSnippets(selectedSnippets.filter(id => id !== snippetId));
    } else {
      setSelectedSnippets([...selectedSnippets, snippetId]);
    }
  };

  // Fetch user directories
  const fetchUserDirectories = async (parentDirId = null) => {
    try {
      setLoadingDirectory(true);
      const endpoint = parentDirId 
        ? `/api/directories/${parentDirId}/children` 
        : '/api/directories';  // Changed from '/api/directories/root' to '/api/directories'
      
      const { data } = await axios.get(endpoint);
      
      if (data.success) {
        setAvailableDirectories(data.directories || []);
        
        if (parentDirId) {
          // Update current directory
          const dirData = await axios.get(`/api/directories/${parentDirId}`);
          if (dirData.data.success) {
            setCurrentDirectory(dirData.data.directory);
            
            // Update directory path
            if (dirData.data.directory.ancestors && dirData.data.directory.ancestors.length > 0) {
              setDirectoryPath(dirData.data.directory.ancestors);
            } else {
              setDirectoryPath([dirData.data.directory]);
            }
          }
        } else {
          setCurrentDirectory(null);
          setDirectoryPath([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch directories:', err.response?.data || err);
      setError('Failed to load directories. Please try again.');
    } finally {
      setLoadingDirectory(false);
    }
  };

  // Fetch user snippets
  const fetchSnippets = async (dirId = null) => {
    try {
      setIsLoadingSnippets(true);
      let endpoint;
      
      if (dirId) {
        endpoint = `/api/snippets/directory/${dirId}?limit=100`;
      } else {
        endpoint = '/api/snippets/user/snippets';
      }
      
      console.log('Fetching snippets from:', endpoint);
      const response = await axios.get(endpoint);
      console.log('Snippets API response:', response.data);
      
      // The API returns snippets directly in the response.data object
      // Check if snippets exist in the response
      if (response.data && (response.data.snippets || Array.isArray(response.data))) {
        // Handle possible different response structures
        const snippets = response.data.snippets || response.data;
        console.log(`Found ${snippets.length} snippets`);
        setAvailableSnippets(snippets);
      } else {
        console.error('No snippets found in response', response.data);
        setError('No snippets found in the response');
      }
    } catch (err) {
      console.error('Failed to fetch snippets:', err.response?.data || err);
      setError('Failed to load snippets. Please try again.');
    } finally {
      setIsLoadingSnippets(false);
    }
  };

  // Navigate to directory
  const navigateToDirectory = (dirId) => {
    setDirectoryHistory([...directoryHistory, { id: currentDirectory?._id, snippets: availableSnippets }]);
    fetchUserDirectories(dirId);
    fetchSnippets(dirId);
  };

  // Go back to previous directory
  const goBackDirectory = () => {
    if (directoryHistory.length > 0) {
      const previousDir = directoryHistory[directoryHistory.length - 1];
      setDirectoryHistory(directoryHistory.slice(0, -1));
      
      if (previousDir.id) {
        fetchUserDirectories(previousDir.id);
        setAvailableSnippets(previousDir.snippets);
      } else {
        fetchUserDirectories();
        fetchSnippets();
      }
    } else {
      fetchUserDirectories();
      fetchSnippets();
    }
  };

  // Select all snippets
  const handleSelectAll = () => {
    if (selectAllChecked) {
      setSelectedSnippets([]);
    } else {
      setSelectedSnippets(filteredSnippets.map(snippet => snippet._id));
    }
    setSelectAllChecked(!selectAllChecked);
  };

  // Select all snippets in a directory
  const handleSelectDirectory = async (directoryId) => {
    try {
      // Fetch all snippets in this directory
      const { data } = await axios.get(`/api/snippets/directory/${directoryId}?limit=100`);
      
      if (data.success && data.snippets) {
        // Add all snippet IDs to selected array if they aren't already included
        const newSelected = [...selectedSnippets];
        data.snippets.forEach(snippet => {
          if (!newSelected.includes(snippet._id)) {
            newSelected.push(snippet._id);
          }
        });
        setSelectedSnippets(newSelected);
      }
    } catch (err) {
      console.error('Failed to fetch directory snippets:', err);
      setError('Failed to select snippets from directory');
    }
  };

  const handleGenerate = async () => {
    if (selectedSnippets.length === 0) {
      setError('Please select at least one snippet to document');
      return;
    }

    setIsGenerating(true);
    setError('');
    setDocumentation(null);
    setSelectedTab('results'); // Switch to the results tab
    setGenerationProgress(0);
    setProcessedSnippets(0);
    setTotalSnippets(selectedSnippets.length);

    try {
      // Get full snippet data for selected snippets
      const snippetsData = [];
      for (const snippetId of selectedSnippets) {
        const snippet = availableSnippets.find(s => s._id === snippetId);
        if (snippet) {
          snippetsData.push(snippet);
        } else {
          // Fetch snippet if not in available snippets
          try {
            const { data } = await axios.get(`/api/snippets/get/${snippetId}`);
            if (data) {
              snippetsData.push(data);
            }
          } catch (err) {
            console.error(`Failed to fetch snippet ${snippetId}:`, err);
          }
        }
        
        // Update progress
        setProcessedSnippets(prev => prev + 1);
        setGenerationProgress((snippetsData.length / selectedSnippets.length) * 100);
      }

      // Generate documentation
      const { data } = await axios.post('/api/ai/documentation/bulk', {
        snippets: snippetsData,
        style: docStyle,
        level: detailLevel
      });
      
      if (data.success) {
        setDocumentation(data);
      } else {
        throw new Error(data.error || 'Failed to generate documentation');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to generate documentation');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(100); // Ensure it's 100% when done
    }
  };

  // Copy text to clipboard
  const handleCopyText = (text, section) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Download combined documentation
  const handleDownload = () => {
    if (!documentation || !documentation.combinedDocumentation) return;
    
    // Create file content
    const content = documentation.combinedDocumentation.content;
    const fileName = `${documentation.combinedDocumentation.title.replace(/\s+/g, '_')}.md`;
    
    // Create a blob and download it
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download individual snippet documentation
  const handleDownloadIndividual = (result) => {
    if (!result || !result.documentation || !result.documentation.formattedDocumentation) return;
    
    // Create file content
    const content = result.documentation.formattedDocumentation;
    const fileName = `${result.title.replace(/\s+/g, '_')}_documentation.md`;
    
    // Create a blob and download it
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto pt-16 sm:pt-20">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="flex min-h-full items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative max-w-5xl w-full bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/40 overflow-hidden transition-all transform duration-300 hover:border-slate-600/70"
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-700/40 bg-gradient-to-r from-slate-800/40 to-slate-900/40">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/40 shadow-lg">
                  <FiFileText className="text-slate-300" size={18} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Bulk Documentation Generator
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Create documentation for multiple snippets or entire directories
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

          {/* Tab Navigation */}
          <div className="flex px-4 sm:px-6 border-b border-slate-700/40">
            <button
              onClick={() => setSelectedTab('select')}
              className={`px-4 py-3 text-sm font-medium ${selectedTab === 'select' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-slate-400 hover:text-slate-300'}`}
            >
              Select Snippets
            </button>
            <button
              onClick={() => setSelectedTab('results')}
              className={`px-4 py-3 text-sm font-medium ${selectedTab === 'results' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-slate-400 hover:text-slate-300'}`}
              disabled={!documentation && !isGenerating}
            >
              Results
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto 
            scrollbar-thin scrollbar-track-slate-900/20 
            scrollbar-thumb-slate-700/40 
            hover:scrollbar-thumb-slate-700/60 
            scrollbar-thumb-rounded-full
            scrollbar-track-rounded-full">

            {/* Error display */}
            {error && (
              <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-300">
                {error}
              </div>
            )}

            {selectedTab === 'select' ? (
              <div className="space-y-6">
                {/* Options */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">
                      Documentation Style
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {docStyles.map(style => (
                        <button
                          key={style.value}
                          onClick={() => setDocStyle(style.value)}
                          className={`px-4 py-2 rounded-lg text-center transition-all duration-200 text-sm ${
                            docStyle === style.value 
                              ? 'bg-slate-700 text-white border-slate-600 shadow-inner'
                              : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-300 border-slate-700/40'
                          } border`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">
                      Detail Level
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {detailLevels.map(level => (
                        <button
                          key={level.value}
                          onClick={() => setDetailLevel(level.value)}
                          className={`px-4 py-2 rounded-lg text-center transition-all duration-200 text-sm ${
                            detailLevel === level.value 
                              ? 'bg-slate-700 text-white border-slate-600 shadow-inner'
                              : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-300 border-slate-700/40'
                          } border`}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Directory Navigation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-300">
                      Select Snippets
                    </h3>
                    
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-slate-400">
                        {selectedSnippets.length} selected
                      </span>
                      <button
                        onClick={goBackDirectory}
                        disabled={directoryHistory.length === 0 && !currentDirectory}
                        className={`p-1.5 rounded-md ${
                          directoryHistory.length === 0 && !currentDirectory
                            ? 'text-slate-600 cursor-not-allowed'
                            : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/70'
                        }`}
                      >
                        <FiChevronDown className="transform rotate-90" size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Directory path breadcrumbs */}
                  {directoryPath.length > 0 && (
                    <div className="flex items-center flex-wrap gap-1 mb-2 text-xs text-slate-400">
                      <button
                        onClick={() => {
                          fetchUserDirectories();
                          fetchSnippets();
                          setDirectoryHistory([]);
                        }}
                        className="hover:text-slate-300"
                      >
                        Root
                      </button>
                      {directoryPath.map((dir, index) => (
                        <div key={dir._id} className="flex items-center">
                          <FiChevronDown className="transform -rotate-90 mx-1" size={12} />
                          <button
                            onClick={() => navigateToDirectory(dir._id)}
                            className={`hover:text-slate-300 ${index === directoryPath.length - 1 ? 'text-slate-300' : ''}`}
                          >
                            {dir.name}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Search */}
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search snippets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800/40 border border-slate-700/40 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:border-slate-600"
                    />
                  </div>

                  {/* Directories */}
                  {loadingDirectory ? (
                    <div className="flex justify-center items-center h-12">
                      <FiLoader className="animate-spin text-slate-400" size={20} />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {availableDirectories.map(dir => (
                        <div key={dir._id} className="flex justify-between items-center px-3 py-2 rounded-lg hover:bg-slate-800/40 group">
                          <div className="flex items-center gap-2 cursor-pointer flex-grow" onClick={() => navigateToDirectory(dir._id)}>
                            <FiFolder className="text-slate-400 group-hover:text-slate-300" size={16} />
                            <span className="text-slate-300">{dir.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">{dir.snippetCount || 0} snippets</span>
                            <button
                              onClick={() => handleSelectDirectory(dir._id)}
                              className="text-slate-400 hover:text-slate-300 p-1.5 rounded-md hover:bg-slate-700/40"
                              title="Select all snippets in this directory"
                            >
                              <FiCheckCircle size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Snippets List */}
                  <div className="space-y-1 mt-4">
                    {/* Header with select all */}
                    <div className="flex items-center justify-between mb-2 px-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="select-all"
                          checked={selectAllChecked}
                          onChange={handleSelectAll}
                          className="w-4 h-4 accent-slate-500 rounded"
                        />
                        <label htmlFor="select-all" className="text-xs font-medium text-slate-400">Select All</label>
                      </div>
                      <span className="text-xs text-slate-500">{filteredSnippets.length} snippets</span>
                    </div>

                    {isLoadingSnippets ? (
                      <div className="flex justify-center items-center h-32">
                        <FiLoader className="animate-spin text-slate-400" size={20} />
                      </div>
                    ) : filteredSnippets.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        {searchTerm ? 'No snippets match your search' : 'No snippets in this directory'}
                      </div>
                    ) : (
                      filteredSnippets.map(snippet => (
                        <div key={snippet._id} className={`flex items-center px-3 py-2 rounded-lg ${selectedSnippets.includes(snippet._id) ? 'bg-slate-800/70 border border-slate-700' : 'hover:bg-slate-800/40'}`}>
                          <input
                            type="checkbox"
                            checked={selectedSnippets.includes(snippet._id)}
                            onChange={() => handleSnippetSelect(snippet._id)}
                            className="w-4 h-4 accent-slate-500 rounded mr-3"
                          />
                          <div className="flex-grow">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-300 font-medium">{snippet.title}</span>
                              <span className="text-xs py-0.5 px-2 rounded-full bg-slate-800 text-slate-400">{snippet.programmingLanguage}</span>
                            </div>
                            {snippet.description && (
                              <p className="text-xs text-slate-500 mt-1 truncate">{snippet.description}</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex justify-center mt-4">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || selectedSnippets.length === 0}
                    className={`px-6 py-2.5 rounded-xl flex items-center gap-2 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 shadow-md ${
                      isGenerating || selectedSnippets.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <FiLoader className="animate-spin" size={16} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FiFileText size={16} />
                        Generate Documentation for {selectedSnippets.length} Snippets
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {isGenerating ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <FiLoader className="animate-spin mx-auto text-blue-400" size={32} />
                      <h3 className="mt-4 text-lg font-medium text-slate-300">Generating Documentation</h3>
                      <p className="text-slate-400 mt-1">
                        Processing {processedSnippets} of {totalSnippets} snippets...
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                        style={{ width: `${generationProgress}%` }}
                      ></div>
                    </div>

                    <p className="text-center text-sm text-slate-500">
                      This may take a minute for larger selections
                    </p>
                  </div>
                ) : documentation ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-white">Documentation Results</h3>
                      <button 
                        onClick={handleDownload}
                        className="px-4 py-2 rounded-lg flex items-center gap-1 text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-700/40 transition-all duration-200"
                        title="Download combined documentation"
                      >
                        <FiDownload size={16} />
                        Download Combined
                      </button>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-slate-300 font-medium">Summary</h4>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-slate-800/70 rounded-lg p-3 border border-slate-700/40">
                          <p className="text-sm text-slate-400">Total Snippets</p>
                          <p className="text-2xl font-medium text-slate-300 mt-1">
                            {documentation.totalProcessed}
                          </p>
                        </div>
                        <div className="bg-slate-800/70 rounded-lg p-3 border border-slate-700/40">
                          <p className="text-sm text-slate-400">Successfully Documented</p>
                          <p className="text-2xl font-medium text-green-400 mt-1">
                            {documentation.totalProcessed - documentation.failureCount}
                          </p>
                        </div>
                        <div className="bg-slate-800/70 rounded-lg p-3 border border-slate-700/40">
                          <p className="text-sm text-slate-400">Failed</p>
                          <p className="text-2xl font-medium text-red-400 mt-1">
                            {documentation.failureCount}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Combined Documentation Preview */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-slate-300">Combined Documentation</h3>
                      <div className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 max-h-64 overflow-y-auto">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-slate-300">{documentation.combinedDocumentation?.title}</h4>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCopyText(documentation.combinedDocumentation?.content, 'combined')}
                              className="p-1.5 text-slate-400 hover:text-slate-300 transition-colors"
                              title="Copy to clipboard"
                            >
                              {copiedSection === 'combined' ? <FiCheck size={16} /> : <FiCopy size={16} />}
                            </button>
                            <button
                              onClick={handleDownload}
                              className="p-1.5 text-slate-400 hover:text-slate-300 transition-colors"
                              title="Download markdown"
                            >
                              <FiDownload size={16} />
                            </button>
                          </div>
                        </div>
                        <pre className="mt-3 text-sm text-slate-300 font-mono whitespace-pre-wrap overflow-auto max-h-48">
                          {documentation.combinedDocumentation?.content.substring(0, 500)}...
                        </pre>
                      </div>
                    </div>

                    {/* Individual Results */}
                    <div className="space-y-3">
                      <h3 className="font-medium text-slate-300">Individual Snippets</h3>
                      {documentation.results.map((result, index) => (
                        <div key={index} className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                          <div className="flex justify-between items-center">
                            <h4 className="text-slate-200 font-medium flex items-center gap-2">
                              {result.title}
                              {result.error ? (
                                <span className="text-red-400 text-xs bg-red-400/10 px-2 py-0.5 rounded-full">
                                  Failed to generate
                                </span>
                              ) : (
                                <span className="text-green-400 text-xs bg-green-400/10 px-2 py-0.5 rounded-full">
                                  Success
                                </span>
                              )}
                            </h4>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleCopyText(result.documentation?.formattedDocumentation || '', `doc-${index}`)}
                                className="p-1.5 text-slate-400 hover:text-slate-300 transition-colors"
                                title="Copy documentation"
                                disabled={!!result.error}
                              >
                                {copiedSection === `doc-${index}` ? <FiCheck size={16} /> : <FiCopy size={16} />}
                              </button>
                              <button
                                onClick={() => handleDownloadIndividual(result)}
                                className="p-1.5 text-slate-400 hover:text-slate-300 transition-colors"
                                title="Download documentation"
                                disabled={!!result.error}
                              >
                                <FiDownload size={16} />
                              </button>
                            </div>
                          </div>

                          {!result.error ? (
                            <div className="mt-2 text-sm text-slate-300">
                              <div className="bg-slate-800/70 p-2 rounded">
                                {result.documentation?.overview || 
                                 (result.documentation && result.documentation.documentation?.overview) ||
                                 'No overview available. Try regenerating documentation.'}
                              </div>
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-red-300">
                              {result.error}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Back Button */}
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={() => setSelectedTab('select')}
                        className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-700/50 transition-all duration-200 flex items-center gap-1"
                      >
                        <FiChevronDown className="rotate-180" size={16} />
                        Back to Selection
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-400">
                    <FiFileText className="mx-auto mb-4" size={32} />
                    <h3 className="text-lg font-medium">No Documentation Yet</h3>
                    <p className="mt-1 text-slate-500">Select snippets and generate documentation first</p>
                    <button
                      onClick={() => setSelectedTab('select')}
                      className="mt-4 px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-700/50 transition-all duration-200"
                    >
                      Go to Selection
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-700/40 bg-slate-800/20 flex justify-between">
            <p className="text-xs text-slate-400">
              {selectedTab === 'select' 
                ? `${selectedSnippets.length} snippets selected` 
                : documentation 
                  ? `${documentation.totalProcessed - documentation.failureCount}/${documentation.totalProcessed} documentation generated`
                  : 'No documentation generated yet'
              }
            </p>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all duration-200"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BulkDocumentationModal;