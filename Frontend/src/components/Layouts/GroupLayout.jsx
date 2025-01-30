import React, { useState, useEffect, useRef } from 'react';
import { 
  FaUsers, 
  FaComments, 
  FaFolder, 
  FaChevronRight,
  FaChevronLeft,
  FaPlus,
  FaSearch,
  FaBars,
  FaArrowLeft,
  FaPaperPlane,
  FaSpinner,
  FaCode,
  FaChevronDown,
  FaFolderOpen,
  FaCodeBranch,
  FaDatabase
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import AddMemberModal from '../Modals/GroupModals/AddMemberModal';
import CreateSnippetModal from '../Modals/SnippetModals/CreateSnippetModal';
import BulkCreateSnippetModal from '../Modals/SnippetModals/BulkCreateSnippetModal';
import EditSnippetDetailsModal from '../Modals/SnippetModals/EditSnippetDetailsModal';
import ExportSnippetModal from '../Modals/SnippetModals/ExportSnippetModal';
import CreateDirectoryModal from '../Modals/DirectoryModals/CreateDirectoryModal';
import EditDirectoryDetails from '../Modals/DirectoryModals/EditDirectoryDetails';
import ExportDirectoryModal from '../Modals/DirectoryModals/ExportDirectoryModal';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from '../../Config/Axios';

// Add these utility functions at the top of GroupLayout.jsx

// Function to build the directory structure
const buildDirectoryTree = (directories, snippets) => {
  if (!directories || !snippets) {
    console.error('Invalid input to buildDirectoryTree');
    return null;
  }

  // Create a map of directory IDs to their snippets
  const directorySnippets = new Map();
  
  // Map snippets to their directories
  snippets.forEach(snippet => {
    if (snippet.directoryId) {
      if (!directorySnippets.has(snippet.directoryId)) {
        directorySnippets.set(snippet.directoryId, []);
      }
      directorySnippets.get(snippet.directoryId).push(snippet);
    }
  });

  // Process directory with error handling
  const processDirectory = (directory) => {
    if (!directory) return null;

    const dirSnippets = directorySnippets.get(directory._id) || [];
    
    return {
      _id: directory._id,
      type: 'directory',
      name: directory.name,
      path: directory.path || [],
      level: directory.level || 0,
      isRoot: directory.isRoot || false,
      metadata: directory.metadata || {},
      children: directories
        .filter(d => d.parentId === directory._id)
        .map(child => processDirectory(child))
        .filter(Boolean), // Remove null results
      directSnippets: dirSnippets,
      allSnippets: directory.allSnippets || [],
      visibility: directory.visibility,
      createdAt: directory.createdAt
    };
  };

  const rootDirectory = directories.find(dir => dir.isRoot);
  if (!rootDirectory) {
    console.error('No root directory found');
    return null;
  }

  return processDirectory(rootDirectory);
};

// Function to format directory size
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const GroupLayout = () => {
  const { groupId } = useParams(); // Get groupId from URL params
  const location = useLocation();
  const navigate = useNavigate();
  const receivedGroupDetails = location.state?.groupDetails;

  // Add state for received group details
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isChatOpen, setChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('members');
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const mainContentRef = useRef(null);
  const [isCreateSnippetModalOpen, setCreateSnippetModalOpen] = useState(false);
  const [isBulkCreateSnippetModalOpen, setBulkCreateSnippetModalOpen] = useState(false);
  const [isEditSnippetModalOpen, setEditSnippetModalOpen] = useState(false);
  const [isExportSnippetModalOpen, setExportSnippetModalOpen] = useState(false);
  const [isCreateDirectoryModalOpen, setCreateDirectoryModalOpen] = useState(false);
  const [isEditDirectoryModalOpen, setEditDirectoryModalOpen] = useState(false);
  const [isExportDirectoryModalOpen, setExportDirectoryModalOpen] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const [selectedDirectory, setSelectedDirectory] = useState(null);
  const [directories, setDirectories] = useState([]);
  const [snippets, setSnippets] = useState([]);
  const [directoryStructure, setDirectoryStructure] = useState(null);
  const [currentDirectory, setCurrentDirectory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [groupData, setGroupData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
        setChatOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Enhanced group data fetching with better state management
  const fetchGroupData = async () => {
    if (!groupId) {
      setIsLoading(false);
      return;
    }
  
    try {
      setIsLoading(true);
      setFetchError(null);
  
      // If we have received group details from navigation state, use that first
      if (receivedGroupDetails) {
        setGroupData(receivedGroupDetails);
        setMembers(receivedGroupDetails.members || []);
        setIsLoading(false);
        return;
      }
  
      // Otherwise fetch from API
      const response = await axios.get(`/api/groups/${groupId}`);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
  
      setGroupData(response.data);
      setMembers(response.data.members || []);
  
    } catch (err) {
      const errorDetail = {
        message: err.response?.data?.error || err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        timestamp: new Date().toISOString()
      };
      console.error('Error fetching group data:', errorDetail);
      setFetchError(errorDetail.message);
      
      // If we have receivedGroupDetails as fallback, use it
      if (receivedGroupDetails) {
        setGroupData(receivedGroupDetails);
        setMembers(receivedGroupDetails.members || []);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update the useEffect for fetchGroupData
  useEffect(() => {
    if (groupId) {
      fetchGroupData();
    }
  }, [groupId, receivedGroupDetails]);
  
  const handleMemberAdded = async () => {
    try {
        setIsLoading(true);
        setFetchError(null);

        const response = await axios.get(`/api/groups/${groupId}`);
        
        if (!response.data) {
            throw new Error('No data received from server');
        }

        setGroupData(response.data);
        setMembers(response.data.members || []);

    } catch (err) {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to refresh members';
        console.error('Error refreshing members:', {
            message: errorMessage,
            status: err.response?.status
        });
        setFetchError(errorMessage);
    } finally {
        setIsLoading(false);
    }
};

  // Add debug logs for loading state
  useEffect(() => {
    console.log('Loading state changed:', isLoading);
  }, [isLoading]);

  // Modified loading check
  const isInitialLoading = isLoading && !groupData;

  // Add debug logs for state changes
  useEffect(() => {
    console.log('Group state updated:', {
      isLoading,
      hasGroupData: !!groupData,
      membersCount: members.length,
      error: fetchError
    });
  }, [isLoading, groupData, members, fetchError]);

  // Fetch snippets and directories
  const fetchGroupContent = async () => {
    try {
      
      // Fetch snippets
      const snippetsResponse = await fetch(`/api/groups/${groupId}/snippets`, {
          headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
      });
      const snippetsData = await snippetsResponse.json();
      
      if (!snippetsResponse.ok) throw new Error(snippetsData.error);
      
      setSnippets(snippetsData);

      // Fetch directories
      const directoriesResponse = await fetch(`/api/groups/${groupId}/directories`, {
          headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
      });
      const directoriesData = await directoriesResponse.json();
      
      if (!directoriesResponse.ok) throw new Error(directoriesData.error);
      
      setDirectories(directoriesData);
      
      // Build directory structure
      const structure = buildDirectoryTree(directoriesData, snippetsData);
      setDirectoryStructure(structure);
      
      // Update current directory info
      if (structure) {
          setCurrentDirectory({
              name: structure.name,
              snippetCount: snippetsData.length,
              childrenCount: structure.children?.length || 0
          });
      }
  } catch (error) {
      console.error('Error fetching group content:', error);
      setFetchError(error.message);
  }
};

  const refreshContent = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleItemCreated = async () => {
    // Add a small delay to allow backend to process the new item
    await new Promise(resolve => setTimeout(resolve, 1000));
    await fetchGroupContent();
  };

  // Update useEffect to fetch content when group data is available
  useEffect(() => {
    if (groupId && groupData) {
      fetchGroupContent();
    }
  }, [groupId, groupData]);

  // Modified loading condition
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#070B14] to-[#0B1120] 
                    flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-indigo-500 mx-auto mb-4" size={40} />
          <p className="text-indigo-300">Loading group data...</p>
          <p className="text-xs text-indigo-400 mt-2">Group ID: {groupId}</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#070B14] to-[#0B1120] 
                    flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{fetchError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-lg text-indigo-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Early return if no group data
  if (!groupData && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#070B14] to-[#0B1120] 
                    flex items-center justify-center">
        <div className="text-center">
          <p className="text-indigo-400 mb-4">Group not found</p>
          <button 
            onClick={() => navigate('/groups')}
            className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-lg text-indigo-300"
          >
            Return to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#070B14] to-[#0B1120]">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 
                    bg-gradient-to-r from-[#0B1120]/95 to-[#0D1428]/95
                    border-b border-indigo-500/10 flex items-center px-4 z-50
                    backdrop-blur-2xl">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg
                   active:scale-95 transition-transform"
        >
          <FaBars size={18} />
        </button>
        <h1 className="text-lg font-semibold text-indigo-300 mx-auto">
          {groupData.name}
        </h1>
        <button
          onClick={() => setChatOpen(true)}
          className="p-2.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg
                   active:scale-95 transition-transform"
        >
          <FaComments size={18} />
        </button>
      </div>

      <div className="flex h-screen md:h-[calc(100vh-4rem)] pt-16 md:pt-20">
        {/* Sidebar */}
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
          `}>
          {/* Mobile Sidebar Header */}
          {isMobile && (
            <div className="p-4 flex items-center gap-3 border-b border-indigo-500/20">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg"
              >
                <FaArrowLeft />
              </button>
              <h2 className="text-lg font-semibold text-indigo-300">Group Name</h2>
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
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-indigo-200 truncate">
                          {member.userId.username}
                        </div>
                        <div className="text-xs text-indigo-400">
                          {member.role}
                        </div>
                      </div>
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
                      onSelect={(item) => {
                        if (item.type === 'snippet') {
                          setSelectedSnippet(item);
                          setCurrentDirectory(null);
                        } else {
                          setCurrentDirectory(item);
                          setSelectedSnippet(null);
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Chat Panel */}
        <motion.div 
          initial={{ x: 384 }}
          animate={{ x: isChatOpen ? 0 : 384 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`
            fixed right-0 top-0 bottom-0 md:bottom-4
            bg-gradient-to-b from-[#0B1120]/95 to-[#0D1428]/95
            border-l border-indigo-500/10
            z-50 w-96 flex flex-col
            md:top-20 shadow-2xl shadow-indigo-500/5
            md:rounded-2xl md:mr-4
          `}>
          {/* Mobile Chat Header */}
          <div className="shrink-0 p-4 border-b border-indigo-500/20 flex items-center gap-3">
            {isMobile ? (
              <button
                onClick={() => setChatOpen(false)}
                className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg"
              >
                <FaArrowLeft />
              </button>
            ) : (
              <button
                onClick={() => setChatOpen(false)}
                className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg"
              >
                <FaChevronRight />
              </button>
            )}
            <h3 className="text-lg font-semibold text-indigo-300">Group Chat</h3>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Messages would go here */}
          </div>

          {/* Chat Input - Fixed at bottom */}
          <div className="shrink-0 p-3 border-t border-indigo-500/20 bg-[#0B1120]/95 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-indigo-500/10 border border-indigo-500/20 
                         rounded-lg px-4 py-2.5 text-indigo-300 
                         placeholder-indigo-400/50 focus:outline-none 
                         focus:border-indigo-500/50"
              />
              <button className="p-2.5 bg-indigo-500 text-white rounded-lg
                             hover:bg-indigo-600 active:scale-95 transition-all">
                <FaPaperPlane size={16} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          <motion.div 
            layout
            className={`
              flex-1 p-6 md:p-8
              transition-all duration-300 ease-out
              ${!isMobile && isChatOpen ? 'mr-96' : ''}
              relative
            `}>
            <div className="bg-gradient-to-br from-[#0B1120]/90 to-[#0D1428]/90 
                          backdrop-blur-2xl h-full 
                          rounded-2xl p-6 md:p-8
                          border border-indigo-500/10
                          shadow-2xl shadow-indigo-500/5">
              <MainContent 
                directory={currentDirectory}
                selectedSnippet={selectedSnippet}
                searchTerm={debouncedSearchTerm}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Chat Toggle Button */}
      {!isChatOpen && !isMobile && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setChatOpen(true)}
          className="fixed bottom-8 right-8 p-4 rounded-xl
                     bg-gradient-to-br from-indigo-500 to-indigo-600
                     text-white shadow-lg shadow-indigo-500/20
                     hover:shadow-xl hover:shadow-indigo-500/30
                     transition-all duration-300"
        >
          <FaComments size={20} />
        </motion.button>
      )}

      <AddMemberModal 
        isOpen={isAddMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        groupId={groupId}
        onMemberAdded={handleMemberAdded}
        currentMembers={members} // Make sure members array is properly structured
      />

      {/* Snippet Modals */}
      <CreateSnippetModal
        isOpen={isCreateSnippetModalOpen}
        onClose={() => setCreateSnippetModalOpen(false)}
        onSnippetCreated={async (snippet) => {
          await handleItemCreated();
          setCreateSnippetModalOpen(false);
        }}
        group={groupData} // Pass the group data
      />

      <BulkCreateSnippetModal
        isOpen={isBulkCreateSnippetModalOpen}
        onClose={() => setBulkCreateSnippetModalOpen(false)}
        onSnippetsCreated={(snippets) => {
          // Handle newly created snippets
        }}
        group={groupData} // Pass the group data
      />

      <EditSnippetDetailsModal
        isOpen={isEditSnippetModalOpen}
        onClose={() => setEditSnippetModalOpen(false)}
        snippet={selectedSnippet}
        onSnippetUpdated={(updatedSnippet) => {
          // Handle updated snippet
        }}
      />

      <ExportSnippetModal
        isOpen={isExportSnippetModalOpen}
        onClose={() => setExportSnippetModalOpen(false)}
        itemId={selectedSnippet?._id}
        itemType="snippet"
      />

      {/* Directory Modals */}
      <CreateDirectoryModal
        isOpen={isCreateDirectoryModalOpen}
        onClose={() => setCreateDirectoryModalOpen(false)}
        onDirectoryCreated={async (directory) => {
          await handleItemCreated();
          setCreateDirectoryModalOpen(false);
        }}
        groupId={groupId}
      />

      <EditDirectoryDetails
        isOpen={isEditDirectoryModalOpen}
        onClose={() => setEditDirectoryModalOpen(false)}
        directoryId={selectedDirectory?._id}
        onDirectoryUpdated={(updatedDirectory) => {
          // Handle updated directory
        }}
      />

      <ExportDirectoryModal
        isOpen={isExportDirectoryModalOpen}
        onClose={() => setExportDirectoryModalOpen(false)}
        directoryId={selectedDirectory?._id}
      />
    </div>
  );
};

const FileTreeNode = ({ item, level = 0, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isDirectory = item.type === 'directory';
  const hasChildren = isDirectory && (
    (item.children?.length > 0) || (item.directSnippets?.length > 0)
  );

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
            <FaCode className="w-4 h-4 text-indigo-300/90" />
          )}
        </span>

        <span className="text-sm text-indigo-200/90 font-medium flex-1">
          {item.name || item.title}
        </span>

        {isDirectory && (
          <span className="text-xs text-indigo-400">
            {(item.directSnippets?.length || 0) + (item.children?.length || 0)} items
          </span>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div>
          {/* Show direct snippets first */}
          {item.directSnippets?.map((snippet) => (
            <FileTreeNode
              key={snippet._id}
              item={{ ...snippet, type: 'snippet' }}
              level={level + 1}
              onSelect={onSelect}
            />
          ))}
          
          {/* Then show subdirectories */}
          {item.children?.map((child) => (
            <FileTreeNode
              key={child._id}
              item={child}
              level={level + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SnippetContent = ({ snippet }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
        {snippet.title}
      </h2>
      <div className="flex gap-2">
        <button className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors">
          Edit
        </button>
        <button className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors">
          Export
        </button>
      </div>
    </div>
    
    <div className="bg-[#0B1120] rounded-xl border border-indigo-500/20 p-4 overflow-x-auto">
      <pre className="text-indigo-100">
        <code>{snippet.content}</code>
      </pre>
    </div>
  </div>
);

// Add the StatBox component definition before DirectoryStats
const StatBox = ({ label, value, icon }) => (
  <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
    <div className="flex items-center gap-2 text-indigo-400 mb-1">
      {icon}
      <span className="text-xs uppercase">{label}</span>
    </div>
    <div className="text-xl font-semibold text-white">{value}</div>
  </div>
);

const DirectoryStats = ({ directory }) => {
  if (!directory) return null;

  return (
    <div className="bg-[#0B1120]/80 rounded-xl border border-indigo-500/20 p-6">
      <div className="flex items-center gap-4 mb-6">
        <FaFolderOpen className="text-2xl text-indigo-400" />
        <div>
          <h2 className="text-xl font-bold text-white">{directory.name}</h2>
          <p className="text-sm text-indigo-400">{directory.path}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox 
          label="Direct Snippets" 
          value={directory.directSnippets?.length || 0} 
          icon={<FaCode />}
        />
        <StatBox 
          label="All Snippets" 
          value={directory.allSnippets?.length || 0} 
          icon={<FaCodeBranch />}
        />
        <StatBox 
          label="Subdirectories" 
          value={directory.metadata?.subDirectoryCount || 0} 
          icon={<FaFolder />}
        />
        <StatBox 
          label="Total Size" 
          value={formatBytes(directory.metadata?.totalSize || 0)} 
          icon={<FaDatabase />}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="text-indigo-400">
          <span>Created: </span>
          <span>{new Date(directory.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="text-indigo-400">
          <span>Visibility: </span>
          <span className="capitalize">{directory.visibility}</span>
        </div>
      </div>
    </div>
  );
};

const MainContent = ({ directory, selectedSnippet, searchTerm }) => {
  // Add logging for current directory and snippets
  useEffect(() => {
    if (directory) {
      console.log('Current directory:', {
        name: directory.name,
        snippetCount: directory.directSnippets?.length || 0,
        childrenCount: directory.children?.length || 0
      });
    }
  }, [directory]);

  if (!directory && !selectedSnippet) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-indigo-400">Select a directory or snippet to view</p>
      </div>
    );
  }

  if (selectedSnippet) {
    return <SnippetContent snippet={selectedSnippet} />;
  }

  // Search functionality
  const searchItems = (items, term) => {
    if (!term) return items;
    return items.filter(item => 
      item.name?.toLowerCase().includes(term.toLowerCase()) ||
      item.title?.toLowerCase().includes(term.toLowerCase())
    );
  };

  const filteredSnippets = searchItems(directory.directSnippets || [], searchTerm);
  const filteredDirectories = searchItems(directory.children || [], searchTerm);

  return (
    <div className="space-y-6">
      {/* Directory Header */}
      {!searchTerm && (
        <DirectoryStats directory={directory} />
      )}

      {/* Snippets */}
      {filteredSnippets.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">
            {searchTerm ? 'Matching Snippets' : 'Snippets'}
          </h3>
          <SnippetList snippets={filteredSnippets} />
        </div>
      )}

      {/* Directories */}
      {filteredDirectories.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">
            {searchTerm ? 'Matching Directories' : 'Subdirectories'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDirectories.map(dir => (
              <DirectoryCard 
                key={`dir-${dir._id}`}
                directory={dir}
                onClick={() => setCurrentDirectory(dir)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Add missing SnippetList component
const SnippetList = ({ snippets }) => {
  if (!snippets || snippets.length === 0) {
    return (
        <div className="text-center text-indigo-300/70 py-8">
            No snippets found
        </div>
    );
}

  // Add logging for snippets
  console.log('Rendering snippets:', snippets);
  
  return (
    <div className="grid grid-cols-1 gap-3 md:gap-4">
      {snippets.map(snippet => (
        // Ensure each snippet has a unique key
        <div 
          key={`snippet-${snippet._id}`}
          className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 
                   hover:bg-indigo-500/10 transition-colors duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaCode className="text-indigo-400" />
              <span className="text-white">{snippet.title}</span>
            </div>
            <span className="text-xs text-indigo-400">
              {snippet.programmingLanguage}
            </span>
          </div>
          {snippet.description && (
            <p className="mt-2 text-sm text-indigo-300/70">
              {snippet.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default GroupLayout;
