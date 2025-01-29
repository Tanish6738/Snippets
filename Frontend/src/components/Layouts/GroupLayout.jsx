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
  FaCode
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

const GroupLayout = () => {
  const { groupId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Add state for received group details
  const [receivedGroupDetails, setReceivedGroupDetails] = useState(
    location.state?.groupDetails || null
  );

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
  const [groupData, setGroupData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
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
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        console.log('Starting group data fetch for ID:', groupId);
        setIsLoading(true);
        setFetchError(null);

        // If we have received group details and they match the groupId, use them
        if (receivedGroupDetails && receivedGroupDetails._id === groupId) {
          console.log('Using received group details');
          setGroupData(receivedGroupDetails);
          setMembers(receivedGroupDetails.members || []);
          setIsLoading(false);
          return;
        }
        
        // Otherwise fetch from API
        const { data } = await axios.get(`/api/groups/${groupId}`, {
          params: {
            includeMembers: true
          }
        });

        console.log('Group data fetched:', data);
        setGroupData(data);
        setMembers(data.members?.map(member => ({
          userId: member.userId,
          role: member.role,
          permissions: member.permissions
        })) || []);

      } catch (err) {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to load group data';
        console.error('Group fetch error:', {
          message: errorMessage,
          status: err.response?.status,
          error: err
        });
        setFetchError(errorMessage);
        setGroupData(null);
        
        // Navigate back if group not found
        if (err.response?.status === 404) {
          navigate('/groups');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (groupId) {
      fetchGroupData();
    }
  }, [groupId, receivedGroupDetails, navigate]);

  const handleMemberAdded = async () => {
    try {
        console.log('Refreshing members list after add');
        setIsLoading(true);
        setFetchError(null);

        const response = await axios.get(`/api/groups/${groupId}`);
        
        if (!response.data) {
            throw new Error('No data received from server');
        }

        console.log('Updated group data received:', {
            groupId,
            memberCount: response.data.members?.length,
        });

        setGroupData(response.data);
        setMembers(response.data.members || []);

    } catch (err) {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to refresh members';
        console.error('Error refreshing members:', {
            message: errorMessage,
            status: err.response?.status,
            error: err
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
  useEffect(() => {
    const fetchGroupContent = async () => {
      try {
        const [snippetsRes, directoriesRes] = await Promise.all([
          axios.get(`/api/groups/${groupId}/snippets`),
          axios.get(`/api/groups/${groupId}/directories`)
        ]);

        setSnippets(snippetsRes.data || []);
        setDirectories(directoriesRes.data || []);
      } catch (err) {
        console.error('Error fetching group content:', err);
      }
    };

    if (groupId) {
      fetchGroupContent();
    }
  }, [groupId]);

  // Modified loading condition
  if (isInitialLoading) {
    console.log('Showing initial loading spinner');
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#070B14] to-[#0B1120] 
                    flex items-center justify-center">
        <FaSpinner className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  if (fetchError) {
    console.log('Showing error state:', fetchError);
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#070B14] to-[#0B1120] 
                    flex items-center justify-center">
        <div className="text-red-400 text-center">
          <p className="text-xl mb-4">{fetchError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Early return if no group data
  if (!groupData) {
    console.log('No group data available');
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#070B14] to-[#0B1120] 
                    flex items-center justify-center">
        <div className="text-indigo-400 text-center">
          <p className="text-xl mb-4">Group not found</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-lg"
          >
            Retry
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
                {/* File tree would go here */}
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
            {/* Refresh Indicator */}
            {refreshing && (
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                className="absolute top-0 left-0 right-0 h-0.5">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 animate-shimmer" />
              </motion.div>
            )}
            
            <div className="bg-gradient-to-br from-[#0B1120]/90 to-[#0D1428]/90 
                          backdrop-blur-2xl h-full 
                          rounded-2xl p-6 md:p-8
                          border border-indigo-500/10
                          shadow-2xl shadow-indigo-500/5
                          transition-all duration-300">
              {/* Main content... */}
              <div className="text-indigo-300">
                {directories.map(directory => (
                  <div key={directory._id} 
                       className="flex items-center gap-3 p-3 hover:bg-indigo-500/10 rounded-lg cursor-pointer"
                       onClick={() => setSelectedDirectory(directory)}>
                    <FaFolder />
                    <span>{directory.name}</span>
                  </div>
                ))}
                {snippets.map(snippet => (
                  <div key={snippet._id}
                       className="flex items-center gap-3 p-3 hover:bg-indigo-500/10 rounded-lg cursor-pointer"
                       onClick={() => setSelectedSnippet(snippet)}>
                    <FaCode />
                    <span>{snippet.title}</span>
                  </div>
                ))}
              </div>
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
        onSnippetCreated={(snippet) => {
          // Handle newly created snippet
          console.log('New snippet created:', snippet);
        }}
      />

      <BulkCreateSnippetModal
        isOpen={isBulkCreateSnippetModalOpen}
        onClose={() => setBulkCreateSnippetModalOpen(false)}
        onSnippetsCreated={(snippets) => {
          // Handle newly created snippets
          console.log('New snippets created:', snippets);
        }}
      />

      <EditSnippetDetailsModal
        isOpen={isEditSnippetModalOpen}
        onClose={() => setEditSnippetModalOpen(false)}
        snippet={selectedSnippet}
        onSnippetUpdated={(updatedSnippet) => {
          // Handle updated snippet
          console.log('Snippet updated:', updatedSnippet);
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
        onDirectoryCreated={(directory) => {
          // Handle newly created directory
          console.log('New directory created:', directory);
        }}
      />

      <EditDirectoryDetails
        isOpen={isEditDirectoryModalOpen}
        onClose={() => setEditDirectoryModalOpen(false)}
        directoryId={selectedDirectory?._id}
        onDirectoryUpdated={(updatedDirectory) => {
          // Handle updated directory
          console.log('Directory updated:', updatedDirectory);
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

// Add these styles to your global CSS
const globalStyles = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-shimmer {
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
`;

export default GroupLayout;
