import React, { useState, useMemo, useEffect } from 'react';
import { 
  FaFolder, 
  FaFolderOpen, 
  FaChevronRight, 
  FaChevronDown,
  FaFile,
  FaPlus,
  FaTrash,
  FaEdit,
  FaSearch
} from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import CreateSnippetModal from '../Modals/SnippetModals/CreateSnippetModal';
import CreateDirectoryModal from '../Modals/DirectoryModals/CreateDirectoryModal';
import axios from '../../Config/Axios';

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

// Add this FileTreeNode component
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
    <div className="select-none">
      <div
        className={`
          flex items-center py-1.5 px-2 
          hover:bg-indigo-500/10 rounded-lg 
          cursor-pointer
          ${level > 0 ? `ml-${level * 4}` : ''}
        `}
        onClick={handleClick}
      >
        <span className="w-4 h-4 flex items-center justify-center mr-1">
          {hasChildren && (
            <button
              onClick={handleExpandClick}
              className="text-indigo-400/75 hover:text-indigo-300"
            >
              {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
            </button>
          )}
        </span>

        <span className="w-5 h-5 flex items-center justify-center mr-2">
          {isDirectory ? (
            isExpanded ? (
              <FaFolderOpen className="w-4 h-4 text-indigo-400/90" />
            ) : (
              <FaFolder className="w-4 h-4 text-indigo-400/90" />
            )
          ) : (
            <FaFile className="w-4 h-4 text-indigo-300/90" />
          )}
        </span>

        <span className="text-sm text-indigo-200/90 font-medium flex-1">
          {item.name || item.title}
        </span>

        {/* Add open directory button for directories */}
        {isDirectory && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item);
            }}
            className="px-2 py-1 text-xs bg-indigo-500/20 hover:bg-indigo-500/30 
                     text-indigo-300 rounded-lg ml-2 flex items-center gap-1 
                     opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Open
          </button>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div>
          {/* Render child directories */}
          {item.children?.map((child) => (
            <FileTreeNode
              key={child._id}
              item={{ ...child, type: 'directory' }}
              level={level + 1}
              onSelect={onSelect}
            />
          ))}
          
          {/* Render snippets in this directory */}
          {item.directSnippets?.map((snippet) => (
            <FileTreeNode
              key={snippet._id}
              item={{ ...snippet, type: 'snippet' }}
              level={level + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SnippetDetails = ({ snippet }) => {
  return (
    <div className="space-y-4">
      <div className="border-b border-indigo-500/30 pb-4">
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
          {snippet.name}
        </h2>
        <p className="text-indigo-400">Last modified: {snippet.lastModified || 'Unknown'}</p>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-indigo-100">Code</h3>
          <button className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors duration-200">
            Edit
          </button>
        </div>
        <pre className="bg-[#0B1120] text-indigo-100 p-4 rounded-lg overflow-x-auto border border-indigo-500/30">
          <code>{snippet.content || '// No content available'}</code>
        </pre>
      </div>
    </div>
  );
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
const SnippetList = ({ snippets }) => {
  if (!snippets?.length) return (
    <div className="text-center text-indigo-400 py-8">
      No snippets in this directory
    </div>
  );

  return (
    <div className="space-y-2">
      {snippets.map((snippet, index) => (
        <div 
          key={snippet._id || `snippet-${index}`}
          className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 
                     hover:bg-indigo-500/10 transition-colors duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">{snippet.title}</h4>
              <p className="text-xs text-indigo-400">{snippet.programmingLanguage}</p>
            </div>
            <div className="flex items-center gap-2">
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

// Fix the MainContent component to include unique keys
const MainContent = ({ directory, selectedSnippet }) => {
  if (selectedSnippet) {
    return <SnippetDetails snippet={selectedSnippet} />;
  }

  if (!directory) {
    return (
      <div className="text-center text-indigo-300 mt-10">
        Select a directory to view its contents
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DirectoryStats directory={directory} />
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Snippets</h3>
        <SnippetList snippets={directory.directSnippets || []} />
      </div>
      
      {directory.children?.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Subdirectories</h3>
          <div className="grid grid-cols-3 gap-4">
            {directory.children.map(child => (
              <div 
                key={child._id || `dir-${child.name}`}
                className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 
                           hover:bg-indigo-500/10 transition-colors duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FaFolder className="text-indigo-400" />
                  <span className="text-white">{child.name}</span>
                </div>
                <div className="mt-2 text-xs text-indigo-400">
                  {child.snippets?.length || 0} snippets
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Update the DirectoryLayout component main render
const DirectoryLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentDirectory, setCurrentDirectory] = useState(null);
  const [directoryStructure, setDirectoryStructure] = useState(null);
  const [showCreateSnippetModal, setShowCreateSnippetModal] = useState(false);
  const [showCreateDirectoryModal, setShowCreateDirectoryModal] = useState(false);
  
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

  // Move renderSidebarContent inside component to access state
  const renderSidebarContent = () => (
    <div className="p-4 space-y-6">
      <div className="space-y-3">
        <button
          onClick={() => setShowCreateSnippetModal(true)}
          className="w-full px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 
                     text-indigo-300 rounded-lg flex items-center gap-2"
        >
          <FaPlus className="w-3 h-3" />
          <span>New Snippet</span>
        </button>
        
        <button
          onClick={() => setShowCreateDirectoryModal(true)}
          className="w-full px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 
                     text-indigo-300 rounded-lg flex items-center gap-2"
        >
          <FaFolder className="w-3 h-3" />
          <span>New Directory</span>
        </button>

        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-indigo-500/10 border border-indigo-500/20 
                       rounded-lg px-4 py-2 text-indigo-300 
                       placeholder-indigo-400/50 focus:outline-none 
                       focus:border-indigo-500/50"
          />
          <FaSearch className="absolute right-3 top-3 text-indigo-400/50" />
        </div>
      </div>

      {directoryStructure && (
        <div className="mt-6">
          <div className="text-xs text-indigo-400 uppercase mb-2 px-2">Files & Directories</div>
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
        </div>
      )}
    </div>
  );

  // Move modals outside of sidebar
  return (
    <div className="min-h-screen bg-[#070B14] pt-16">
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className={`
          bg-[#0B1120]/80 backdrop-blur-xl 
          border-r border-indigo-500/20 
          shadow-lg shadow-indigo-500/10
          ${isCollapsed ? 'w-16' : 'w-72'} 
          transition-all duration-300
          overflow-y-auto
        `}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-indigo-500/20">
            <div className="flex justify-between items-center">
              {!isCollapsed && currentDirectory && (
                <h2 className="text-lg font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent truncate">
                  {currentDirectory.name}
                </h2>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 hover:bg-indigo-500/10 rounded text-indigo-300 hover:text-white transition-colors duration-200"
              >
                {isCollapsed ? <FaChevronRight /> : <FaChevronDown />}
              </button>
            </div>
          </div>
          
          {/* Sidebar Content */}
          {!isCollapsed && renderSidebarContent()}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="bg-[#0B1120]/80 backdrop-blur-xl h-full rounded-2xl p-6 border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
            <MainContent 
              directory={currentDirectory}
              selectedSnippet={selectedSnippet}
            />
          </div>
        </div>
      </div>

      {/* Modals - Moved outside the sidebar/main content layout */}
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
    </div>
  );
};

export default DirectoryLayout;
