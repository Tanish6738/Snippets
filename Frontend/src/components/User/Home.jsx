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
  FiSearch
} from 'react-icons/fi';

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

// Update StatCard component for better mobile layout
const StatCard = ({ title, value, icon, trend }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className="backdrop-blur-lg bg-white/5 p-4 sm:p-6 rounded-xl border border-indigo-500/30 
               hover:border-indigo-400/50 transition-all duration-300 
               shadow-[0_0_20px_rgba(99,102,241,0.15)]"
  >
    <div className="flex items-center justify-between mb-2">
      <span className="text-2xl sm:text-3xl text-indigo-400">{icon}</span>
      {trend && (
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-xs sm:text-sm font-medium ${trend > 0 ? 'text-emerald-300' : 'text-rose-300'}`}
        >
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </motion.span>
      )}
    </div>
    <motion.p 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-indigo-200 
                 bg-clip-text text-transparent mb-1"
    >
      {value}
    </motion.p>
    <p className="text-xs sm:text-sm text-indigo-300">{title}</p>
  </motion.div>
);

// Update SectionHeader component
const SectionHeader = ({ title, action }) => (
  <div className="flex justify-between items-center mb-8">
    <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">{title}</h2>
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

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError('');

      const timestamp = Date.now();
      const headers = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      };
      const params = { _t: timestamp };

      // Fetch all data in parallel
      const [snippetsRes, directoriesRes, groupsRes, activitiesRes, joinedGroupsRes, userDirectoriesRes] = await Promise.all([
        axios.get('/api/snippets', {
          params: { ...params, limit: 5, sort: '-createdAt' },
          headers
        }),
        axios.get('/api/directories', {
          params: { ...params, featured: true, limit: 4 },
          headers
        }),
        axios.get('/api/groups', {
          params: { ...params, created: true, limit: 3 },
          headers
        }),
        isAuthenticated ? axios.get('/api/activities/user', {
          params,
          headers
        }) : Promise.resolve({ data: { activities: [] } }),
        isAuthenticated ? axios.get('/api/groups/joined', {
          params: { ...params, limit: 3 },
          headers
        }) : Promise.resolve({ data: [] }),
        isAuthenticated ? axios.get('/api/directories', {
          params: { ...params, userId: user._id, limit: 3 },
          headers
        }) : Promise.resolve({ data: [] })
      ]);

      setRecentSnippets(snippetsRes.data.snippets || []);
      setFeaturedDirectories(directoriesRes.data.directories || []);
      setCreatedGroups(groupsRes.data.groups || []);
      setJoinedGroups(joinedGroupsRes.data || []); // Handle the array response directly
      setUserDirectories(userDirectoriesRes.data.directories || []);

      if (isAuthenticated) {
        const stats = {
          totalSnippets: snippetsRes.data.total || 0,
          totalGroups: groupsRes.data.total || 0,
          joinedGroups: joinedGroupsRes.data.length || 0,
          recentActivities: activitiesRes.data.activities || []
        };
        setUserStats(stats);
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
    setDirectoryModalStates(prev => ({...prev, create: false}));
  };

  const handleDirectoryUpdated = async () => {
    await fetchHomeData();
    setDirectoryModalStates(prev => ({...prev, edit: false}));
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
    console.log('Selected group details:', {
      id: group._id,
      name: group.name,
      description: group.description,
      members: group.members,
      snippets: group.snippets,
      directories: group.directories,
      settings: group.settings
    });
  
    navigate('/groups', {
      state: {
        selectedGroup: group,
        groupDetails: {
          id: group._id,
          name: group.name,
          description: group.description,
          members: group.members || [],
          snippets: group.snippets || [],
          directories: group.directories || [],
          settings: group.settings || {}
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] overflow-x-hidden">
      {/* Enhanced Hero Section */}
      <div className="bg-[#0B1120] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/30 to-violet-600/30"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-25"></div>
        <div className="absolute top-0 -left-4 w-72 h-72 bg-violet-500 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-blob animation-delay-4000"></div>
        <div className="container mx-auto px-4 py-12 sm:py-24 relative">
          <div className="max-w-4xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 
                         text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 
                         via-purple-300 to-blue-300 leading-tight">
              {isAuthenticated 
                ? `Welcome back, ${user.username}!` 
                : 'Your Code Snippet Library'}
            </h1>
            <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-indigo-100 leading-relaxed opacity-90">
              Organize, share, and collaborate on code snippets with your team.
              Build your personal knowledge base efficiently.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-semibold 
                           text-white bg-gradient-to-r from-indigo-500 to-violet-500 
                           hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 
                           shadow-[0_0_25px_rgba(99,102,241,0.35)]"
                  >
                    Create New Snippet
                  </button>
                  <button
                    onClick={() => setBulkCreateModalOpen(true)}
                    className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-semibold 
                           text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/10 
                           hover:border-indigo-400 hover:text-indigo-200 transition-all duration-300 
                           backdrop-blur-sm"
                  >
                    Bulk Import
                  </button>
                </>
              ) : (
                <Link
                  to="/register"
                  className="w-full sm:w-auto text-center px-6 py-3 sm:px-8 sm:py-4 rounded-xl 
                         font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 
                         hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 
                         shadow-[0_0_25px_rgba(99,102,241,0.35)]"
                >
                  Get Started Free
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6 sm:-mt-10 relative z-10">
        {/* Enhanced Stats Section */}
        {isAuthenticated && userStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
            <StatCard 
              title="Total Snippets" 
              value={userStats.totalSnippets}
              icon={<FiCode className="text-indigo-400" />}
              trend={12}
            />
            <StatCard 
              title="Created Groups" 
              value={userStats.totalGroups}
              icon={<FiUsers className="text-indigo-400" />}
              trend={8}
            />
            <StatCard 
              title="Joined Groups" 
              value={userStats.joinedGroups}
              icon={<FiUsers className="text-indigo-400" />}
              trend={5}
            />
            <StatCard 
              title="Recent Activities" 
              value={userStats.recentActivities?.length || 0}
              icon={<FiActivity className="text-indigo-400" />}
              trend={15}
            />
          </div>
        )}

        {/* Main Content with Better Organization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Recent Snippets - Wider Column */}
          <div className="lg:col-span-2">
            <div className="bg-[#0B1120]/90 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg 
                         border border-indigo-500/30 p-4 sm:p-8 hover:shadow-indigo-500/10 
                         transition-all duration-300">
              <SectionHeader 
                title="Recent Snippets"
                action={
                  <Link to="/snippets" className="text-indigo-400 hover:text-indigo-300 font-medium group flex items-center gap-2">
                    View All 
                    <span className="group-hover:translate-x-1 transition-transform duration-150">→</span>
                  </Link>
                }
              />
              <div className="space-y-4">
                {recentSnippets.map(snippet => (
                  <motion.div 
                    key={snippet._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                    className="border border-indigo-500/20 rounded-xl p-6 hover:border-indigo-400/40 transition-all duration-300 bg-gradient-to-r from-indigo-600/5 to-purple-600/5 hover:from-indigo-600/10 hover:to-purple-600/10"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-indigo-100">{snippet.title}</h3>
                        <p className="text-sm text-indigo-300/80">{snippet.description}</p>
                      </div>
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleViewSnippet(snippet._id)}
                          className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200 flex items-center gap-1"
                        >
                          <FiEye /> View
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleExportSnippet(snippet._id)}
                          className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200 flex items-center gap-1"
                        >
                          <FiDownload /> Export
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleShareSnippet(snippet._id)}
                          className="text-violet-400 hover:text-violet-300 transition-colors duration-200 flex items-center gap-1"
                        >
                          <FiShare2 /> Share
                        </motion.button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {snippet.tags?.map(tag => (
                        <span key={tag} 
                              className="bg-indigo-500/10 text-indigo-300 text-xs px-3 py-1 rounded-full border border-indigo-500/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center text-xs text-indigo-400/60 space-x-4">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-400/60"></span>
                        {snippet.programmingLanguage}
                      </span>
                      <span>{new Date(snippet.createdAt).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="space-y-4 sm:space-y-8">
            <div className="bg-[#0B1120]/90 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg 
                         border border-indigo-500/30 p-4 sm:p-8 hover:shadow-indigo-500/10 
                         transition-all duration-300">
              <h3 className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent mb-6">Quick Actions</h3>
              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCreateModalOpen(true)}
                  className="w-full group text-left p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-500/20 hover:border-indigo-400/30 transition-all duration-300"
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-4 group-hover:scale-110 transition-transform duration-200">
                      <FiPlus className="text-indigo-400" />
                    </span>
                    <div>
                      <h4 className="font-medium text-indigo-100 group-hover:text-white transition-colors duration-200">Create Snippet</h4>
                      <p className="text-sm text-indigo-300/80">Add a new code snippet</p>
                    </div>
                  </div>
                </motion.button>
                {/* Add similar styling for other quick actions */}
              </div>
            </div>

            {/* Featured Directories Panel */}
            <div className="bg-[#0B1120]/90 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg 
                         border border-indigo-500/30 p-4 sm:p-8 hover:shadow-indigo-500/10 
                         transition-all duration-300">
              <SectionHeader 
                title="Featured Directories"
                action={
                  <Link to="/directories" className="text-indigo-400 hover:text-indigo-300 font-medium group flex items-center gap-2">
                    View All 
                    <span className="group-hover:translate-x-1 transition-transform duration-150">→</span>
                  </Link>
                }
              />
              <div className="space-y-4">
                {featuredDirectories.map(directory => (
                  <div key={directory._id} 
                       className="border border-indigo-500/20 rounded-xl p-6 hover:border-indigo-400/40 transition-all duration-300 bg-gradient-to-r from-indigo-600/5 to-purple-600/5 hover:from-indigo-600/10 hover:to-purple-600/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-indigo-100">{directory.name}</h3>
                        <p className="text-sm text-indigo-300/80">{directory.path}</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewDirectory(directory)}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200 flex items-center gap-1"
                      >
                        <FiEye /> View
                      </motion.button>
                    </div>
                    <div className="mt-3 flex items-center text-xs text-indigo-400/60 space-x-4">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-400/60"></span>
                        Snippets: {directory.metadata?.snippetCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-violet-400/60"></span>
                        Subdirectories: {directory.metadata?.subDirectoryCount || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {isAuthenticated && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Created Groups */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0B1120]/90 backdrop-blur-xl rounded-2xl shadow-lg border border-indigo-500/30 p-8 hover:shadow-indigo-500/10 transition-all duration-300"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                  My Created Groups
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCreateGroupModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-500/20 hover:border-indigo-400/30 text-indigo-400 hover:text-indigo-300 transition-all duration-300"
                >
                  <FiPlus className="text-lg" /> Create New
                </motion.button>
              </div>
              <div className="space-y-4">
                {createdGroups.map(group => (
                  <motion.div 
                    key={group._id}
                    whileHover={{ scale: 1.02 }}
                    className="border border-indigo-500/20 rounded-xl p-6 hover:border-indigo-400/40 transition-all duration-300 bg-gradient-to-r from-indigo-600/5 to-purple-600/5 hover:from-indigo-600/10 hover:to-purple-600/10"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-indigo-100 flex items-center gap-2">
                          <FiUsers className="text-indigo-400" />
                          {group.name}
                        </h3>
                        <p className="text-sm text-indigo-300/80 mt-1">{group.description}</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewGroup(group)}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200 flex items-center gap-2"
                      >
                        <FiArrowRight /> Manage
                      </motion.button>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-xs text-indigo-400/60">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-400/60"></span>
                        Members: {group.members?.length}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-violet-400/60"></span>
                        Created: {new Date(group.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Joined Groups */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0B1120]/90 backdrop-blur-xl rounded-2xl shadow-lg border border-indigo-500/30 p-8 hover:shadow-indigo-500/10 transition-all duration-300"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                  Groups I've Joined
                </h2>
                <Link 
                  to="/groups"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
                >
                  <FiSearch className="text-lg" /> Find Groups
                </Link>
              </div>
              <div className="space-y-4">
                {joinedGroups.map(group => (
                  <motion.div
                    key={group._id}
                    whileHover={{ scale: 1.02 }}
                    className="border border-indigo-500/20 rounded-xl p-6 hover:border-indigo-400/40 transition-all duration-300 bg-gradient-to-r from-indigo-600/5 to-purple-600/5 hover:from-indigo-600/10 hover:to-purple-600/10"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-indigo-100 flex items-center gap-2">
                          <FiUsers className="text-indigo-400" />
                          {group.name}
                        </h3>
                        <p className="text-sm text-indigo-300/80 mt-1">{group.description}</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewGroup(group)}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200 flex items-center gap-2"
                      >
                        <FiEye /> View
                      </motion.button>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-xs text-indigo-400/60">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400/60"></span>
                        Role: {group.members.find(m => m.userId === user._id)?.role}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-violet-400/60"></span>
                        Members: {group.members?.length}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* My Directories */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0B1120]/90 backdrop-blur-xl rounded-2xl shadow-lg border border-indigo-500/30 p-8 hover:shadow-indigo-500/10 transition-all duration-300"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                  My Directories
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDirectoryModalStates(prev => ({ ...prev, create: true }))}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-500/20 hover:border-indigo-400/30 text-indigo-400 hover:text-indigo-300 transition-all duration-300"
                >
                  <FiPlus className="text-lg" /> Create New
                </motion.button>
              </div>
              <div className="space-y-4">
                {userDirectories.map(directory => (
                  <motion.div
                    key={directory._id}
                    whileHover={{ scale: 1.02 }}
                    className="border border-indigo-500/20 rounded-xl p-6 hover:border-indigo-400/40 transition-all duration-300 bg-gradient-to-r from-indigo-600/5 to-purple-600/5 hover:from-indigo-600/10 hover:to-purple-600/10"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-indigo-100 flex items-center gap-2">
                          <FiFolder className="text-indigo-400" />
                          {directory.name}
                        </h3>
                        <p className="text-sm text-indigo-300/80 mt-1">{directory.path}</p>
                      </div>
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleViewDirectory(directory)}
                          className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200 flex items-center gap-1"
                        >
                          <FiEye /> View
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedDirectoryId(directory._id);
                            setDirectoryModalStates(prev => ({ ...prev, edit: true }));
                          }}
                          className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200 flex items-center gap-1"
                        >
                          <FiEdit /> Edit
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Modals */}
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
 
export default Home;
