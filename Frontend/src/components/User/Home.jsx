import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../Context/UserContext';
import axios from '../../Config/Axios';
import { motion } from 'framer-motion';
import {
  FiCode,
  FiUsers,
  FiFolder,
  FiPlus,
  FiShare2,
  FiEdit,
  FiEye,
  FiUpload,
  FiZap,
  FiBell,
  FiSettings,
  FiBookmark,
  FiStar,
  FiGrid
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

// Enhanced StatCard remains similar
const StatCard = ({ title, value, icon, trend }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5"
  >
    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative p-6 backdrop-blur-xl border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl text-indigo-400 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </span>
        {trend && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-sm font-medium px-3 py-1 rounded-full
              ${trend > 0 
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'}`}
          >
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </motion.span>
        )}
      </div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent mb-2"
      >
        {value}
      </motion.p>
      <p className="text-sm text-indigo-300/80">{title}</p>
    </div>
  </motion.div>
);

const SectionHeader = ({ title, action }) => (
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
      {title}
    </h2>
    {action}
  </div>
);

// Updated TopBar (without side nav)
const TopBar = ({ user }) => (
  <div className="fixed top-0 left-0 right-0 h-20 bg-gradient-to-r from-[#070B14] to-[#0F172A] backdrop-blur-lg z-30">
    <div className="max-w-7xl mx-auto flex items-center justify-between h-full px-6">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            CodeVault
          </span>
        </h1>
        <span className="hidden sm:block text-xs text-indigo-400/60">Code Smarter, Build Faster</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative group">
          <button className="p-2 text-indigo-400 hover:text-indigo-300 transition-all duration-300">
            <FiBell size={22} />
            <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#070B14] group-hover:scale-110 transition-transform" />
          </button>
        </div>
        <div className="flex items-center gap-3 p-1.5 rounded-full bg-white/5 border border-white/10">
          <img src={user?.avatar || 'default-avatar.png'} alt="Profile" 
               className="w-8 h-8 rounded-full ring-2 ring-indigo-500/30" />
          <span className="text-indigo-200 text-sm pr-2 hidden sm:block">{user?.username}</span>
        </div>
      </div>
    </div>
  </div>
);

// DashboardTabs for top navigation within the dashboard
const DashboardTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { key: 'overview', label: 'Overview', icon: <FiGrid className="w-4 h-4" /> },
    { key: 'snippets', label: 'Snippets', icon: <FiCode className="w-4 h-4" /> },
    { key: 'directories', label: 'Directories', icon: <FiFolder className="w-4 h-4" /> },
    { key: 'groups', label: 'Groups', icon: <FiUsers className="w-4 h-4" /> }
  ];

  return (
    <div className="sticky top-20 z-20 bg-gradient-to-b from-[#0F172A] to-[#0F172A]/95 border-b border-indigo-500/20">
      <div className="max-w-3xl mx-auto px-6"> {/* Changed from max-w-7xl to max-w-3xl */}
        <div className="flex justify-center space-x-8"> {/* Added justify-center */}
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 py-4 px-2 font-medium relative transition-all duration-300
                ${activeTab === tab.key 
                  ? 'text-indigo-300' 
                  : 'text-indigo-400/60 hover:text-indigo-300'}`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.key && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const IconButton = ({ icon, onClick, tooltip }) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="p-2 rounded-full hover:bg-white/[0.05] text-white/60 hover:text-blue-400 transition-all duration-300 relative z-10 group"
  >
    {icon}
    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs rounded bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity">
      {tooltip}
    </span>
  </motion.button>
);

const Button = ({ children, onClick, className = '' }) => (
  <motion.button
    whileHover={{ scale: 0.5 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-200 relative z-10 ${className}`}
  >
    {children}
  </motion.button>
);

const QuickActionButton = ({ icon, title, description, onClick, gradientFrom, gradientTo }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`w-full group relative overflow-hidden rounded-xl transition-all duration-300`}
  >
    <div className={`absolute inset-0 bg-gradient-to-r ${gradientFrom} ${gradientTo} opacity-10 group-hover:opacity-20 transition-opacity`} />
    <div className="relative p-5 border border-white/10 group-hover:border-white/20">
      <div className="flex items-start gap-4">
        <span className="text-2xl text-white/90 group-hover:scale-110 group-hover:text-white transition-all duration-300">
          {icon}
        </span>
        <div className="text-left">
          <h4 className="font-medium text-white/90 group-hover:text-white mb-1">
            {title}
          </h4>
          <p className="text-sm text-white/60 group-hover:text-white/80">
            {description}
          </p>
        </div>
      </div>
    </div>
  </motion.button>
);

const DirectoryCard = ({ directory, onView }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="group border border-indigo-500/10 rounded-xl p-4 hover:border-indigo-400/30 transition-all duration-300 bg-gradient-to-r from-indigo-600/3 to-purple-600/3 hover:from-indigo-600/5 hover:to-purple-600/5"
  >
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-semibold text-indigo-100 flex items-center gap-2">
          <FiFolder className="text-indigo-400 group-hover:text-indigo-300 transition-colors duration-200" />
          {directory.name}
        </h3>
        <p className="text-sm text-indigo-300/80 mt-1">{directory.path}</p>
      </div>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onView}
        className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200 flex items-center gap-1"
      >
        <FiEye /> View
      </motion.button>
    </div>
  </motion.div>
);

const GlassCard = ({ title, icon, children, action }) => (
  <div className="backdrop-blur-xl bg-white/[0.01] rounded-3xl border border-white/[0.03] p-8 shadow-2xl shadow-black/[0.1] relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-transparent to-purple-500/3"></div>
    <div className="flex justify-between items-center mb-6 relative z-10">
      <h2 className="text-xl font-bold flex items-center gap-3 text-white">
        <span className="text-blue-400">{icon}</span>
        {title}
      </h2>
      {action}
    </div>
    <div className="relative z-10">{children}</div>
  </div>
);

// Improved SnippetCard with a refined gradient background, increased padding, and enhanced typography
const SnippetCard = ({ snippet, onView, onEdit, onShare }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="group p-6 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-md hover:shadow-lg transition-all duration-300 mb-6"
  >
    <div className="flex justify-between items-center">
      <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
        {snippet.title}
      </h3>
      <div className="flex space-x-2">
        <IconButton icon={<FiEye />} onClick={onView} tooltip="View" />
        <IconButton icon={<FiEdit />} onClick={onEdit} tooltip="Edit" />
        <IconButton icon={<FiShare2 />} onClick={onShare} tooltip="Share" />
      </div>
    </div>
    <p className="mt-3 text-sm text-gray-300">{snippet.description}</p>
    <div className="mt-4 flex flex-wrap gap-2">
      {snippet.tags?.map(tag => (
        <span key={tag} className="px-3 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300">
          {tag}
        </span>
      ))}
    </div>
  </motion.div>
);

const Container = ({ children, className = '' }) => (
  <div className={`max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
    {children}
  </div>
);

const Home = () => {
  const { isAuthenticated, user } = useUser();
  const [recentSnippets, setRecentSnippets] = useState([]);
  const [featuredDirectories, setFeaturedDirectories] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('overview');
  const [recentGroups, setRecentGroups] = useState([]);
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

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [bulkCreateModalOpen, setBulkCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedSnippetId, setSelectedSnippetId] = useState(null);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState(null);

  const navigate = useNavigate();

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError('');
      const timestamp = Date.now();
      const headers = { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' };

      if (!isAuthenticated || !user?._id) {
        setRecentSnippets([]);
        setFeaturedDirectories([]);
        setCreatedGroups([]);
        setJoinedGroups([]);
        setUserDirectories([]);
        return;
      }

      const params = { _t: timestamp, userId: user._id };

      const [snippetsRes, directoriesRes, groupsRes, activitiesRes, joinedGroupsRes, userDirectoriesRes] =
        await Promise.all([
          axios.get('/api/snippets/user/snippets', { params: { ...params, limit: 5, sort: '-createdAt' }, headers }),
          axios.get('/api/directories/user/directories', { params: { ...params, limit: 4 }, headers }),
          axios.get('/api/groups', { params: { ...params, created: true, limit: 3 }, headers }),
          axios.get('/api/activities/user', { params, headers }),
          axios.get('/api/groups/joined', { params: { limit: 3 }, headers }),
          axios.get('/api/directories', { params: { userId: user._id, limit: 3 }, headers })
        ]);

      setRecentSnippets(
        snippetsRes.data.snippets?.filter(
          snippet =>
            snippet.createdBy._id === user._id ||
            snippet.sharedWith?.some(share => share.entity === user._id)
        ) || []
      );

      setFeaturedDirectories(
        directoriesRes.data.directories?.filter(
          directory =>
            directory.createdBy === user._id ||
            directory.sharedWith?.some(share => share.entity === user._id)
        ) || []
      );

      setCreatedGroups(groupsRes.data.groups?.filter(group => group.createdBy === user._id) || []);
      setJoinedGroups(joinedGroupsRes.data || []);
      setUserDirectories(
        userDirectoriesRes.data.directories?.filter(
          directory =>
            directory.createdBy === user._id ||
            directory.sharedWith?.some(share => share.entity === user._id)
        ) || []
      );

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
    setViewModalOpen(false);
    const snippet = recentSnippets.find(s => s._id === snippetId);
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
      navigate(`/groups/${group._id}`, { state: { groupDetails: group } });
    } catch (error) {
      console.error('Error navigating to group:', error);
    }
  };

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
    <div className="min-h-screen bg-[#030014]">
      <TopBar user={user} />
      <main className="pt-16">
        <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === 'overview' && (
          <>
            {/* Hero Section */}
            <div className="relative bg-gradient-to-b from-[#0F172A] to-[#030712] z-[25] overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000" />
              </div>
              
              <Container className="relative z-10 py-20">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-3xl mx-auto text-center"
                >
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="inline-block mb-6 px-6 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20"
                  >
                    <span className="text-sm text-blue-400">Welcome to Your Workspace</span>
                  </motion.div>
                  
                  <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    {isAuthenticated ? `Welcome back, ${user.username}` : 'Your Code Universe'}
                  </h1>
                  
                  <p className="text-lg text-indigo-200/80 font-light max-w-2xl mx-auto mb-12">
                    Organize, share, and discover code snippets in a modern, intuitive workspace designed for developers.
                  </p>

                  <div className="flex flex-wrap justify-center gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCreateModalOpen(true)}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200"
                    >
                      <FiPlus className="inline-block mr-2" /> New Snippet
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setDirectoryModalStates(prev => ({ ...prev, create: true }))}
                      className="px-6 py-3 rounded-xl bg-white/5 text-indigo-300 font-medium hover:bg-white/10 border border-indigo-500/30 transition-all duration-200"
                    >
                      <FiFolder className="inline-block mr-2" /> Create Directory
                    </motion.button>
                  </div>
                </motion.div>
              </Container>
            </div>

            {/* Stats Section */}
            <Container className="-mt-16 relative z-[26]">
              {isAuthenticated && userStats && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
                >
                  <StatCard
                    title="Total Snippets"
                    value={userStats.totalSnippets}
                    icon={<FiCode />}
                    trend={12}
                  />
                  <StatCard
                    title="Created Groups"
                    value={userStats.totalGroups}
                    icon={<FiUsers />}
                    trend={8}
                  />
                  <StatCard
                    title="Joined Groups"
                    value={userStats.joinedGroups}
                    icon={<FiUsers />}
                    trend={5}
                  />
                  <StatCard
                    title="Recent Activities"
                    value={userStats.recentActivities.length}
                    icon={<FiZap />}
                    trend={15}
                  />
                </motion.div>
              )}

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7">
                  <GlassCard
                    title="Recent Snippets"
                    icon={<FiCode />}
                    action={
                      <Button onClick={() => setCreateModalOpen(true)}>
                        <FiPlus className="mr-1" /> New
                      </Button>
                    }
                  >
                    {recentSnippets.length > 0 ? (
                      recentSnippets.map(snippet => (
                        <SnippetCard
                          key={snippet._id}
                          snippet={snippet}
                          onView={() => handleViewSnippet(snippet._id)}
                          onEdit={() => handleEditSnippet(snippet._id)}
                          onShare={() => handleShareSnippet(snippet._id)}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-indigo-300/60">No snippets yet. Create your first one!</p>
                      </div>
                    )}
                  </GlassCard>
                </div>

                <div className="lg:col-span-5 space-y-8">
                  <GlassCard title="Quick Actions" icon={<FiZap />}>
                    <div className="grid grid-cols-1 gap-4">
                      {/* ...existing QuickActionButtons... */}
                    </div>
                  </GlassCard>

                  <GlassCard 
                    title="Featured Directories" 
                    icon={<FiFolder />}
                    action={
                      <Button onClick={() => setDirectoryModalStates(prev => ({ ...prev, create: true }))}>
                        <FiPlus className="mr-1" /> New
                      </Button>
                    }
                  >
                    {featuredDirectories.length > 0 ? (
                      featuredDirectories.map(directory => (
                        <DirectoryCard
                          key={directory._id}
                          directory={directory}
                          onView={() => handleViewDirectory(directory)}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-indigo-300/60">No directories yet. Create your first one!</p>
                      </div>
                    )}
                  </GlassCard>
                </div>
              </div>
            </Container>
          </>
        )}

        {activeTab === 'snippets' && (
          <div className="container mx-auto px-4 lg:px-8 relative z-[25] bg-[#030014]/50 py-8">
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
        )}

        {activeTab === 'directories' && (
          <div className="container mx-auto px-4 lg:px-8 relative z-[25] bg-[#030014]/50 py-8">
            <GlassCard title="Featured Directories" icon={<FiFolder />}>
              {featuredDirectories.map(directory => (
                <DirectoryCard key={directory._id} directory={directory} onView={() => handleViewDirectory(directory)} />
              ))}
            </GlassCard>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="container mx-auto px-4 lg:px-8 relative z-[25] bg-[#030014]/50 py-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <GlassCard title="My Groups" icon={<FiUsers />} action={<Button onClick={() => setCreateGroupModalOpen(true)}><FiPlus /> New Group</Button>}>
                {createdGroups.map(group => (
                  <GroupCard key={group._id} group={group} onView={() => handleViewGroup(group)} />
                ))}
              </GlassCard>
              <GlassCard title="Joined Groups" icon={<FiUsers />}>
                {joinedGroups.map(group => (
                  <GroupCard key={group._id} group={group} onView={() => handleViewGroup(group)} isJoined />
                ))}
              </GlassCard>
            </motion.div>
          </div>
        )}
      </main>

      <CreateSnippetModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSnippetCreated={handleSnippetCreated}
        defaultValues={{ visibility: user?.preferences?.defaultSnippetVisibility || 'private' }}
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
        onEdit={handleEditSnippet}
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
          defaultValues={{ settings: { joinPolicy: 'invite', visibility: 'private' } }}
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
        defaultValues={{ visibility: 'private' }}
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
        onClose={() => setEditModalOpen(false)}
        snippet={selectedSnippet}
        onSnippetUpdated={handleSnippetUpdated}
      />
      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

const GroupCard = ({ group, onView, isJoined = false }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="group border border-indigo-500/10 rounded-xl p-4 mb-4 hover:border-indigo-400/30 transition-all duration-300 bg-gradient-to-r from-indigo-600/3 to-purple-600/3 hover:from-indigo-600/5 hover:to-purple-600/5"
  >
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-semibold text-indigo-100 flex items-center gap-2">
          <FiUsers className="text-indigo-400 group-hover:text-indigo-300 transition-colors duration-200" />
          {group.name}
        </h3>
        <p className="text-sm text-indigo-300/80 mt-1">{group.description}</p>
        <div className="flex items-center gap-2 mt-2 text-xs text-indigo-400/80">
          <FiUsers size={12} />
          <span>{group.members?.length || 0} members</span>
          {isJoined && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">Joined</span>
          )}
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onView}
        className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200 flex items-center gap-1"
      >
        <FiEye /> View
      </motion.button>
    </div>
  </motion.div>
);

export default Home;
