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

// Update the DirectoryItem component to handle the new structure
const DirectoryItem = ({ item, level = 0, onSelect, onMove, currentDirectory }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Modify to handle both direct and inherited snippets
  const snippetCount = item.allSnippets?.length || 0;
  const directSnippetCount = item.snippets?.length || 0;

  return (
    <div className="relative">
      <div 
        className={`
          flex items-center py-1 px-2
          hover:bg-indigo-500/10 rounded-lg
          transition-colors duration-75
          ${level > 0 ? `ml-${level * 4}` : ''}
          group cursor-pointer
        `}
        onClick={() => onSelect(item)}
      >
        <span className="w-4 h-4 flex items-center justify-center">
          {item.children?.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="text-indigo-400/75 hover:text-indigo-300"
            >
              {isOpen ? <FaChevronDown /> : <FaChevronRight />}
            </button>
          )}
        </span>
        
        <span className="w-5 h-5 flex items-center justify-center mx-1">
          {isOpen ? 
            <FaFolderOpen className="w-4 h-4 text-indigo-400/90" /> : 
            <FaFolder className="w-4 h-4 text-indigo-400/90" />
          }
        </span>
        
        <span className="text-sm text-indigo-200/90 font-medium flex-1">
          {item.name}
        </span>
        
        <span className="text-xs text-indigo-400/75">
          {directSnippetCount > 0 && `${directSnippetCount} direct`}
          {directSnippetCount > 0 && snippetCount - directSnippetCount > 0 && ' + '}
          {snippetCount - directSnippetCount > 0 && `${snippetCount - directSnippetCount} inherited`}
        </span>
      </div>

      {isOpen && item.children?.length > 0 && (
        <div className="ml-4">
          {item.children.map((child, index) => (
            <DirectoryItem
              key={child._id || index}
              item={child}
              level={level + 1}
              onSelect={onSelect}
              onMove={onMove}
              currentDirectory={currentDirectory}
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
      {snippets.map(snippet => (
        <div 
          key={snippet._id}
          className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 
                     hover:bg-indigo-500/10 transition-colors duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">{snippet.title}</h4>
              <p className="text-xs text-indigo-400">{snippet.programmingLanguage}</p>
            </div>
            <div className="flex items-center gap-2">
              {snippet.tags?.map(tag => (
                <span 
                  key={`${snippet._id}-${tag}`}
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

  const renderSidebarContent = () => (
    <div className="p-4 space-y-6">
      <div className="space-y-3">
        <div className="flex gap-2">
          <button 
            onClick={() => setShowCreateSnippetModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white
              bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 
              transition-all duration-300 shadow-lg shadow-indigo-500/25"
          >
            <FaPlus className="w-4 h-4" /> New Snippet
          </button>
          <button 
            onClick={() => setShowCreateDirectoryModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white
              bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 
              transition-all duration-300 shadow-lg shadow-blue-500/25"
          >
            <FaPlus className="w-4 h-4" /> New Folder
          </button>
        </div>

        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0B1120] border border-indigo-500/30 rounded-xl
              text-indigo-300 placeholder-indigo-400 focus:outline-none focus:border-indigo-400/60
              transition-colors duration-200"
          />
        </div>
      </div>

      {currentDirectory && (
        <SidebarSection title="Directory Info">
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <div className="space-y-2 text-sm text-indigo-300">
              <div className="flex justify-between">
                <span>Snippets:</span>
                <span className="font-medium text-indigo-200">{currentDirectory.metadata?.snippetCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Subdirectories:</span>
                <span className="font-medium text-indigo-200">{currentDirectory.metadata?.subDirectoryCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Created:</span>
                <span className="font-medium text-indigo-200">
                  {new Date(currentDirectory.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </SidebarSection>
      )}

      <SidebarSection title="Contents">
        {renderDirectoryContents()}
      </SidebarSection>
    </div>
  );

  // Add this new function to render directory contents
  const renderDirectoryContents = () => {
    if (!directoryStructure) return null;

    const snippets = directoryStructure.directSnippets || [];
    const children = directoryStructure.children || [];

    return (
      <div className="space-y-4">
        {/* Directories */}
        {children.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-indigo-400 uppercase">Directories</div>
            {children
              .filter(dir => dir && dir.name && dir.name.toLowerCase().includes((searchTerm || '').toLowerCase()))
              .map(dir => (
                <DirectoryItem
                  key={dir._id || Math.random()}
                  item={{
                    ...dir,
                    type: 'directory',
                    name: dir.name || 'Unnamed Directory',
                    children: dir.children || [],
                    directSnippets: dir.directSnippets || [],
                    allSnippets: dir.allSnippets || []
                  }}
                  onSelect={() => fetchDirectoryData(dir._id)}
                  onMove={handleMove}
                  currentDirectory={currentDirectory}
                />
              ))}
          </div>
        )}

        {/* Snippets */}
        {snippets.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-indigo-400 uppercase">Snippets</div>
            {snippets
              .filter(snippet => snippet && snippet.title && snippet.title.toLowerCase().includes((searchTerm || '').toLowerCase()))
              .map(snippet => (
                <div
                  key={snippet._id || Math.random()}
                  onClick={() => setSelectedSnippet(snippet)}
                  className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20 
                           hover:bg-indigo-500/10 transition-colors duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FaFile className="text-indigo-400" />
                    <span className="text-white">{snippet.title || 'Untitled'}</span>
                  </div>
                  <div className="mt-1 text-xs text-indigo-400">
                    {snippet.programmingLanguage || 'No language specified'}
                  </div>
                </div>
              ))}
          </div>
        )}

        {(!children.length && !snippets.length) && (
          <div className="text-center text-indigo-400 py-4">
            No items in this directory
          </div>
        )}
      </div>
    );
  };

  // Move modals outside of sidebar
  return (
    <div className="min-h-screen bg-[#070B14] pt-16">
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className={`
          bg-[#0B1120]/80 backdrop-blur-xl 
          border-r border-indigo-500/20 
          shadow-lg shadow-indigo-500/10
          ${isCollapsed ? 'w-16' : 'w-64'} 
          transition-all duration-300
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
          {!isCollapsed && (
            <>
              {renderSidebarContent()}
              {renderDirectoryContents()}
            </>
          )}
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
