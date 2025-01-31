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
  FaArrowDown
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
import { initializeSocket, recieveMessage, sendMessage } from '../../Config/Socket';
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

    recieveMessage('message', (data) => {
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
        />
        {/* Chat Panel */}
        <Chat
          isOpen={isChatOpen}
          onClose={() => setChatOpen(false)}
          messages={messages}
          onSendMessage={send}
          isMobile={isMobile}
          isFullScreen={isFullScreenChat}
          onToggleFullScreen={() => setIsFullScreenChat(!isFullScreenChat)}
          user={user}
        />

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

// Update FileTreeNode component's render logic for snippets
const FileTreeNode = ({ item, level = 0, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!item) return null;

  // Check for both children and directSnippets
  const hasChildren = item.type === 'directory' && 
    (item.children?.length > 0 || item.directSnippets?.length > 0);

  // Debug logging for tree node
  console.log('FileTreeNode:', {
    name: item.name || item.title,
    type: item.type,
    directSnippets: item.directSnippets?.length || 0,
    children: item.children?.length || 0,
    metadata: item.metadata
  });

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
                <FaChevronDown size={12} />
              ) : (
                <FaChevronRight size={12} />
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
        console.log('Rendering children of:', item.name),
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

  const stats = {
    directSnippets: directory.directSnippets?.length || 0,
    allSnippets: directory.allSnippets?.length || 0,
    subDirs: directory.children?.length || 0,
    totalSize: directory.metadata?.totalSize || 0
  };

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
          value={stats.directSnippets}
          icon={<FaCode />}
        />
        <StatBox 
          label="All Snippets" 
          value={stats.allSnippets}
          icon={<FaCodeBranch />}
        />
        <StatBox 
          label="Subdirectories" 
          value={stats.subDirs}
          icon={<FaFolder />}
        />
        <StatBox 
          label="Total Size" 
          value={formatBytes(stats.totalSize)}
          icon={<FaDatabase />}
        />
      </div>
    </div>
  );
};

const DirectoryCard = ({ directory }) => {
  return (
    <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/15 transition-colors cursor-pointer">
      <div className="flex items-center gap-3">
        <FaFolder className="text-xl text-indigo-400" />
        <div>
          <h3 className="font-medium text-white">{directory.name}</h3>
          <p className="text-xs text-indigo-400">{directory.path}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-indigo-300">
          {directory.directSnippets?.length || 0} snippets
        </span>
        <span className="text-indigo-400">
          {new Date(directory.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
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
                key={dir._id}
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
    if (!snippets?.length) {
        return (
            <div className="text-center text-indigo-300/70 py-8">
                No snippets found
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-1 gap-3 md:gap-4">
            {snippets.map(snippet => (
                <div 
                    key={snippet._id}
                    className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 
                             hover:bg-indigo-500/10 transition-colors duration-200 cursor-pointer"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FaCode className="text-indigo-400" />
                            <span className="text-white">
                                {snippet.title || snippet.name}
                            </span>
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
