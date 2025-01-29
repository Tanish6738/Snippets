import React from 'react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../Context/UserContext';
import axios from '../../Config/Axios';
import { motion } from 'framer-motion';
import {
  FiCode,
  FiUsers,
  FiFolder,
  FiActivity,
  FiPlus,
  FiShare2,
  FiEdit,
  FiEye,
  FiDownload,
  FiArrowRight,
  FiSearch,
  FiUpload,
  FiZap
} from 'react-icons/fi';
import StarsCanvas from '../Landing/StartBackground';

// Import Modals
import CreateSnippetModal from '../Modals/SnippetModals/CreateSnippetModal';
import BulkCreateSnippetModal from '../Modals/SnippetModals/BulkCreateSnippetModal';
import ViewSnippetModal from '../Modals/SnippetModals/ViewSnippetModal';
import ExportSnippetModal from '../Modals/SnippetModals/ExportSnippetModal';
import ShareLinkModal from '../Modals/ShareLinkModal';
import ViewGroupDetailsModal from '../Modals/GroupModals/ViewGroupDetailsModal';
import CreateGroupModal from '../Modals/GroupModals/CreateGroupModal';
import ViewDirectoryDetailsModal from '../Modals/DirectoryModals/ViewDirectoryDetailsModal';
import CreateDirectoryModal from '../Modals/DirectoryModals/CreateDirectoryModal';
import EditDirectoryDetails from '../Modals/DirectoryModals/EditDirectoryDetails';
import ExportDirectoryModal from '../Modals/DirectoryModals/ExportDirectoryModal';
import EditSnippetDetailsModal from '../Modals/SnippetModals/EditSnippetDetailsModal';

// Enhanced StatCard with more modern design
const StatCard = ({ title, value, icon, trend }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="backdrop-blur-xl bg-white/5 p-6 rounded-2xl border border-indigo-500/30 
               hover:border-indigo-400/50 transition-all duration-300 
               shadow-[0_0_30px_rgba(99,102,241,0.12)]"
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-3xl text-indigo-400 opacity-90">{icon}</span>
      {trend && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-sm font-medium px-2 py-1 rounded-full
                     ${trend > 0 ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}
        >
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </motion.span>
      )}
    </div>
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-3xl font-bold bg-gradient-to-r from-white to-indigo-200 
                 bg-clip-text text-transparent mb-2"
    >
      {value}
    </motion.p>
    <p className="text-sm text-indigo-300/90">{title}</p>
  </motion.div>
);

// Enhanced SectionHeader with better spacing
const SectionHeader = ({ title, action }) => (
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 
                   bg-clip-text text-transparent">{title}</h2>
    {action}
  </div>
);

const Home = () => {
  const { isAuthenticated, user } = useUser();
  const [recentSnippets, setRecentSnippets] = useState([]);
  const [featuredDirectories, setFeaturedDirectories] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add these two new state variables
  const [recentGroups, setRecentGroups] = useState([]);
  const [featuredGroups, setFeaturedGroups] = useState([]);
  const [joinedGroups, setJoinedGroups] = useState([]);
  const [createdGroups, setCreatedGroups] = useState([]);
  const [userDirectories, setUserDirectories] = useState([]);
  const [directoryModalStates, setDirectoryModalStates] = useState({
    view: false,
    create: false,
    edit: false,
    export: false
  });
  const [selectedDirectoryId, setSelectedDirectoryId] = useState(null);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [bulkCreateModalOpen, setBulkCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedSnippetId, setSelectedSnippetId] = useState(null);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [viewGroupModalOpen, setViewGroupModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState(null);

  const navigate = useNavigate();

  // Update the fetchHomeData function
  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError('');

      const timestamp = Date.now();
      const headers = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      };

      // Only fetch data if user is authenticated
      if (!isAuthenticated || !user?._id) {
        setRecentSnippets([]);
        setFeaturedDirectories([]);
        setCreatedGroups([]);
        setJoinedGroups([]);
        setUserDirectories([]);
        return;
      }

      const params = {
        _t: timestamp,
        userId: user._id // Add user ID to filter results
      };

      // Update API calls to fetch only user-specific data
      const [snippetsRes, directoriesRes, groupsRes, activitiesRes, joinedGroupsRes, userDirectoriesRes] = await Promise.all([
        // Get only user's snippets and shared snippets
        axios.get('/api/snippets/user/snippets', {
          params: { ...params, limit: 5, sort: '-createdAt' },
          headers
        }),
        // Get user's directories
        axios.get('/api/directories/user/directories', {
          params: { ...params, limit: 4 },
          headers
        }),
        // Get user's created groups
        axios.get('/api/groups', {
          params: { ...params, created: true, limit: 3 },
          headers
        }),
        // Get user's activities
        axios.get('/api/activities/user', {
          params,
          headers
        }),
        // Get user's joined groups
        axios.get('/api/groups/joined', {
          params: { limit: 3 },
          headers
        }),
        // Get user's directories
        axios.get('/api/directories', {
          params: { userId: user._id, limit: 3 },
          headers
        })
      ]);

      // Filter and set data
      setRecentSnippets(snippetsRes.data.snippets?.filter(snippet =>
        snippet.createdBy._id === user._id ||
        snippet.sharedWith?.some(share => share.entity === user._id)
      ) || []);

      setFeaturedDirectories(directoriesRes.data.directories?.filter(directory =>
        directory.createdBy === user._id ||
        directory.sharedWith?.some(share => share.entity === user._id)
      ) || []);

      setCreatedGroups(groupsRes.data.groups?.filter(group =>
        group.createdBy === user._id
      ) || []);

      setJoinedGroups(joinedGroupsRes.data || []);

      setUserDirectories(userDirectoriesRes.data.directories?.filter(directory =>
        directory.createdBy === user._id ||
        directory.sharedWith?.some(share => share.entity === user._id)
      ) || []);

      // Update user stats if available
      if (isAuthenticated) {
        const userStats = {
          totalSnippets: snippetsRes.data.total || 0,
          totalGroups: groupsRes.data.total || 0,
          joinedGroups: joinedGroupsRes.data.length || 0,
          recentActivities: activitiesRes.data.activities || []
        };
        setUserStats(userStats);
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
      console.error('Error fetching home data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, [isAuthenticated]);

  const handleViewSnippet = (snippetId) => {
    setSelectedSnippetId(snippetId);
    setViewModalOpen(true);
  };

  const handleExportSnippet = (snippetId) => {
    setSelectedSnippetId(snippetId);
    setExportModalOpen(true);
  };

  const handleShareSnippet = (snippetId) => {
    setSelectedSnippetId(snippetId);
    setShareModalOpen(true);
  };

  const handleSnippetCreated = async () => {
    await fetchHomeData();
  };

  const handleBulkSnippetsCreated = () => {
    fetchHomeData();
  };

  const handleGroupCreated = async () => {
    await fetchHomeData();
    setCreateGroupModalOpen(false);
  };

  const handleDirectoryCreated = async () => {
    await fetchHomeData();
    setDirectoryModalStates(prev => ({ ...prev, create: false }));
  };

  const handleDirectoryUpdated = async () => {
    await fetchHomeData();
    setDirectoryModalStates(prev => ({ ...prev, edit: false }));
    setSelectedDirectoryId(null);
  };

  const handleEditSnippet = (snippetId) => {


    setViewModalOpen(false);  // Close view modal
    const snippet = recentSnippets.find(s => s._id === snippetId);
    // console.log('Found snippet:', snippet);

    if (snippet) {
      setSelectedSnippet(snippet);
      setEditModalOpen(true);

    } else {
      console.error('Snippet not found:', snippetId);
    }
  };


  const handleSnippetUpdated = async () => {
    await fetchHomeData();
    setEditModalOpen(false);
    setSelectedSnippet(null);
  };

  const handleViewDirectory = (directory) => {
    setLoading(true);
    try {
      navigate('/directories', {
        state: {
          selectedDirectory: directory,
          directoryDetails: {
            id: directory._id,
            name: directory.name,
            path: directory.path,
            metadata: directory.metadata,
            snippets: directory.snippets || [],
            children: directory.children || []
          }
        }
      });
    } catch (error) {
      setError('Failed to open directory');
      console.error('Directory navigation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewGroup = (group) => {
    if (!group?._id) {
      console.error('No group ID available');
      return;
    }
    
    try {
      // Navigate to the group route with the group ID and group data
      navigate(`/groups/${group._id}`, {
        state: {
          groupDetails: group // Pass full group object as state
        }
      });
    } catch (error) {
      console.error('Error navigating to group:', error);
    }
  };

  // Enhanced loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#070B14]">
        <div className="relative">
          <div className="w-16 h-16 border-t-4 border-indigo-500 border-solid rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-indigo-500/20 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030014] overflow-hidden">
      {/* Add StarsCanvas only */}
      <StarsCanvas />

      {/* Cosmic Hero Section - update transparency */}
      <div className="relative bg-gradient-to-b from-[#0F172A]/80 to-[#030712]/80 z-[25]">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full 
                         mix-blend-multiply filter blur-[128px] opacity-10 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-500 rounded-full 
                         mix-blend-multiply filter blur-[128px] opacity-10 animate-pulse delay-300"></div>
        </div>

        <div className="container mx-auto px-6 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent 
                         bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400">
              {isAuthenticated ? `Welcome back, ${user.username}` : 'Your Code Universe'}
            </h1>
            <p className="text-xl text-indigo-200/80 mb-8">
              Organize and discover code snippets in an elegant workspace
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content - update background transparency */}
      <div className="container mx-auto px-4 -mt-20 relative z-[25] bg-[#030014]/50">
        {/* Stats Overview */}
        {isAuthenticated && userStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          >
            {/* Enhanced Stat Cards */}
            <StatCard
              title="Code Snippets"
              value={userStats.totalSnippets}
              icon={<FiCode />}
              trend={12}
              color="from-blue-500 to-indigo-500"
            />
            {/* ... other stat cards ... */}
          </motion.div>
        )}

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Snippets - Wider Column */}
          <div className="lg:col-span-7">
            <GlassCard title="Recent Snippets" icon={<FiCode />}>
              {recentSnippets.map(snippet => (
                <SnippetCard
                  key={snippet._id}
                  snippet={snippet}
                  onView={() => handleViewSnippet(snippet._id)}
                  onEdit={() => handleEditSnippet(snippet._id)}
                  onShare={() => handleShareSnippet(snippet._id)}
                />
              ))}
            </GlassCard>
          </div>

          {/* Quick Actions & Featured Content */}
          <div className="lg:col-span-5 space-y-8">
            {/* Quick Actions */}
            <GlassCard title="Quick Actions" icon={<FiZap />}>
              <div className="grid grid-cols-1 gap-4">
                <QuickActionButton
                  icon={<FiPlus />}
                  title="New Snippet"
                  description="Create a fresh code snippet"
                  onClick={() => setCreateModalOpen(true)}
                  gradientFrom="from-blue-500/20"
                  gradientTo="to-indigo-500/20"
                />
                <QuickActionButton
                  icon={<FiUpload />}
                  title="Bulk Import"
                  description="Import multiple snippets at once"
                  onClick={() => setBulkCreateModalOpen(true)}
                  gradientFrom="from-emerald-500/20"
                  gradientTo="to-teal-500/20"
                />
                <QuickActionButton
                  icon={<FiFolder />}
                  title="New Directory"
                  description="Create a new directory for organization"
                  onClick={() => setDirectoryModalStates(prev => ({ ...prev, create: true }))}
                  gradientFrom="from-violet-500/20"
                  gradientTo="to-purple-500/20"
                />
                <QuickActionButton
                  icon={<FiUsers />}
                  title="Create Group"
                  description="Start a new collaboration group"
                  onClick={() => setCreateGroupModalOpen(true)}
                  gradientFrom="from-rose-500/20"
                  gradientTo="to-pink-500/20"
                />
              </div>
            </GlassCard>

            {/* Featured Directories */}
            <GlassCard title="Featured Directories" icon={<FiFolder />}>
              {featuredDirectories.map(directory => (
                <DirectoryCard
                  key={directory._id}
                  directory={directory}
                  onView={() => handleViewDirectory(directory)}
                />
              ))}
            </GlassCard>
          </div>
        </div>

        {/* Groups Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8"
        >
          {/* Created Groups */}
          <GlassCard title="My Groups" icon={<FiUsers />}
            action={
              <Button onClick={() => setCreateGroupModalOpen(true)}>
                <FiPlus /> New Group
              </Button>
            }
          >
            {createdGroups.map(group => (
              <GroupCard
                key={group._id}
                group={group}
                onView={() => handleViewGroup(group)}
              />
            ))}
          </GlassCard>

          {/* Joined Groups */}
          <GlassCard title="Joined Groups" icon={<FiUsers />}>
            {joinedGroups.map(group => (
              <GroupCard
                key={group._id}
                group={group}
                onView={() => handleViewGroup(group)}
                isJoined
              />
            ))}
          </GlassCard>
        </motion.div>
      </div>

      {/* Modals remain unchanged */}
      <CreateSnippetModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSnippetCreated={handleSnippetCreated}
        defaultValues={{
          visibility: user?.preferences?.defaultSnippetVisibility || 'private'
        }}
      />

      <BulkCreateSnippetModal
        isOpen={bulkCreateModalOpen}
        onClose={() => setBulkCreateModalOpen(false)}
        onSnippetsCreated={handleBulkSnippetsCreated}
      />

      <ViewSnippetModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        snippetId={selectedSnippetId}
        onEdit={handleEditSnippet} // Make sure to pass the edit handler
      />

      <ExportSnippetModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        itemId={selectedSnippetId}
        itemType="snippet"
      />

      <ShareLinkModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        itemId={selectedSnippetId}
        itemType="snippet"
      />

      {createGroupModalOpen && (
        <CreateGroupModal
          isOpen={createGroupModalOpen}
          onClose={() => setCreateGroupModalOpen(false)}
          onGroupCreated={handleGroupCreated}
          defaultValues={{
            settings: {
              joinPolicy: 'invite',
              visibility: 'private'
            }
          }}
        />
      )}

      <ViewDirectoryDetailsModal
        isOpen={directoryModalStates.view}
        onClose={() => {
          setDirectoryModalStates(prev => ({ ...prev, view: false }));
          setSelectedDirectoryId(null);
        }}
        directoryId={selectedDirectoryId}
      />

      <CreateDirectoryModal
        isOpen={directoryModalStates.create}
        onClose={() => setDirectoryModalStates(prev => ({ ...prev, create: false }))}
        onDirectoryCreated={handleDirectoryCreated}
        defaultValues={{
          visibility: 'private'
        }}
      />

      <EditDirectoryDetails
        isOpen={directoryModalStates.edit}
        onClose={() => {
          setDirectoryModalStates(prev => ({ ...prev, edit: false }));
          setSelectedDirectoryId(null);
        }}
        directoryId={selectedDirectoryId}
        onDirectoryUpdated={handleDirectoryUpdated}
      />

      <ExportDirectoryModal
        isOpen={directoryModalStates.export}
        onClose={() => {
          setDirectoryModalStates(prev => ({ ...prev, export: false }));
          setSelectedDirectoryId(null);
        }}
        directoryId={selectedDirectoryId}
      />

      <EditSnippetDetailsModal
        isOpen={editModalOpen}
        onClose={() => {
          // console.log('Closing edit modal');
          setEditModalOpen(false);
        }}
        snippet={selectedSnippet}
        onSnippetUpdated={(updatedSnippet) => {
          // console.log('Snippet updated:', updatedSnippet);
          handleSnippetUpdated();
        }}
      />

      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

// Add these new component definitions:

const ActionButton = ({ icon, label, onClick, className }) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`transition-colors duration-200 flex items-center gap-1 ${className}`}
  >
    {icon} {label}
  </motion.button>
);

const MetadataItem = ({ icon, text }) => (
  <span className="flex items-center gap-1">
    {icon}
    {text}
  </span>
);

const QuickActionButton = ({ icon, title, description, onClick, gradientFrom, gradientTo }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`w-full group text-left p-4 rounded-xl 
                bg-gradient-to-r ${gradientFrom} ${gradientTo}
                hover:from-opacity-30 hover:to-opacity-30
                border border-white/[0.05] hover:border-white/[0.1]
                transition-all duration-300`}
  >
    <div className="flex items-center gap-4">
      <span className="text-2xl text-white/90 group-hover:scale-110 
                      group-hover:text-white transition-all duration-200">
        {icon}
      </span>
      <div>
        <h4 className="font-medium text-white/90 
                      group-hover:text-white transition-colors">
          {title}
        </h4>
        <p className="text-sm text-white/60 group-hover:text-white/80">
          {description}
        </p>
      </div>
    </div>
  </motion.button>
);

const DirectoryCard = ({ directory, onView }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="group border border-indigo-500/10 rounded-xl p-4
               hover:border-indigo-400/30 transition-all duration-300 
               bg-gradient-to-r from-indigo-600/3 to-purple-600/3 
               hover:from-indigo-600/5 hover:to-purple-600/5"
  >
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-semibold text-indigo-100 flex items-center gap-2">
          <FiFolder className="text-indigo-400 group-hover:text-indigo-300 
                             transition-colors duration-200" />
          {directory.name}
        </h3>
        <p className="text-sm text-indigo-300/80 mt-1">{directory.path}</p>
      </div>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onView}
        className="text-indigo-400 hover:text-indigo-300 
                   transition-colors duration-200 flex items-center gap-1"
      >
        <FiEye /> View
      </motion.button>
    </div>
  </motion.div>
);

// Update the GlassCard component to ensure proper stacking context
const GlassCard = ({ title, icon, children, action }) => (
  <div className="backdrop-blur-xl bg-white/[0.01] rounded-3xl border border-white/[0.03]
                  p-8 shadow-2xl shadow-black/[0.1] relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-transparent to-purple-500/3"></div>
    <div className="flex justify-between items-center mb-6 relative z-10">
      <h2 className="text-xl font-bold flex items-center gap-3 text-white">
        <span className="text-blue-400">{icon}</span>
        {title}
      </h2>
      {action}
    </div>
    <div className="relative z-10">
      {children}
    </div>
  </div>
);

const SnippetCard = ({ snippet, onView, onEdit, onShare }) => (
  <motion.div
    whileHover={{ scale: 1.01 }}
    className="group p-4 rounded-2xl bg-white/[0.01] border border-white/[0.03]
               hover:border-white/[0.08] transition-all duration-300 mb-4"
  >
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-medium text-white group-hover:text-blue-400 
                     transition-colors duration-300">{snippet.title}</h3>
        <p className="text-sm text-white/60 mt-1">{snippet.description}</p>
      </div>
      <div className="flex gap-2">
        <IconButton icon={<FiEye />} onClick={onView} tooltip="View" />
        <IconButton icon={<FiEdit />} onClick={onEdit} tooltip="Edit" />
        <IconButton icon={<FiShare2 />} onClick={onShare} tooltip="Share" />
      </div>
    </div>
    {/* Tags */}
    <div className="mt-4 flex flex-wrap gap-2">
      {snippet.tags?.map(tag => (
        <span key={tag} className="px-2 py-1 text-xs rounded-full 
                                 bg-blue-500/10 text-blue-300 border border-blue-500/20">
          {tag}
        </span>
      ))}
    </div>
  </motion.div>
);

// Update the IconButton component
const IconButton = ({ icon, onClick, tooltip }) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="p-2 rounded-full hover:bg-white/[0.05] text-white/60 
               hover:text-blue-400 transition-all duration-300 
               relative z-10 group"
  >
    {icon}
    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 
                     text-xs rounded bg-black text-white opacity-0 
                     group-hover:opacity-100 transition-opacity">
      {tooltip}
    </span>
  </motion.button>
);

// Update the Button component definition
const Button = ({ children, onClick, className = '' }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg
                bg-blue-500/20 hover:bg-blue-500/30
                text-blue-300 hover:text-blue-200
                border border-blue-500/30 hover:border-blue-400/50
                transition-all duration-200 relative z-10 ${className}`}
  >
    {children}
  </motion.button>
);

// Add this new GroupCard component definition
const GroupCard = ({ group, onView, isJoined = false }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="group border border-indigo-500/10 rounded-xl p-4 mb-4
               hover:border-indigo-400/30 transition-all duration-300 
               bg-gradient-to-r from-indigo-600/3 to-purple-600/3 
               hover:from-indigo-600/5 hover:to-purple-600/5"
  >
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-semibold text-indigo-100 flex items-center gap-2">
          <FiUsers className="text-indigo-400 group-hover:text-indigo-300 
                           transition-colors duration-200" />
          {group.name}
        </h3>
        <p className="text-sm text-indigo-300/80 mt-1">{group.description}</p>
        {/* Show member count */}
        <div className="flex items-center gap-2 mt-2 text-xs text-indigo-400/80">
          <FiUsers size={12} />
          <span>{group.members?.length || 0} members</span>
          {isJoined && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
              Joined
            </span>
          )}
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onView}
        className="text-indigo-400 hover:text-indigo-300 
                   transition-colors duration-200 flex items-center gap-1"
      >
        <FiEye /> View
      </motion.button>
    </div>
  </motion.div>
);

const fetchGroupContent = async () => {
  try {
    console.log('Fetching content for group:', groupId);
    
    const [snippetsRes, directoriesRes] = await Promise.all([
      axios.get(`/api/groups/${groupId}/snippets`),
      axios.get(`/api/groups/${groupId}/directories`)
    ]);

    console.log('Group snippets:', snippetsRes.data);
    console.log('Group directories:', directoriesRes.data);
    
    setSnippets(snippetsRes.data);
    setDirectories(directoriesRes.data);

    // Build directory structure
    const structure = buildDirectoryTree(directoriesRes.data, snippetsRes.data);
    console.log('Built directory structure:', structure);
    setDirectoryStructure(structure);

  } catch (error) {
    console.error('Error fetching group content:', error);
    setFetchError(error.message);
  }
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
            {item.directSnippets?.length || 0} snippets
          </span>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div>
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
        </div>
      )}
    </div>
  );
};

const SnippetList = ({ snippets }) => {
  if (!snippets?.length) {
    return (
      <div className="text-indigo-400 text-sm p-4 text-center">
        No snippets found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:gap-4">
      {snippets.map(snippet => (
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
            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-400">
                {snippet.programmingLanguage}
              </span>
              <span className="text-xs text-indigo-400/60">
                {new Date(snippet.createdAt).toLocaleDateString()}
              </span>
            </div>
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

export default Home;
