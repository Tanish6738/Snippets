import React, { useState, useEffect, useRef,useContext } from 'react';
import PropTypes from 'prop-types';
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
  FaDatabase,
  FaCompress,
  FaExpand,
  FaArrowDown,
  FaExclamationCircle,
  FaEdit,
  FaCopy,
  FaPlay
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
import { initializeSocket, receiveMessage, sendMessage } from '../../Config/Socket';
import { useUser } from '../../Context/UserContext';
import Chat from '../Modals/Chat';
import GroupSideBar from '../Modals/GroupModals/GroupSideBar';

// Add these utility functions at the top of GroupLayout.jsx

// Add this utility function at the top of the file, before buildDirectoryTree
const getAllDescendantSnippets = (directoryId, directories, directorySnippets) => {
    const allSnippets = [...(directorySnippets.get(directoryId) || [])];
    
    // Find all child directories
    const childDirectories = directories.filter(d => 
        d.parentId?.toString() === directoryId.toString()
    );

    // Recursively get snippets from child directories
    childDirectories.forEach(child => {
        const childSnippets = getAllDescendantSnippets(
            child._id, 
            directories, 
            directorySnippets
        );
        allSnippets.push(...childSnippets);
    });

    return allSnippets;
};

// Update buildDirectoryTree function
const buildDirectoryTree = (directories, snippets) => {
  if (!directories?.length) return null;

  // Create maps for faster lookups
  const directoryMap = new Map();
  
  // Initialize directory map with the structure we received from backend
  directories.forEach(dir => {
    // Make sure we preserve the directSnippets from the API response
    const directSnippets = dir.directSnippets || [];
    
    directoryMap.set(dir._id, {
      ...dir,
      type: 'directory',
      children: [],
      // Preserve the directSnippets array from the backend
      directSnippets: directSnippets.map(snippet => ({
        ...snippet,
        type: 'snippet'
      })),
      allSnippets: [],
      // Use metadata.snippetCount if available, otherwise use directSnippets length
      snippetCount: dir.metadata?.snippetCount || directSnippets.length || 0
    });
  });

  // Build tree structure
  directories.forEach(dir => {
    if (dir.parentId && directoryMap.has(dir.parentId)) {
      const parent = directoryMap.get(dir.parentId);
      parent.children.push(directoryMap.get(dir._id));
    }
  });

  // Find root directory
  const rootDir = directories.find(dir => dir.isRoot);
  if (!rootDir) return null;

  const root = directoryMap.get(rootDir._id);

  // Debug logging
  console.log('Built Directory Tree:', {
    root: root,
    directSnippetsCount: root.directSnippets?.length,
    childrenCount: root.children?.length,
    metadata: root.metadata
  });

  return root;
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
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isFullScreenChat, setIsFullScreenChat] = useState(false);

  const { user } = useUser();
  console.log('User:', user._id);
  const send = (message) => {
    if (!message.trim()) return;
    
    const messageData = {
      message,
      sender: user._id,
      timestamp: new Date().toISOString()
    };
    
    // Add message to local state immediately for instant feedback
    setMessages(prevMessages => [...prevMessages, messageData]);
    
    // Send to server
    sendMessage('message', messageData);
    setMessage('');
  };


  // Check for mobile viewport
  useEffect(() => {

    initializeSocket(groupId);

    receiveMessage('message', (data) => {
        console.log('Chat message received:', {
            message: data.message,
            sender: data.sender,
            timestamp: new Date().toISOString()
        });
        setMessages(prevMessages => [...prevMessages, {
          message: data.message,
          sender: data.sender,
          timestamp: data.timestamp
        }]);
    });

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
  }, [groupId]);

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
      setIsLoading(true);
      setFetchError(null);

      // Fetch directories and snippets
      const [dirsResponse, snippetsResponse] = await Promise.all([
        axios.get(`/api/groups/${groupId}/directories`),
        axios.get(`/api/groups/${groupId}/snippets`)
      ]);

      console.log('API Responses:', {
        directories: dirsResponse.data,
        snippets: snippetsResponse.data,
        directSnippets: dirsResponse.data[0]?.directSnippets
      });

      const directories = dirsResponse.data;

      // Build directory tree with the directories that already contain snippets
      const tree = buildDirectoryTree(directories);
      setDirectoryStructure(tree);
      setDirectories(directories);
      setSnippets(snippetsResponse.data);

      // If no current directory is selected, set root as current
      if (!currentDirectory) {
        const rootDir = directories.find(dir => dir.isRoot);
        if (rootDir) {
          setCurrentDirectory(rootDir);
        }
      }

      console.log('Directory Tree:', tree);

    } catch (error) {
      console.error('Error fetching group content:', error);
      setFetchError(error.message);
    } finally {
      setIsLoading(false);
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

  // Add this effect to fetch directory tree
  useEffect(() => {
    const fetchGroupContent = async () => {
      if (!groupId) return;
      
      try {
        setIsLoading(true);
        const response = await axios.get(`/api/groups/${groupId}/content`);
        
        if (!response.data) throw new Error('No data received from server');
        
        setDirectoryStructure(response.data);
        setCurrentDirectory(response.data); // Set root directory as current
        setIsLoading(false);
        
      } catch (err) {
        console.error('Error fetching group content:', err);
        setFetchError(err.response?.data?.error || err.message);
        setIsLoading(false);
      }
    };
  
    fetchGroupContent();
  }, [groupId]);

  // Navigation functions
  const navigateToDirectory = (directory) => {
    setCurrentDirectory(directory);
    const path = directory.path.split('/').filter(Boolean);
    setBreadcrumbs(path);
  };

  // Modified loading condition
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 
                    flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-slate-500 to-slate-600 opacity-70 blur-sm animate-pulse"></div>
            <div className="relative h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center">
              <FaSpinner className="animate-spin text-slate-400" size={24} />
            </div>
          </div>
          <p className="text-slate-400 mt-4">Loading group data...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 
                    flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6 text-red-400">
            <FaExclamationCircle size={40} className="mx-auto" />
          </div>
          <p className="text-slate-300 mb-4">{fetchError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 
                     border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 
                    flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <div className="p-4 rounded-full bg-slate-800/50 border border-slate-700/30 mx-auto inline-block">
              <FaUsers className="text-2xl text-slate-400" />
            </div>
          </div>
          <p className="text-slate-300 mb-4">Group not found</p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/groups')}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 
                     border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200"
          >
            Return to Groups
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 
                    bg-slate-900/90 backdrop-blur-xl
                    border-b border-slate-800/50 flex items-center px-4 z-50">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2.5 text-slate-400 hover:text-slate-300 hover:bg-slate-800/60 
                   rounded-lg transition-all duration-200"
        >
          <FaBars size={18} />
        </button>
        <h1 className="text-lg font-semibold text-slate-200 mx-auto">
          {groupData?.name}
        </h1>
        <button
          onClick={() => setChatOpen(true)}
          className="p-2.5 text-slate-400 hover:text-slate-300 hover:bg-slate-800/60 
                   rounded-lg transition-all duration-200"
        >
          <FaComments size={18} />
        </button>
      </div>

      <div className="flex h-screen md:h-screen pt-16 md:pt-20 overflow-hidden">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-40 w-72 transform 
                      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                      md:relative md:translate-x-0 transition-transform duration-300
                      bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/50
                      ${isSidebarCollapsed ? 'md:w-20' : 'md:w-72'}
                      overflow-hidden flex flex-col`}>
          <GroupSideBar
            isMobile={isMobile}
            isSidebarOpen={isSidebarOpen}
            setSidebarOpen={setSidebarOpen}
            isSidebarCollapsed={isSidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
            groupData={groupData}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            members={members}
            setAddMemberModalOpen={setAddMemberModalOpen}
            setCreateSnippetModalOpen={setCreateSnippetModalOpen}
            setBulkCreateSnippetModalOpen={setBulkCreateSnippetModalOpen}
            setCreateDirectoryModalOpen={setCreateDirectoryModalOpen}
            directoryStructure={directoryStructure}
            onSelectItem={(item) => {
              if (item.type === 'snippet') {
                setSelectedSnippet(item);
                setCurrentDirectory(null);
              } else {
                setCurrentDirectory(item);
                setSelectedSnippet(null);
              }
            }}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            className="h-full overflow-y-auto"
          />
        </div>

        {/* Chat Panel */}
        <div className={`fixed inset-y-0 right-0 z-30 transform flex flex-col
                      ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}
                      transition-transform duration-300
                      bg-slate-900/95 backdrop-blur-xl border-l border-slate-800/50
                      ${isFullScreenChat ? 'w-full' : 'w-96'}`}>
          <Chat
            isOpen={isChatOpen}
            onClose={() => setChatOpen(false)}
            messages={messages}
            onSendMessage={send}
            isMobile={isMobile}
            isFullScreen={isFullScreenChat}
            onToggleFullScreen={() => setIsFullScreenChat(!isFullScreenChat)}
            user={user}
            className="h-full overflow-hidden flex-1 flex flex-col"
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <motion.div 
            layout
            initial={{ opacity: 0.9, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`
              flex-1 p-4 md:p-6 lg:p-8 overflow-hidden flex flex-col
              transition-all duration-300 ease-out
              ${!isMobile && isChatOpen ? 'mr-96' : ''}
              relative
            `}>
            <div className="bg-gradient-to-br from-slate-900/95 to-slate-950/90 backdrop-blur-xl 
                          rounded-2xl p-5 md:p-6 lg:p-8
                          border border-slate-800/40
                          shadow-[0_8px_30px_rgb(0,0,0,0.12)]
                          relative flex-1 overflow-auto">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-500/20 to-transparent"></div>
              <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-slate-500/20 via-transparent to-transparent"></div>
              
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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setChatOpen(true)}
          className="fixed bottom-8 right-8 p-4 rounded-xl
                     bg-gradient-to-br from-slate-800 to-slate-900
                     text-slate-300 hover:text-slate-200
                     border border-slate-700/30 hover:border-slate-600/40
                     shadow-lg shadow-slate-950/30 hover:shadow-xl
                     transition-all duration-300 z-20 group
                     flex items-center justify-center"
        >
          {messages.length > 0 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full 
                       bg-gradient-to-r from-indigo-500 to-blue-500
                       text-xs font-medium text-white 
                       flex items-center justify-center 
                       border border-slate-600/50 shadow-sm"
            >
              {messages.length > 9 ? '9+' : messages.length}
            </motion.div>
          )}
          <FaComments size={20} className="group-hover:scale-110 transition-transform duration-300" />
          <motion.span 
            initial={{ width: 0, opacity: 0, marginLeft: 0 }}
            whileHover={{ width: 'auto', opacity: 1, marginLeft: 8 }}
            className="overflow-hidden whitespace-nowrap text-sm font-medium">
            Chat
          </motion.span>
        </motion.button>
      )}

      <AddMemberModal 
        isOpen={isAddMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        groupId={groupId}
        onMemberAdded={handleMemberAdded}
        currentMembers={members}
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
          setEditDirectoryModalOpen(false);
          // Refresh content
          fetchGroupContent();
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

// Update FileTreeNode component's render logic for snippets
const FileTreeNode = ({ item, level = 0, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!item) return null;

  // Check for both children and directSnippets
  const hasChildren = item.type === 'directory' && 
    (item.children?.length > 0 || item.directSnippets?.length > 0);

  return (
    <div className="select-none">
      <motion.div
        whileHover={{ scale: 1.01 }}
        className={`
          flex items-center py-1.5 px-2 my-0.5
          hover:bg-slate-800/60 rounded-lg 
          cursor-pointer group
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
              className="text-slate-500 group-hover:text-slate-400 transition-colors"
            >
              {isExpanded ? (
                <FaChevronDown size={10} />
              ) : (
                <FaChevronRight size={10} />
              )}
            </button>
          )}
        </span>

        <span className="w-5 h-5 flex items-center justify-center mr-2">
          {item.type === 'directory' ? (
            isExpanded ? (
              <FaFolderOpen className="text-slate-400 group-hover:text-slate-300 transition-colors" />
            ) : (
              <FaFolder className="text-slate-400 group-hover:text-slate-300 transition-colors" />
            )
          ) : (
            <FaCode className="text-slate-400 group-hover:text-slate-300 transition-colors" />
          )}
        </span>

        <span className="text-sm text-slate-300 group-hover:text-slate-200 font-medium flex-1 truncate transition-colors">
          {item.name || item.title}
        </span>

        {item.type === 'directory' && item.snippetCount > 0 && (
          <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors px-1.5 py-0.5 rounded-full bg-slate-800/50">
            {item.snippetCount}
          </span>
        )}
      </motion.div>

      {isExpanded && hasChildren && (
        <div>
          {/* Show directories first */}
          {item.children?.map((child) => (
            <FileTreeNode
              key={child._id}
              item={child}
              level={level + 1}
              onSelect={onSelect}
            />
          ))}
          
          {/* Show snippets */}
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

const SnippetContent = ({ snippet }) => {
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-200">
            {snippet.title}
          </h2>
          {snippet.description && (
            <p className="text-sm text-slate-400 mt-1">{snippet.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopyCode}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 
                     border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              <FaCopy size={14} />
              <span>{copyStatus || "Copy"}</span>
            </div>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRunSnippet}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 
                     border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              <FaPlay size={14} />
              <span>Run</span>
            </div>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setEditSnippetModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 
                     border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              <FaEdit size={14} />
              <span>Edit</span>
            </div>
          </motion.button>
        </div>
      </div>
      
      <div className="relative group overflow-hidden rounded-xl bg-slate-900 border border-slate-800/50 shadow-inner shadow-slate-950/50">
        <div className="absolute top-0 left-0 right-0 h-8 bg-slate-800/70 border-b border-slate-700/50 flex items-center px-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-400 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/50">
              {snippet.programmingLanguage || 'Text'}
            </span>
          </div>
        </div>
        <pre className="text-slate-300 px-4 pt-12 pb-4 overflow-x-auto styled-scrollbar">
          <code>{snippet.content}</code>
        </pre>
      </div>
      
      <div className="flex flex-wrap gap-2 mt-2">
        {snippet.tags?.map(tag => (
          <span key={tag} className="px-2.5 py-1 text-xs rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/50">
            {tag}
          </span>
        ))}
      </div>
      
      <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-800/50 pt-4 mt-4">
        <div className="flex items-center gap-4">
          <span>Created: {new Date(snippet.createdAt).toLocaleDateString()}</span>
          <span>Version: {snippet.versionHistory?.length || 1}</span>
        </div>
        <div>
          <span>Size: {formatBytes(snippet.content?.length || 0)}</span>
        </div>
      </div>
    </div>
  );
};

// Update the StatBox component
const StatBox = ({ label, value, icon }) => (
  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-300">
    <div className="flex items-center gap-2 text-slate-400 mb-1">
      {icon}
      <span className="text-xs uppercase tracking-wide">{label}</span>
    </div>
    <div className="text-xl font-semibold text-slate-200">{value}</div>
  </div>
);

const DirectoryStats = ({ directory, onEdit, onExport }) => {
  if (!directory) return null;

  const stats = {
    directSnippets: directory.directSnippets?.length || 0,
    allSnippets: directory.allSnippets?.length || 0,
    subDirs: directory.children?.length || 0,
    totalSize: directory.metadata?.totalSize || 0
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-800/50 p-6 shadow-lg shadow-slate-950/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/50">
            <FaFolderOpen className="text-xl text-slate-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-200">{directory.name}</h2>
            <p className="text-sm text-slate-400">{directory.path}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {onEdit && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onEdit}
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 
                       border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <FaEdit size={14} />
                <span>Edit</span>
              </div>
            </motion.button>
          )}
          
          {onExport && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onExport}
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 
                       border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <FaDatabase size={14} />
                <span>Export</span>
              </div>
            </motion.button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox 
          label="Direct Snippets" 
          value={stats.directSnippets}
          icon={<FaCode className="text-slate-500" />}
        />
        <StatBox 
          label="All Snippets" 
          value={stats.allSnippets}
          icon={<FaCodeBranch className="text-slate-500" />}
        />
        <StatBox 
          label="Subdirectories" 
          value={stats.subDirs}
          icon={<FaFolder className="text-slate-500" />}
        />
        <StatBox 
          label="Total Size" 
          value={formatBytes(stats.totalSize)}
          icon={<FaDatabase className="text-slate-500" />}
        />
      </div>
    </div>
  );
};

const DirectoryCard = ({ directory, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 
               border border-slate-700/30 shadow-lg hover:shadow-xl hover:border-slate-600/50 
               transition-all duration-300 p-4 cursor-pointer"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700/5 via-transparent to-slate-800/5 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700/50 group-hover:border-slate-600/70 transition-colors">
          <FaFolder className="text-slate-400 group-hover:text-slate-300" />
        </div>
        <div>
          <h3 className="font-medium text-slate-200 group-hover:text-white transition-colors">
            {directory.name}
          </h3>
          <p className="text-xs text-slate-400 mt-1">{directory.path}</p>
        </div>
      </div>
      
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-slate-400 flex items-center gap-1.5">
          <FaCode size={12} className="text-slate-500" />
          {directory.directSnippets?.length || 0} snippets
        </span>
        <span className="text-slate-500">
          {new Date(directory.createdAt).toLocaleDateString()}
        </span>
      </div>
    </motion.div>
  );
};

DirectoryCard.propTypes = {
  directory: PropTypes.shape({
    name: PropTypes.string.isRequired,
    path: PropTypes.string,
    directSnippets: PropTypes.array,
    createdAt: PropTypes.string
  }).isRequired
};

const MainContent = ({ directory, selectedSnippet, searchTerm }) => {
  const [isEditSnippetModalOpen, setEditSnippetModalOpen] = useState(false);
  const [isCreateSnippetModalOpen, setCreateSnippetModalOpen] = useState(false);
  const [isCreateDirectoryModalOpen, setCreateDirectoryModalOpen] = useState(false);
  const [isExportSnippetModalOpen, setExportSnippetModalOpen] = useState(false);
  const [isExportDirectoryModalOpen, setExportDirectoryModalOpen] = useState(false);
  const [isEditDirectoryModalOpen, setEditDirectoryModalOpen] = useState(false);
  const [selectedDirectory, setSelectedDirectory] = useState(null);
  
  // When directory prop changes, update the selectedDirectory state
  useEffect(() => {
    if (directory) {
      setSelectedDirectory(directory);
    }
  }, [directory]);
  
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

  const handleEditDirectory = () => {
    if (directory) {
      setEditDirectoryModalOpen(true);
    }
  };

  const handleExportDirectory = () => {
    if (directory) {
      setExportDirectoryModalOpen(true);
    }
  };

  const handleEditSnippet = () => {
    if (selectedSnippet) {
      setEditSnippetModalOpen(true);
    }
  };

  const handleExportSnippet = () => {
    if (selectedSnippet) {
      setExportSnippetModalOpen(true);
    }
  };

  if (!directory && !selectedSnippet) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="p-6 rounded-full bg-slate-800/50 border border-slate-700/30 mb-6">
          <FaUsers className="text-4xl text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-300 mb-2">Welcome to Group Workspace</h3>
        <p className="text-slate-400 text-center max-w-md mb-8">
          Select a directory or snippet from the sidebar to view its contents
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCreateSnippetModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 
                     border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200
                     flex items-center gap-2"
          >
            <FaPlus size={14} />
            <span>Create Snippet</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCreateDirectoryModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 
                     border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200
                     flex items-center gap-2"
          >
            <FaFolder size={14} />
            <span>Create Directory</span>
          </motion.button>
        </div>
      </div>
    );
  }

  if (selectedSnippet) {
    return (
      <>
        <SnippetContent snippet={selectedSnippet} />
        
        <EditSnippetDetailsModal
          isOpen={isEditSnippetModalOpen}
          onClose={() => setEditSnippetModalOpen(false)}
          snippet={selectedSnippet}
          onSnippetUpdated={(updatedSnippet) => {
            // Handle updated snippet
            setEditSnippetModalOpen(false);
            // Refresh content
            fetchGroupContent();
          }}
        />
        
        <ExportSnippetModal
          isOpen={isExportSnippetModalOpen}
          onClose={() => setExportSnippetModalOpen(false)}
          itemId={selectedSnippet?._id}
          itemType="snippet"
        />
      </>
    );
  }

  // Search functionality
  const searchItems = (items, term) => {
    if (!term) return items;
    return items.filter(item => 
      item.name?.toLowerCase().includes(term.toLowerCase()) ||
      item.title?.toLowerCase().includes(term.toLowerCase()) ||
      (item.tags && Array.isArray(item.tags) && 
        item.tags.some(tag => tag.toLowerCase().includes(term.toLowerCase()))) ||
      (item.programmingLanguage && 
        item.programmingLanguage.toLowerCase().includes(term.toLowerCase()))
    );
  };

  const filteredSnippets = searchItems(directory.directSnippets || [], searchTerm);
  const filteredDirectories = searchItems(directory.children || [], searchTerm);

  return (
    <div className="space-y-6">
      {/* Directory Header */}
      {!searchTerm && (
        <DirectoryStats 
          directory={directory} 
          onEdit={handleEditDirectory}
          onExport={handleExportDirectory}
        />
      )}

      {/* Snippets */}
      {filteredSnippets.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <FaCode className="text-slate-400" size={16} />
            {searchTerm ? 'Matching Snippets' : 'Snippets'}
          </h3>
          <SnippetList 
            snippets={filteredSnippets} 
            onSnippetClick={(snippet) => setSelectedSnippet(snippet)}
          />
        </div>
      )}

      {/* Directories */}
      {filteredDirectories.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <FaFolder className="text-slate-400" size={16} />
            {searchTerm ? 'Matching Directories' : 'Subdirectories'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDirectories.map(dir => (
              <DirectoryCard 
                key={dir._id}
                directory={dir}
                onClick={() => navigateToDirectory(dir)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Modals */}
      <CreateSnippetModal
        isOpen={isCreateSnippetModalOpen}
        onClose={() => setCreateSnippetModalOpen(false)}
        onSnippetCreated={async (snippet) => {
          await handleItemCreated();
          setCreateSnippetModalOpen(false);
        }}
        directory={directory}
      />
      
      <CreateDirectoryModal
        isOpen={isCreateDirectoryModalOpen}
        onClose={() => setCreateDirectoryModalOpen(false)}
        onDirectoryCreated={async (directory) => {
          await handleItemCreated();
          setCreateDirectoryModalOpen(false);
        }}
        parentDirectoryId={directory?._id}
      />
      
      <EditDirectoryDetails
        isOpen={isEditDirectoryModalOpen}
        onClose={() => setEditDirectoryModalOpen(false)}
        directoryId={selectedDirectory?._id}
        onDirectoryUpdated={(updatedDirectory) => {
          // Handle updated directory
          setEditDirectoryModalOpen(false);
          // Refresh content
          fetchGroupContent();
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

// Update SnippetList component
const SnippetList = ({ snippets, onSnippetClick }) => {
    if (!snippets?.length) {
        return (
            <div className="text-center py-8">
                <p className="text-slate-400/80">No snippets found</p>
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-1 gap-3 md:gap-4">
            {snippets.map(snippet => (
                <motion.div 
                    key={snippet._id}
                    whileHover={{ scale: 1.01, y: -2 }}
                    onClick={() => onSnippetClick(snippet)}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 
                             border border-slate-700/30 shadow-lg hover:shadow-xl hover:border-slate-600/50 
                             transition-all duration-300 p-4 cursor-pointer"
                >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/50 group-hover:border-slate-600/70 transition-colors">
                              <FaCode className="text-slate-400 group-hover:text-slate-300" />
                            </div>
                            <div>
                              <span className="font-medium text-slate-200 group-hover:text-white transition-colors">
                                  {snippet.title || snippet.name}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800/70 text-slate-400 border border-slate-700/50">
                                  {snippet.programmingLanguage || 'Text'}
                                </span>
                              </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-slate-800/60 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSnippetClick(snippet);
                            }}
                          >
                            <FaEdit size={14} />
                          </button>
                        </div>
                    </div>
                    
                    {snippet.description && (
                        <p className="mt-3 text-sm text-slate-400 line-clamp-2">
                            {snippet.description}
                        </p>
                    )}
                    
                    {snippet.tags && snippet.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {snippet.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-slate-800/70 text-slate-400 border border-slate-700/50">
                            {tag}
                          </span>
                        ))}
                        {snippet.tags.length > 3 && (
                          <span className="text-xs text-slate-500">+{snippet.tags.length - 3} more</span>
                        )}
                      </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
};

export default GroupLayout;
