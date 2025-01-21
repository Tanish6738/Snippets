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

const DirectoryItem = ({ item, level = 0, onSelect, onMove, currentDirectory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showDropZone, setShowDropZone] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (item.type === 'file') {
      onSelect(item);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleDragStart = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', JSON.stringify({
      id: item.id,
      type: item.type,
      name: item.name
    }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (item.type === 'directory') {
      setShowDropZone(true);
    }
  };

  const handleDragLeave = () => {
    setShowDropZone(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setShowDropZone(false);
    const droppedItem = JSON.parse(e.dataTransfer.getData('text/plain'));
    
    if (droppedItem.id !== item.id) {
      try {
        await onMove(droppedItem, item.id);
      } catch (error) {
        console.error('Failed to move item:', error);
      }
    }
  };

  // Add validation check before rendering
  if (!item || !item.name) return null;

  return (
    <div className="relative">
      <div 
        className={`
          flex items-center py-0.5 px-2
          hover:bg-indigo-500/10 rounded-none
          transition-colors duration-75
          ${showDropZone ? 'bg-indigo-500/20' : ''}
          ${level > 0 ? `ml-${level * 4}` : ''}
          group cursor-pointer
        `}
        onClick={handleClick}
        draggable={true}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span 
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }} 
          className={`
            w-4 h-4 flex items-center justify-center
            text-indigo-400/75 hover:text-indigo-300
            transition-transform duration-75
          `}
        >
          {item.type === 'directory' && (
            isOpen ? 
              <FaChevronDown className="w-3 h-3" /> : 
              <FaChevronRight className="w-3 h-3" />
          )}
        </span>
        <span className="w-5 h-5 flex items-center justify-center mx-1">
          {item.type === 'directory' ? (
            isOpen ? 
              <FaFolderOpen className="w-4 h-4 text-indigo-400/90" /> : 
              <FaFolder className="w-4 h-4 text-indigo-400/90" />
          ) : (
            <FaFile className="w-3.5 h-3.5 text-indigo-300/90" />
          )}
        </span>
        <span className="text-sm text-indigo-200/90 font-medium">{item.name}</span>
        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-75">
          <button className="p-1 hover:bg-indigo-500/20 rounded">
            <FaEdit className="w-3 h-3 text-indigo-400/75" />
          </button>
          <button className="p-1 hover:bg-red-500/20 rounded">
            <FaTrash className="w-3 h-3 text-red-400/75" />
          </button>
        </div>
      </div>
      {item.type === 'directory' && isOpen && item.children && (
        <div>
          {item.children.map((child, index) => (
            <DirectoryItem 
              key={index} 
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
      
      // Create directory structure based on received data
      const structure = {
        type: 'directory',
        name: directory.name,
        id: directory._id,
        path: directory.path,
        metadata: directory.metadata,
        children: [
          ...(directory.children || []).map(child => ({
            type: 'directory',
            name: child.name,
            id: child._id,
            path: child.path,
            children: child.children || []
          })),
          ...(directory.snippets || []).map(snippet => ({
            type: 'file',
            name: snippet.title,
            id: snippet._id,
            content: snippet.content,
            lastModified: new Date(snippet.updatedAt).toLocaleDateString(),
            programmingLanguage: snippet.programmingLanguage
          }))
        ]
      };
      
      setDirectoryStructure(structure);
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
      setCurrentDirectory(directoryData);
      
      const fetchSubdirectories = async (dir) => {
        if (!dir.children?.length) return [];
        
        const childPromises = dir.children.map(async (childId) => {
          const { data: child } = await axios.get(`/api/directories/${childId}`);
          const subdirs = await fetchSubdirectories(child);
          return {
            ...child,
            type: 'directory',
            children: subdirs
          };
        });
        
        return Promise.all(childPromises);
      };
      
      const [snippetResponses, subdirectories] = await Promise.all([
        Promise.all(directoryData.snippets.map(snippetId => 
          axios.get(`/api/snippets/${snippetId}`)
        )),
        fetchSubdirectories(directoryData)
      ]);

      const snippetsData = snippetResponses.map(response => response.data);
      
      const structure = {
        type: 'directory',
        name: directoryData.name,
        id: directoryData._id,
        path: directoryData.path,
        metadata: directoryData.metadata,
        children: [
          ...subdirectories.map(child => ({
            type: 'directory',
            name: child.name,
            id: child._id,
            path: child.path,
            metadata: child.metadata,
            children: child.children || []
          })),
          ...snippetsData.map(snippet => ({
            type: 'file',
            name: snippet.title,
            id: snippet._id,
            content: snippet.content,
            lastModified: new Date(snippet.updatedAt).toLocaleDateString(),
            programmingLanguage: snippet.programmingLanguage,
            description: snippet.description,
            visibility: snippet.visibility,
            tags: snippet.tags
          }))
        ].filter(Boolean)
      };
      
      setDirectoryStructure(structure);
    } catch (error) {
      console.error('Failed to fetch directory or snippets:', error);
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
    if (!directoryStructure || !directoryStructure.children) return null;

    return (
      <div className="space-y-1">
        <div className="text-indigo-400/75 text-xs px-2 py-1">
          {directoryStructure.path}
        </div>
        {directoryStructure.children
          .filter(item => 
            item?.name ? item.name.toLowerCase().includes((searchTerm || '').toLowerCase()) : false
          )
          .map((item, index) => (
            item && <DirectoryItem
              key={`${item.id}-${index}`}
              item={item}
              onSelect={(item) => {
                if (item.type === 'directory') {
                  setCurrentDirectory({
                    _id: item.id,
                    name: item.name,
                    path: item.path,
                    metadata: item.metadata
                  });
                } else {
                  setSelectedSnippet(item);
                }
              }}
              onMove={handleMove}
              currentDirectory={currentDirectory}
            />
          ))}
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
            {selectedSnippet ? (
              <SnippetDetails snippet={selectedSnippet} />
            ) : (
              <div className="text-center text-indigo-300 mt-10">
                Select a snippet to view or edit
              </div>
            )}
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
