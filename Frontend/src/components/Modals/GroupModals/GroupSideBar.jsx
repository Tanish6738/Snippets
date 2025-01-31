import React, { useState } from 'react';
import { 
  FaUsers, 
  FaFolder, 
  FaChevronRight,
  FaChevronLeft,
  FaPlus,
  FaSearch,
  FaArrowLeft,
  FaCode,
  FaFolderOpen
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const FileTreeNode = ({ item, level = 0, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!item) return null;

  const hasChildren = item.type === 'directory' && 
    (item.children?.length > 0 || item.directSnippets?.length > 0);

  return (
    <div className="select-none">
      <div
        className={`
          flex items-center py-1.5 px-2 
          hover:bg-indigo-500/10 rounded-lg 
          cursor-pointer
          ${level > 0 ? 'ml-' + (level * 4) : ''}
        `}
        onClick={() => {
          if (hasChildren) {
            setIsExpanded(!isExpanded);
          }
          onSelect(item);
        }}
      >
        <span className="w-4 h-4 flex items-center justify-center mr-1">
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-indigo-400/75 hover:text-indigo-300"
            >
              {isExpanded ? (
                <FaChevronRight size={12} />
              ) : (
                <FaChevronLeft size={12} />
              )}
            </button>
          )}
        </span>

        <span className="w-5 h-5 flex items-center justify-center mr-2">
          {item.type === 'directory' ? (
            isExpanded ? (
              <FaFolderOpen className="w-4 h-4 text-indigo-400/90" />
            ) : (
              <FaFolder className="w-4 h-4 text-indigo-400/90" />
            )
          ) : (
            <FaCode className="w-4 h-4 text-indigo-300/90" />
          )}
        </span>

        <span className="text-sm text-indigo-200/90 font-medium flex-1">
          {item.name || item.title}
        </span>

        {item.type === 'directory' && item.snippetCount > 0 && (
          <span className="text-xs text-indigo-400/60">
            ({item.snippetCount})
          </span>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div>
          {item.children?.map((child) => (
            <FileTreeNode
              key={child._id}
              item={child}
              level={level + 1}
              onSelect={onSelect}
            />
          ))}
          
          {item.directSnippets?.map((snippet) => (
            <FileTreeNode
              key={snippet._id}
              item={{...snippet, type: 'snippet'}}
              level={level + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const GroupSideBar = ({
  isMobile,
  isSidebarOpen,
  setSidebarOpen,
  isSidebarCollapsed,
  setSidebarCollapsed,
  groupData,
  activeTab,
  setActiveTab,
  members,
  setAddMemberModalOpen,
  setCreateSnippetModalOpen,
  setBulkCreateSnippetModalOpen,
  setCreateDirectoryModalOpen,
  directoryStructure,
  onSelectItem,
  searchTerm,
  setSearchTerm
}) => {
  return (
    <motion.div 
      initial={isMobile ? { x: -320 } : false}
      animate={{ 
        x: isSidebarOpen ? 0 : -320,
        width: isSidebarCollapsed ? 80 : 320
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`
        fixed md:relative
        bg-gradient-to-b from-[#0B1120]/95 to-[#0D1428]/95
        border-r border-indigo-500/10
        h-full z-50 md:translate-x-0
        touch-pan-y
        md:rounded-2xl md:m-4 md:h-[calc(100vh-7rem)]
        shadow-2xl shadow-indigo-500/5
      `}
    >
      {/* Mobile Sidebar Header */}
      {isMobile && (
        <div className="p-4 flex items-center gap-3 border-b border-indigo-500/20">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg"
          >
            <FaArrowLeft />
          </button>
          <h2 className="text-lg font-semibold text-indigo-300">{groupData.name}</h2>
        </div>
      )}

      {/* Group Header */}
      <div className="p-4 border-b border-indigo-500/20">
        <div className="flex items-center justify-between">
          {!isSidebarCollapsed && (
            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
              {groupData.name}
            </h2>
          )}
          <button
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 text-indigo-400 hover:text-indigo-300"
          >
            {isSidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>
      </div>

      {/* Sidebar Tabs */}
      <div className="flex border-b border-indigo-500/20">
        <button
          onClick={() => setActiveTab('members')}
          className={`
            flex-1 p-3 text-sm font-medium
            ${activeTab === 'members' 
              ? 'text-indigo-400 border-b-2 border-indigo-500' 
              : 'text-indigo-400/60 hover:text-indigo-400'
            }
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <FaUsers />
            {!isSidebarCollapsed && <span>Members</span>}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`
            flex-1 p-3 text-sm font-medium
            ${activeTab === 'files' 
              ? 'text-indigo-400 border-b-2 border-indigo-500' 
              : 'text-indigo-400/60 hover:text-indigo-400'
            }
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <FaFolder />
            {!isSidebarCollapsed && <span>Files</span>}
          </div>
        </button>
      </div>

      {/* Sidebar Content */}
      <div className="p-4">
        {/* Search */}
        {!isSidebarCollapsed && (
          <div className="relative mb-4">
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
        )}

        {/* Content based on active tab */}
        {activeTab === 'members' ? (
          <div className="space-y-2">
            {!isSidebarCollapsed && (
              <button 
                onClick={() => setAddMemberModalOpen(true)}
                className="w-full px-4 py-2 bg-indigo-500/20 
                          hover:bg-indigo-500/30 text-indigo-300 
                          rounded-lg flex items-center gap-2"
              >
                <FaPlus className="w-3 h-3" />
                <span>Invite Member</span>
              </button>
            )}
            
            <div className="space-y-2 mt-4">
              {members.map((member) => (
                <div 
                  key={member.userId._id}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg
                            bg-indigo-500/10 hover:bg-indigo-500/20"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-500/30 
                                flex items-center justify-center text-indigo-300">
                    {member.userId.username?.charAt(0).toUpperCase()}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-indigo-200 truncate">
                        {member.userId.username}
                      </div>
                      <div className="text-xs text-indigo-400">
                        {member.role}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {!isSidebarCollapsed && (
              <div className="space-y-2">
                <button 
                  onClick={() => setCreateSnippetModalOpen(true)}
                  className="w-full px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 
                            text-indigo-300 rounded-lg flex items-center gap-2"
                >
                  <FaPlus className="w-3 h-3" />
                  <span>New Snippet</span>
                </button>
                <button 
                  onClick={() => setBulkCreateSnippetModalOpen(true)}
                  className="w-full px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 
                            text-indigo-300 rounded-lg flex items-center gap-2"
                >
                  <FaPlus className="w-3 h-3" />
                  <span>Bulk Create Snippets</span>
                </button>
                <button 
                  onClick={() => setCreateDirectoryModalOpen(true)}
                  className="w-full px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 
                            text-indigo-300 rounded-lg flex items-center gap-2"
                >
                  <FaFolder className="w-3 h-3" />
                  <span>New Directory</span>
                </button>
              </div>
            )}
            <div className="space-y-4">
              {directoryStructure && (
                <FileTreeNode
                  item={directoryStructure}
                  onSelect={onSelectItem}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

GroupSideBar.propTypes = {
  isMobile: PropTypes.bool.isRequired,
  isSidebarOpen: PropTypes.bool.isRequired,
  setSidebarOpen: PropTypes.func.isRequired,
  isSidebarCollapsed: PropTypes.bool.isRequired,
  setSidebarCollapsed: PropTypes.func.isRequired,
  groupData: PropTypes.object.isRequired,
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
  members: PropTypes.array.isRequired,
  setAddMemberModalOpen: PropTypes.func.isRequired,
  setCreateSnippetModalOpen: PropTypes.func.isRequired,
  setBulkCreateSnippetModalOpen: PropTypes.func.isRequired,
  setCreateDirectoryModalOpen: PropTypes.func.isRequired,
  directoryStructure: PropTypes.object,
  onSelectItem: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired
};

export default GroupSideBar;
