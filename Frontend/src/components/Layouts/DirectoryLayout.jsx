import React, { useState, useMemo } from 'react';
import { 
  FaFolder, 
  FaFolderOpen, 
  FaChevronRight, 
  FaChevronDown,
  FaFile,
  FaPlus,
  FaTrash,
  FaEdit,
  FaSearch,
  FaList,
  FaTh
} from 'react-icons/fa';

const DirectoryItem = ({ item, level = 0, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (item.type === 'file') {
      onSelect(item);
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="ml-4">
      <div 
        className="flex items-center py-1 hover:bg-indigo-500/10 rounded cursor-pointer group" 
        onClick={handleClick}
      >
        <span onClick={() => setIsOpen(!isOpen)} className="mr-1 text-indigo-400">
          {item.type === 'directory' && (
            isOpen ? <FaChevronDown /> : <FaChevronRight />
          )}
        </span>
        <span className="mr-2">
          {item.type === 'directory' ? (
            isOpen ? <FaFolderOpen className="text-indigo-400" /> : <FaFolder className="text-indigo-400" />
          ) : (
            <FaFile className="text-indigo-300" />
          )}
        </span>
        <span className="text-indigo-100">{item.name}</span>
        <div className="ml-auto mr-2 opacity-0 group-hover:opacity-100">
          <button className="p-1 hover:bg-indigo-500/20 rounded"><FaEdit className="text-indigo-400" /></button>
          <button className="p-1 hover:bg-red-500/20 rounded"><FaTrash className="text-red-400" /></button>
        </div>
      </div>
      {item.type === 'directory' && isOpen && item.children && (
        <div className="ml-4">
          {item.children.map((child, index) => (
            <DirectoryItem key={index} item={child} level={level + 1} onSelect={onSelect} />
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

const ListView = ({ items, type, onSelect, searchTerm }) => {
  const filteredItems = useMemo(() => {
    const filtered = items.filter(item => 
      item.type === type && 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return filtered;
  }, [items, type, searchTerm]);

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-lg text-indigo-100 capitalize">{type}s</h3>
      <div className="space-y-1">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => (
            <div
              key={index}
              onClick={() => onSelect(item)}
              className="flex items-center p-2 hover:bg-indigo-500/10 rounded cursor-pointer group"
            >
              <span className="mr-2">
                {type === 'directory' ? <FaFolder className="text-indigo-400" /> : <FaFile className="text-indigo-300" />}
              </span>
              <span className="text-indigo-100">{item.name}</span>
            </div>
          ))
        ) : (
          <p className="text-indigo-400 text-sm">No {type}s found</p>
        )}
      </div>
    </div>
  );
};

const DirectoryLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const [showListView, setShowListView] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sample directory structure with content
  const directoryTree = {
    type: 'directory',
    name: 'Root',
    children: [
      {
        type: 'directory',
        name: 'JavaScript',
        children: [
          { 
            type: 'file', 
            name: 'arrays.js',
            content: 'const arr = [1, 2, 3];\nconsole.log(arr);',
            lastModified: '2024-01-20'
          },
          { type: 'file', name: 'functions.js' }
        ]
      },
      {
        type: 'directory',
        name: 'Python',
        children: [
          { type: 'file', name: 'lists.py' }
        ]
      }
    ]
  };

  const flattenedItems = useMemo(() => {
    const items = [];
    const flatten = (node) => {
      if (node.type === 'file' || node.type === 'directory') {
        items.push(node);
      }
      if (node.children) {
        node.children.forEach(flatten);
      }
    };
    flatten(directoryTree);
    return items;
  }, [directoryTree]);

  return (
    <div className="min-h-screen bg-[#070B14] pt-16"> {/* Added pt-16 for navbar */}
      <div className="flex h-[calc(100vh-4rem)]"> {/* Adjusted height to account for navbar */}
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
              {!isCollapsed && (
                <h2 className="text-lg font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                  Directory
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
            <div className="p-4">
              {/* Action Buttons */}
              <div className="mb-4 space-y-2">
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_25px_rgba(99,102,241,0.35)]">
                    <FaPlus /> New Snippet
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_25px_rgba(99,102,241,0.35)]">
                    <FaPlus /> New Folder
                  </button>
                </div>

                {/* View Toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowListView(false)}
                    className={`p-2 rounded-lg text-indigo-300 hover:text-white transition-colors duration-200 ${!showListView ? 'bg-indigo-500/10' : ''}`}
                  >
                    <FaTh />
                  </button>
                  <button
                    onClick={() => setShowListView(true)}
                    className={`p-2 rounded-lg text-indigo-300 hover:text-white transition-colors duration-200 ${showListView ? 'bg-indigo-500/10' : ''}`}
                  >
                    <FaList />
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#0B1120] border border-indigo-500/30 rounded-lg text-indigo-300 placeholder-indigo-400 focus:outline-none focus:border-indigo-400/60 transition-colors duration-200"
                  />
                </div>
              </div>

              {/* Directory Content */}
              <div className="overflow-y-auto max-h-[calc(100vh-16rem)]">
                {showListView ? (
                  <div className="space-y-6">
                    <ListView 
                      items={flattenedItems}
                      type="directory"
                      onSelect={setSelectedSnippet}
                      searchTerm={searchTerm}
                    />
                    <ListView 
                      items={flattenedItems}
                      type="file"
                      onSelect={setSelectedSnippet}
                      searchTerm={searchTerm}
                    />
                  </div>
                ) : (
                  <DirectoryItem item={directoryTree} onSelect={setSelectedSnippet} />
                )}
              </div>
            </div>
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
    </div>
  );
};

export default DirectoryLayout;
