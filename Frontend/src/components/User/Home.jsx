import React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../Context/UserContext';
import axios from '../../Config/Axios';

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

// Update StatCard component with enhanced colors
const StatCard = ({ title, value, icon, trend }) => (
  <div className="backdrop-blur-lg bg-white/5 p-6 rounded-2xl border border-indigo-500/30 hover:border-indigo-400/50 transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
    <div className="flex items-center justify-between mb-2">
      <span className="text-3xl ">{icon}</span>
      {trend && (
        <span className={`text-sm font-medium ${trend > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-3xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent mb-1">{value}</p>
    <p className="text-sm text-indigo-300">{title}</p>
  </div>
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

  const handleSnippetCreated = () => {
    fetchHomeData();
  };

  const handleBulkSnippetsCreated = () => {
    fetchHomeData();
  };

  const handleGroupCreated = () => {
    fetchHomeData();
  };

  const handleDirectoryCreated = () => {
    fetchHomeData();
  };

  const handleDirectoryUpdated = () => {
    fetchHomeData();
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
  

  const handleSnippetUpdated = () => {
    fetchHomeData();  // Refresh the data
    setEditModalOpen(false);
    setSelectedSnippet(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14]">
      {/* Enhanced Hero Section */}
      <div className="bg-[#0B1120] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/30 to-violet-600/30"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-25"></div>
        <div className="absolute top-0 -left-4 w-72 h-72 bg-violet-500 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-blob animation-delay-4000"></div>
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-blue-300 leading-tight">
              {isAuthenticated 
                ? `Welcome back, ${user.username}!` 
                : 'Your Code Snippet Library'}
            </h1>
            <p className="text-xl mb-8 text-indigo-100 leading-relaxed opacity-90">
              Organize, share, and collaborate on code snippets with your team.
              Build your personal knowledge base efficiently.
            </p>
            <div className="flex gap-4 flex-wrap">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="relative px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 shadow-[0_0_25px_rgba(99,102,241,0.35)] hover:shadow-[0_0_35px_rgba(99,102,241,0.45)]"
                  >
                    Create New Snippet
                  </button>
                  <button
                    onClick={() => setBulkCreateModalOpen(true)}
                    className="px-8 py-4 rounded-xl font-semibold text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/10 hover:border-indigo-400 hover:text-indigo-200 transition-all duration-300 backdrop-blur-sm"
                  >
                    Bulk Import
                  </button>
                </>
              ) : (
                <Link
                  to="/register"
                  className="relative px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 shadow-[0_0_25px_rgba(99,102,241,0.35)] hover:shadow-[0_0_35px_rgba(99,102,241,0.45)]"
                >
                  Get Started Free
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-10 relative z-10">
        {/* Enhanced Stats Section */}
        {isAuthenticated && userStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard 
              title="Total Snippets" 
              value={userStats.totalSnippets}
              icon="📝"
              trend={12}
            />
            <StatCard 
              title="Created Groups" 
              value={userStats.totalGroups}
              icon="👥"
              trend={8}
            />
            <StatCard 
              title="Joined Groups" 
              value={userStats.joinedGroups}
              icon="🤝"
              trend={5}
            />
            <StatCard 
              title="Recent Activities" 
              value={userStats.recentActivities?.length || 0}
              icon="📊"
              trend={15}
            />
          </div>
        )}

        {/* Main Content with Better Organization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Snippets - Wider Column */}
          <div className="lg:col-span-2">
            <div className="bg-[#0B1120]/90 backdrop-blur-xl rounded-2xl shadow-lg border border-indigo-500/30 p-8 hover:shadow-indigo-500/10 transition-all duration-300">
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
                  <div key={snippet._id} 
                       className="border border-indigo-500/20 rounded-xl p-6 hover:border-indigo-400/40 transition-all duration-300 bg-gradient-to-r from-indigo-600/5 to-purple-600/5 hover:from-indigo-600/10 hover:to-purple-600/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-indigo-100">{snippet.title}</h3>
                        <p className="text-sm text-indigo-300/80">{snippet.description}</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleViewSnippet(snippet._id)}
                          className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleExportSnippet(snippet._id)}
                          className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200"
                        >
                          Export
                        </button>
                        <button
                          onClick={() => handleShareSnippet(snippet._id)}
                          className="text-violet-400 hover:text-violet-300 transition-colors duration-200"
                        >
                          Share
                        </button>
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
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="space-y-8">
            <div className="bg-[#0B1120]/90 backdrop-blur-xl rounded-2xl shadow-lg border border-indigo-500/30 p-8 hover:shadow-indigo-500/10 transition-all duration-300">
              <h3 className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent mb-6">Quick Actions</h3>
              <div className="space-y-4">
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="w-full group text-left p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-500/20 hover:border-indigo-400/30 transition-all duration-300"
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-4 group-hover:scale-110 transition-transform duration-200">✍️</span>
                    <div>
                      <h4 className="font-medium text-indigo-100 group-hover:text-white transition-colors duration-200">Create Snippet</h4>
                      <p className="text-sm text-indigo-300/80">Add a new code snippet</p>
                    </div>
                  </div>
                </button>
                {/* Add similar styling for other quick actions */}
              </div>
            </div>

            {/* Featured Directories Panel */}
            <div className="bg-[#0B1120]/90 backdrop-blur-xl rounded-2xl shadow-lg border border-indigo-500/30 p-8 hover:shadow-indigo-500/10 transition-all duration-300">
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
                      <button
                        onClick={() => {
                          setSelectedDirectoryId(directory._id);
                            setDirectoryModalStates(prev => ({ ...prev, view: true }));
                          }}
                          className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200 font-medium"
                          >
                          View Details
                          </button>
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
            <div className="bg-[#0B1120]/90 backdrop-blur-xl rounded-2xl shadow-lg border border-indigo-500/30 p-8 hover:shadow-indigo-500/10 transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">My Created Groups</h2>
                <button
                  onClick={() => setCreateGroupModalOpen(true)}
                  className="text-indigo-400 hover:text-indigo-300 font-medium group flex items-center gap-2"
                >
                  Create New 
                  <span className="group-hover:rotate-90 transition-transform duration-150">+</span>
                </button>
              </div>
              <div className="space-y-4 text-white">
                {createdGroups.map(group => (
                  <div key={group._id} className="border border-gray-100 rounded-lg p-4 hover:border-blue-200 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{group.name}</h3>
                        <p className="text-sm text-gray-400">{group.description}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedGroupId(group._id);
                          setViewGroupModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Manage
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      <span className="mr-4">Members: {group.members?.length}</span>
                      <span>Created: {new Date(group.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Joined Groups */}
            <div className="bg-[#0B1120]/90 backdrop-blur-xl rounded-2xl shadow-lg border border-indigo-500/30 p-8 hover:shadow-indigo-500/10 transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">Groups I've Joined</h2>
                <Link to="/groups" className="text-indigo-400 hover:text-indigo-300 font-medium group flex items-center gap-2">
                  Find Groups 
                  <span className="group-hover:translate-x-1 transition-transform duration-150">→</span>
                </Link>
              </div>
              <div className="space-y-4">
                {joinedGroups.map(group => (
                  <div key={group._id} className="border border-gray-100 rounded-lg p-4 hover:border-blue-200 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-white">{group.name}</h3>
                        <p className="text-sm text-gray-400">{group.description}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedGroupId(group._id);
                          setViewGroupModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View
                      </button>
                    </div>
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <span className="mr-4">Role: {group.members.find(m => m.userId === user._id)?.role}</span>
                      <span>Members: {group.members?.length}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* My Directories */}
            <div className="bg-[#0B1120]/90 backdrop-blur-xl rounded-2xl shadow-lg border border-indigo-500/30 p-8 hover:shadow-indigo-500/10 transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">My Directories</h2>
                <button
                  onClick={() => setDirectoryModalStates(prev => ({ ...prev, create: true }))}
                  className="text-indigo-400 hover:text-indigo-300 font-medium group flex items-center gap-2"
                >
                  Create New 
                  <span className="group-hover:rotate-90 transition-transform duration-150">+</span>
                </button>
              </div>
              <div className="space-y-4">
                {userDirectories.map(directory => (
                  <div key={directory._id} 
                       className="border border-gray-100 rounded-lg p-4 hover:border-blue-200 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-white">{directory.name}</h3>
                        <p className="text-sm text-gray-400">{directory.path}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedDirectoryId(directory._id);
                            setDirectoryModalStates(prev => ({ ...prev, view: true }));
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDirectoryId(directory._id);
                            setDirectoryModalStates(prev => ({ ...prev, edit: true }));
                          }}
                          className="text-green-600 hover:text-green-800"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateSnippetModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSnippetCreated={handleSnippetCreated}
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
        />
      )}

      {viewGroupModalOpen && (
        <ViewGroupDetailsModal
          isOpen={viewGroupModalOpen}
          onClose={() => {
            setViewGroupModalOpen(false);
            setSelectedGroupId(null);
          }}
          groupId={selectedGroupId}
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
