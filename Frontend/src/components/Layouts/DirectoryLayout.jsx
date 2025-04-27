import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { 
  FaFolder, 
  FaFolderOpen, 
  FaChevronRight, 
  FaChevronLeft,
  FaChevronDown,
  FaFile,
  FaPlus,
  FaTrash,
  FaEdit,
  FaSearch,
  FaSpinner,
  FaCode,
  FaFileCode,
  FaDatabase,
  FaCopy,
  FaPlay,
  FaBook,
  FaFileAlt
} from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import CreateSnippetModal from '../Modals/SnippetModals/CreateSnippetModal';
import CreateDirectoryModal from '../Modals/DirectoryModals/CreateDirectoryModal';
import EditSnippetModal from '../Modals/SnippetModals/EditSnippetModal';
import CheatSheetModal from '../Modals/SnippetModals/CheatSheetModal';
import BulkDocumentationModal from '../Modals/SnippetModals/BulkDocumentationModal';
import axios from '../../Config/Axios';
import { Container, LoadingSpinner, ScrollbarStyles } from '../User/Home/HComponents';
import { GlassCard, IconButton, Button, QuickActionButton } from '../User/Home/Cards';

// Add these helper functions at the top
const buildDirectoryTree = (directory) => {
  if (!directory) return null;

  return {
    type: 'directory',
    id: directory._id || null,
    name: directory.name || 'Unnamed Directory',
    path: directory.path || '/',
    metadata: directory.metadata || {},
    children: Array.isArray(directory.children) ? directory.children : [],
    directSnippets: Array.isArray(directory.directSnippets) ? directory.directSnippets : [],
    allSnippets: Array.isArray(directory.allSnippets) ? directory.allSnippets : [],
    createdAt: directory.createdAt || new Date().toISOString(),
    visibility: directory.visibility || 'private'
  };
};

// Add this new utility function at the top of the file
const searchItems = (items, searchTerm) => {
  if (!searchTerm) return items;
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return items.filter(item => {
    // Search in directory/snippet name
    const nameMatch = (item.name || item.title || '').toLowerCase().includes(lowerSearchTerm);
    
    // For snippets, also search in tags and programming language
    if (item.type === 'snippet') {
      const tagMatch = (item.tags || []).some(tag => 
        tag.toLowerCase().includes(lowerSearchTerm)
      );
      const languageMatch = (item.programmingLanguage || '').toLowerCase().includes(lowerSearchTerm);
      return nameMatch || tagMatch || languageMatch;
    }
    
    return nameMatch;
  });
};

// Updated FileTreeNode with modern design
const FileTreeNode = ({ item, level = 0, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isDirectory = item.type === 'directory' || item.children;
  const hasChildren = isDirectory && (item.children?.length > 0 || item.directSnippets?.length > 0);

  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(item);
  };

  const handleExpandClick = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.div 
      className="select-none"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className={`
          flex items-center py-2 px-3
          hover:bg-slate-800/60 rounded-lg 
          cursor-pointer group
          ${level > 0 ? `ml-${level * 4}` : ''}
          transition-all duration-200
        `}
        onClick={handleClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <span className="w-4 h-4 flex items-center justify-center mr-2">
          {hasChildren && (
            <motion.button
              onClick={handleExpandClick}
              className="text-slate-400 hover:text-slate-300 transition-colors"
              animate={{ rotate: isExpanded ? 90 : 0 }}
            >
              <FaChevronRight size={12} />
            </motion.button>
          )}
        </span>

        <span className="w-5 h-5 flex items-center justify-center mr-2">
          {isDirectory ? (
            isExpanded ? (
              <FaFolderOpen className="w-4 h-4 text-slate-400" />
            ) : (
              <FaFolder className="w-4 h-4 text-slate-400" />
            )
          ) : (
            <FaFile className="w-4 h-4 text-slate-300" />
          )}
        </span>

        <span className="text-sm text-slate-300 font-medium flex-1 truncate">
          {item.name || item.title}
        </span>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          {isDirectory && (
            <IconButton
              icon={<FaChevronRight size={12} />}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(item);
              }}
              tooltip="Open"
            />
          )}
        </div>
      </motion.div>

      {isExpanded && hasChildren && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          {item.children?.map((child) => (
            <FileTreeNode
              key={child._id}
              item={{ ...child, type: 'directory' }}
              level={level + 1}
              onSelect={onSelect}
            />
          ))}
          
          {item.directSnippets?.map((snippet) => (
            <FileTreeNode
              key={snippet._id}
              item={{ ...snippet, type: 'snippet' }}
              level={level + 1}
              onSelect={onSelect}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

// Updated SnippetDetails with modern design
const SnippetDetails = ({ snippet, onEditClick }) => {
  const [copyStatus, setCopyStatus] = useState('');
  const navigate = useNavigate();
  
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(snippet.content);
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    } catch (err) {
      setCopyStatus('Failed to copy');
    }
  };
  
  const handleRunSnippet = () => {
    if (snippet?.content) {
      let detectedLanguage = 'javascript';
      
      if (snippet.programmingLanguage) {
        const lang = snippet.programmingLanguage.toLowerCase();
        if (lang.includes('python') || lang.includes('py')) {
          detectedLanguage = 'python';
        } else if (lang.includes('javascript') || lang.includes('js')) {
          detectedLanguage = 'javascript';
        }
      }
      
      navigate('/run-code', {
        state: {
          code: snippet.content,
          language: detectedLanguage
        }
      });
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <GlassCard
        title={snippet.name || snippet.title}
        icon={<FaCode />}
        action={
          <div className="flex items-center gap-2">
            <IconButton
              icon={<FaCopy />}
              onClick={handleCopyCode}
              tooltip={copyStatus || "Copy code"}
            />
            <IconButton
              icon={<FaPlay />}
              onClick={handleRunSnippet}
              tooltip="Run snippet"
            />
            <IconButton
              icon={<FaEdit />}
              onClick={() => onEditClick(snippet)}
              tooltip="Edit snippet"
            />
          </div>
        }
      >
        <div className="space-y-4">
          <div className="relative rounded-xl bg-slate-900/90 border border-slate-700/50 overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-8 bg-slate-800/70 border-b border-slate-700/50 flex items-center px-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
            </div>
            <pre className="text-slate-300 p-4 pt-12 overflow-x-auto">
              <code>{snippet.content || '// No content available'}</code>
            </pre>
          </div>

          {snippet.tags && snippet.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {snippet.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 text-sm rounded-full bg-slate-800/50 text-slate-300 
                           border border-slate-700/50 hover:border-slate-600/50 
                           transition-colors duration-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 text-sm text-slate-400">
              <p>Language: {snippet.programmingLanguage || 'N/A'}</p>
              <p>Visibility: {snippet.visibility || 'N/A'}</p>
            </div>
            <div className="space-y-2 text-sm text-slate-400">
              <p>Created: {snippet.createdAt ? new Date(snippet.createdAt).toLocaleDateString() : 'N/A'}</p>
              <p>Last Updated: {snippet.updatedAt ? new Date(snippet.updatedAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

SnippetDetails.propTypes = {
  snippet: PropTypes.object.isRequired,
  onEditClick: PropTypes.func.isRequired
};

const ListView = ({ items, onSelect, searchTerm }) => {
  const filteredItems = useMemo(() => {
    if (!Array.isArray(items)) return { directories: [], files: [] };
    
    const filtered = items.reduce((acc, item) => {
      if (item?.name?.toLowerCase().includes((searchTerm || '').toLowerCase())) {
        if (item.type === 'directory') {
          acc.directories.push(item);
        } else {
          acc.files.push(item);
        }
      }
      return acc;
    }, { directories: [], files: [] });

    return filtered;
  }, [items, searchTerm]);

  return (
    <div className="space-y-1">
      {filteredItems.directories.map((item) => (
        <DirectoryItem
          key={item.id}
          item={item}
          onSelect={onSelect}
          level={0}
        />
      ))}
      {filteredItems.files.map((item) => (
        <DirectoryItem
          key={item.id}
          item={{...item, type: 'file'}}
          onSelect={onSelect}
          level={0}
        />
      ))}
    </div>
  );
};

const SidebarSection = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center px-2 py-1 text-indigo-300/90 hover:text-indigo-200"
      >
        <FaChevronDown 
          className={`
            w-3 h-3 mr-1
            transform transition-transform duration-75 
            ${isOpen ? 'rotate-0' : '-rotate-90'}
          `}
        />
        <span className="text-xs uppercase tracking-wider font-medium">{title}</span>
      </button>
      <div className={`
        overflow-hidden transition-all duration-75
        ${isOpen ? 'max-h-[1000px]' : 'max-h-0'}
      `}>
        {children}
      </div>
    </div>
  );
};

const DirectoryStats = ({ directory }) => {
  if (!directory) return null;
  
  return (
    <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-indigo-500/20">
        <FaFolderOpen className="w-5 h-5 text-indigo-400" />
        <div>
          <h3 className="text-lg font-semibold text-white">{directory.name}</h3>
          <p className="text-xs text-indigo-400">{directory.path}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
          <div className="text-xs text-indigo-400 mb-1">Direct Snippets</div>
          <div className="text-xl font-semibold text-white">
            {directory.directSnippets?.length || 0}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
          <div className="text-xs text-indigo-400 mb-1">All Snippets</div>
          <div className="text-xl font-semibold text-white">
            {directory.allSnippets?.length || 0}
          </div>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-indigo-300">
          <span>Created</span>
          <span>{new Date(directory.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between text-indigo-300">
          <span>Size</span>
          <span>{directory.metadata?.size || 0} bytes</span>
        </div>
        <div className="flex justify-between text-indigo-300">
          <span>Visibility</span>
          <span className="capitalize">{directory.visibility}</span>
        </div>
      </div>
    </div>
  );
};

// Fix the SnippetList component to handle undefined tags
const SnippetList = ({ snippets, onSnippetClick }) => {
  if (!snippets?.length) {
    return (
      <div className="text-center text-indigo-400 py-8">
        No snippets in this directory
      </div>
    );
  }

  return (
    <div className="space-y-2 md:space-y-3">
      {snippets.map((snippet, index) => (
        <div 
          key={snippet._id || `snippet-${index}`}
          onClick={() => onSnippetClick(snippet)}
          className="p-3 md:p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 
                     hover:bg-indigo-500/10 transition-colors duration-200 cursor-pointer
                     hover:border-indigo-500/30"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h4 className="text-white font-medium">{snippet.title}</h4>
              <p className="text-xs text-indigo-400">{snippet.programmingLanguage}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1 md:gap-2">
              {snippet.tags?.map((tag, tagIndex) => (
                <span 
                  key={`${snippet._id || index}-${tag}-${tagIndex}`}
                  className="px-2 py-1 text-xs rounded-full bg-indigo-500/20 text-indigo-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-2 text-xs text-indigo-400 flex items-center justify-between">
            <span>Created: {new Date(snippet.createdAt).toLocaleDateString()}</span>
            <span>Version: {snippet.versionHistory?.length || 0}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Update PropTypes to include the new onSnippetClick prop
SnippetList.propTypes = {
  snippets: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string,
    title: PropTypes.string.isRequired,
    programmingLanguage: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    createdAt: PropTypes.string,
    versionHistory: PropTypes.array
  })),
  onSnippetClick: PropTypes.func.isRequired
};

// Fix the MainContent component to include unique keys
const MainContent = ({ directory, selectedSnippet, searchTerm, setSelectedSnippet }) => {
  const [loading, setLoading] = useState(false);

  // Log received data for debugging
  useEffect(() => {
    console.log('Directory data:', directory);
    console.log('Selected snippet:', selectedSnippet);
  }, [directory, selectedSnippet]);

  // Move handleSnippetClick to use the passed setter
  const handleSnippetClick = (snippet) => {
    if (selectedSnippet?._id === snippet._id) return; // Prevent re-selecting same snippet
    setSelectedSnippet(snippet);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin text-indigo-500">
          <FaSpinner size={24} />
        </div>
      </div>
    );
  }

  if (!directory && !selectedSnippet) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-indigo-400">Select a directory or snippet to view</p>
      </div>
    );
  }

  if (selectedSnippet) {
    return <SnippetDetails snippet={selectedSnippet} />;
  }

  // Filter items based on search term
  const filteredSnippets = directory.allSnippets?.filter(snippet =>
    !searchTerm || snippet.title?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredDirectories = directory.children?.filter(dir =>
    !searchTerm || dir.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Directory Stats */}
      {!searchTerm && (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <div className="flex items-center gap-3 mb-4">
            <FaFolderOpen className="text-2xl text-indigo-400" />
            <div>
              <h2 className="text-xl font-bold text-white">{directory.name}</h2>
              <p className="text-sm text-indigo-400">{directory.path}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox 
              label="Total Snippets" 
              value={directory.metadata?.snippetCount || 0} 
              icon={<FaCode />} 
            />
            <StatBox 
              label="Subdirectories" 
              value={directory.metadata?.subDirectoryCount || 0} 
              icon={<FaFolder />} 
            />
            <StatBox 
              label="Direct Snippets" 
              value={directory.directSnippets?.length || 0} 
              icon={<FaFileCode />} 
            />
            <StatBox 
              label="Size" 
              value={formatBytes(directory.metadata?.totalSize || 0)} 
              icon={<FaDatabase />} 
            />
          </div>
        </div>
      )}

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Snippets Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FaCode className="text-indigo-400" />
            {searchTerm ? 'Matching Snippets' : 'Snippets'}
          </h3>
          <SnippetList 
            snippets={filteredSnippets} 
            onSnippetClick={handleSnippetClick}
          />
        </div>

        {/* Subdirectories Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FaFolder className="text-indigo-400" />
            {searchTerm ? 'Matching Directories' : 'Subdirectories'}
          </h3>
          <DirectoryList directories={filteredDirectories} />
        </div>
      </div>
    </div>
  );
};

// Add PropTypes for the MainContent component
MainContent.propTypes = {
  directory: PropTypes.object,
  selectedSnippet: PropTypes.object,
  searchTerm: PropTypes.string,
  setSelectedSnippet: PropTypes.func.isRequired
};

// Add these helper components:
const StatBox = ({ label, value, icon }) => (
  <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
    <div className="flex items-center gap-2 text-indigo-400 mb-1">
      {icon}
      <span className="text-xs uppercase">{label}</span>
    </div>
    <div className="text-xl font-semibold text-white">{value}</div>
  </div>
);

StatBox.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.element.isRequired
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const DirectoryList = ({ directories }) => (
  <div className="space-y-2">
    {directories.map(dir => (
      <div 
        key={dir._id}
        className="p-4 rounded-lg bg-indigo-500/5 border border-indigo-500/20
                 hover:bg-indigo-500/10 transition-colors cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaFolder className="text-indigo-400" />
            <span className="text-white font-medium">{dir.name}</span>
          </div>
          <span className="text-xs text-indigo-400">
            {dir.snippets?.length || 0} snippets
          </span>
        </div>
      </div>
    ))}
    {directories.length === 0 && (
      <p className="text-center text-indigo-400 py-4">No subdirectories found</p>
    )}
  </div>
);

// Updated DirectoryLayout main component
const DirectoryLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentDirectory, setCurrentDirectory] = useState(null);
  const [directoryStructure, setDirectoryStructure] = useState(null);
  const [showCreateSnippetModal, setShowCreateSnippetModal] = useState(false);
  const [showCreateDirectoryModal, setShowCreateDirectoryModal] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [showEditSnippetModal, setShowEditSnippetModal] = useState(false);
  const [showCheatSheetModal, setShowCheatSheetModal] = useState(false);
  const [showBulkDocumentationModal, setShowBulkDocumentationModal] = useState(false);
  const [snippetToEdit, setSnippetToEdit] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.selectedDirectory) {
      const directory = location.state.selectedDirectory;
      setCurrentDirectory(directory);
      setDirectoryStructure(buildDirectoryTree(directory));
    }
  }, [location.state]);

  const handleMove = async (sourceItem, targetDirectoryId) => {
    try {
      const endpoint = sourceItem.type === 'file' 
        ? `/api/snippets/${sourceItem.id}/move`
        : `/api/directories/${sourceItem.id}/move`;

      await axios.patch(endpoint, {
        targetDirectoryId
      });

      // Refresh directory data
      await fetchDirectoryData(currentDirectory._id);
    } catch (error) {
      console.error('Failed to move item:', error);
    }
  };

  const fetchDirectoryData = async (directoryId) => {
    try {
      const { data: directoryData } = await axios.get(`/api/directories/${directoryId}`);
      
      // Update both current directory and directory structure
      setCurrentDirectory(directoryData);
      setDirectoryStructure(buildDirectoryTree(directoryData));
      
      console.log('Directory Structure:', buildDirectoryTree(directoryData));
    } catch (error) {
      console.error('Failed to fetch directory data:', error);
    }
  };

  // Add a utility function to verify snippet data
  const validateSnippetData = (snippet) => {
    if (!snippet) return false;
    if (!snippet.title && !snippet.name) return false;
    if (!snippet._id) return false;
    return true;
  };

  // Add effect to refresh data when current directory changes
  useEffect(() => {
    if (currentDirectory?._id) {
      fetchDirectoryData(currentDirectory._id);
    }
  }, [currentDirectory?._id]);

  const handleItemCreated = async (newItem) => {
    console.log('Item created:', newItem);
    if (currentDirectory?._id) {
      await fetchDirectoryData(currentDirectory._id);
    }
  };

  useEffect(() => {
    // Initial load of root directory
    const fetchRootDirectory = async () => {
      try {
        const response = await axios.get('/api/directories/tree');
        setDirectoryStructure(response.data[0]); // Get the root directory
      } catch (error) {
        console.error('Error fetching directory tree:', error);
      }
    };
    
    fetchRootDirectory();
  }, []);

  const handleEditSnippet = (snippet) => {
    setSnippetToEdit(snippet);
    setShowEditSnippetModal(true);
  };

  const handleSnippetUpdated = async (updatedSnippet) => {
    console.log('Snippet updated:', updatedSnippet);
    
    // Update the selected snippet if it's the one that was edited
    if (selectedSnippet?._id === updatedSnippet._id) {
      setSelectedSnippet(updatedSnippet);
    }
    
    // Refresh directory data to show updated snippets
    if (currentDirectory?._id) {
      await fetchDirectoryData(currentDirectory._id);
    }
  };

  return (
    <>
      <ScrollbarStyles />
      <div className="min-h-screen bg-slate-900 pt-16">
        <Container>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar for desktop */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`hidden lg:block w-72 flex-shrink-0 ${isCollapsed ? 'w-20' : 'w-72'}`}
            >
              <div className="sticky top-20 space-y-6">
                <GlassCard
                  title={isCollapsed ? '' : 'Directory'}
                  icon={<FaFolder />}
                  action={
                    <div className="flex items-center gap-2">
                      {!isCollapsed && (
                        <IconButton
                          icon={<FaFileAlt size={14} />}
                          onClick={() => setShowBulkDocumentationModal(true)}
                          tooltip="Generate Documentation"
                        />
                      )}
                      <IconButton
                        icon={isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        tooltip={isCollapsed ? 'Expand' : 'Collapse'}
                      />
                    </div>
                  }
                >
                  {!isCollapsed && (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setShowCreateSnippetModal(true)}
                          className="flex-1"
                        >
                          <FaPlus size={12} />
                          New Snippet
                        </Button>
                        <Button
                          onClick={() => setShowCreateDirectoryModal(true)}
                          className="flex-1"
                        >
                          <FaFolder size={12} />
                          New Folder
                        </Button>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-slate-800/50 border border-slate-700/50 
                                   rounded-lg px-4 py-2 pl-10 text-slate-300 
                                   placeholder-slate-500 focus:outline-none 
                                   focus:border-slate-600/50"
                        />
                        <FaSearch className="absolute left-3 top-3 text-slate-500" />
                      </div>

                      <div className="h-[calc(100vh-20rem)] overflow-y-auto">
                        {directoryStructure ? (
                          <FileTreeNode
                            item={{
                              ...directoryStructure,
                              type: 'directory'
                            }}
                            onSelect={(item) => {
                              if (item.type === 'snippet') {
                                setSelectedSnippet(item);
                              } else {
                                setCurrentDirectory(item);
                                setSelectedSnippet(null);
                              }
                            }}
                          />
                        ) : (
                          <LoadingSpinner />
                        )}
                      </div>
                    </div>
                  )}
                </GlassCard>
              </div>
            </motion.div>

            {/* Mobile header */}
            <div className="lg:hidden sticky top-16 z-30 -mx-4 px-4 py-3 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/50">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold text-slate-200">
                  {currentDirectory?.name || 'Directory'}
                </h1>
                <IconButton
                  icon={<FaFolder />}
                  onClick={() => setIsMobileDrawerOpen(true)}
                  tooltip="Open menu"
                />
              </div>
            </div>

            {/* Main content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 min-w-0"
            >
              <div className="space-y-6">
                {selectedSnippet ? (
                  <SnippetDetails 
                    snippet={selectedSnippet}
                    onEditClick={handleEditSnippet}
                  />
                ) : currentDirectory ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-white">
                        {currentDirectory.name}
                      </h2>
                      <div className="flex items-center gap-2">
                        {currentDirectory.directSnippets?.length > 0 && (
                          <>
                            <Button 
                              onClick={() => setShowCheatSheetModal(true)}
                              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                            >
                              <FaBook size={14} />
                              Create Cheat Sheet
                            </Button>
                            <Button 
                              onClick={() => setShowBulkDocumentationModal(true)}
                              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                            >
                              <FaFileAlt size={14} />
                              Generate Docs
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <GlassCard
                      title="Directory Info"
                      icon={<FaFolderOpen />}
                    >
                      <DirectoryStats directory={currentDirectory} />
                    </GlassCard>

                    <GlassCard
                      title="Snippets"
                      icon={<FaCode />}
                    >
                      <SnippetList
                        snippets={currentDirectory.directSnippets}
                        onSnippetClick={setSelectedSnippet}
                      />
                    </GlassCard>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-400">Select a directory or snippet to view</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </Container>
      </div>

      {/* Mobile drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isMobileDrawerOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 20 }}
        className="fixed inset-y-0 right-0 w-full max-w-sm z-50 lg:hidden"
      >
        <div className="h-full bg-slate-900/95 backdrop-blur-xl border-l border-slate-800/50 shadow-xl">
          <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-200">Directory</h2>
            <IconButton
              icon={<FaChevronRight />}
              onClick={() => setIsMobileDrawerOpen(false)}
              tooltip="Close menu"
            />
          </div>
          <div className="p-4 space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowCreateSnippetModal(true);
                  setIsMobileDrawerOpen(false);
                }}
                className="flex-1"
              >
                <FaPlus size={12} />
                New Snippet
              </Button>
              <Button
                onClick={() => {
                  setShowCreateDirectoryModal(true);
                  setIsMobileDrawerOpen(false);
                }}
                className="flex-1"
              >
                <FaFolder size={12} />
                New Folder
              </Button>
            </div>
            
            <Button
              onClick={() => {
                setShowBulkDocumentationModal(true);
                setIsMobileDrawerOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <FaFileAlt size={14} />
              Generate Docs
            </Button>

            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 
                         rounded-lg px-4 py-2 pl-10 text-slate-300 
                         placeholder-slate-500 focus:outline-none 
                         focus:border-slate-600/50"
              />
              <FaSearch className="absolute left-3 top-3 text-slate-500" />
            </div>

            <div className="h-[calc(100vh-12rem)] overflow-y-auto">
              {directoryStructure ? (
                <FileTreeNode
                  item={{
                    ...directoryStructure,
                    type: 'directory'
                  }}
                  onSelect={(item) => {
                    if (item.type === 'snippet') {
                      setSelectedSnippet(item);
                    } else {
                      setCurrentDirectory(item);
                      setSelectedSnippet(null);
                    }
                    setIsMobileDrawerOpen(false);
                  }}
                />
              ) : (
                <LoadingSpinner />
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      <CreateSnippetModal
        isOpen={showCreateSnippetModal}
        onClose={() => setShowCreateSnippetModal(false)}
        onSnippetCreated={handleItemCreated}
      />
      <CreateDirectoryModal
        isOpen={showCreateDirectoryModal}
        onClose={() => setShowCreateDirectoryModal(false)}
        onDirectoryCreated={handleItemCreated}
      />
      <EditSnippetModal
        isOpen={showEditSnippetModal}
        onClose={() => {
          setShowEditSnippetModal(false);
          setSnippetToEdit(null);
        }}
        snippet={snippetToEdit}
        onSnippetUpdated={handleSnippetUpdated}
      />
      <CheatSheetModal
        isOpen={showCheatSheetModal}
        onClose={() => setShowCheatSheetModal(false)}
        snippets={currentDirectory?.directSnippets || []}
        directories={currentDirectory ? [currentDirectory] : []}
      />
      <BulkDocumentationModal
        isOpen={showBulkDocumentationModal}
        onClose={() => setShowBulkDocumentationModal(false)}
      />
    </>
  );
};

export default DirectoryLayout;
