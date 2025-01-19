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

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <span className="text-blue-500 text-2xl">{icon}</span>
    </div>
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {isAuthenticated 
                ? `Welcome back, ${user.username}!` 
                : 'Manage Your Code Snippets'}
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              A powerful platform for organizing and sharing your code snippets with teams
            </p>
            <div className="flex gap-4">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    Create Snippet
                  </button>
                  <button
                    onClick={() => setCreateGroupModalOpen(true)}
                    className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
                  >
                    Create Group
                  </button>
                </>
              ) : (
                <Link
                  to="/register"
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Section */}
        {isAuthenticated && userStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Total Snippets" 
              value={userStats.totalSnippets}
              icon="📝"
            />
            <StatCard 
              title="Created Groups" 
              value={userStats.totalGroups}
              icon="👑"
            />
            <StatCard 
              title="Joined Groups" 
              value={userStats.joinedGroups}
              icon="👥"
            />
            <StatCard 
              title="Recent Activities" 
              value={userStats.recentActivities?.length || 0}
              icon="📊"
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Snippets Section */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Recent Snippets</h2>
              <Link to="/snippets" className="text-blue-600 hover:text-blue-800 font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-4">
              {recentSnippets.map(snippet => (
                <div key={snippet._id} className="border border-gray-100 rounded-lg p-4 hover:border-blue-200 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{snippet.title}</h3>
                      <p className="text-sm text-gray-600">{snippet.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewSnippet(snippet._id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleExportSnippet(snippet._id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        Export
                      </button>
                      <button
                        onClick={() => handleShareSnippet(snippet._id)}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        Share
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {snippet.tags?.map(tag => (
                      <span 
                        key={tag} 
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <span className="mr-4">Language: {snippet.programmingLanguage}</span>
                    <span>Created: {new Date(snippet.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Groups Section */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Featured Groups</h2>
              <Link to="/groups" className="text-blue-600 hover:text-blue-800 font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-4">
              {featuredGroups.map(group => (
                <div key={group._id} className="border border-gray-100 rounded-lg p-4 hover:border-blue-200 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{group.name}</h3>
                      <p className="text-sm text-gray-600">{group.description}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedGroupId(group._id);
                        setViewGroupModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        {isAuthenticated && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => setBulkCreateModalOpen(true)}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-left"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Bulk Create
              </h3>
              <p className="text-gray-600">
                Import multiple snippets at once
              </p>
            </button>
            <Link
              to="/directories"
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Manage Directories
              </h3>
              <p className="text-gray-600">
                Organize your snippets
              </p>
            </Link>
            <Link
              to="/groups"
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Join Groups
              </h3>
              <p className="text-gray-600">
                Collaborate with others
              </p>
            </Link>
          </div>
        )}

        {isAuthenticated && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Created Groups */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">My Created Groups</h2>
                <button
                  onClick={() => setCreateGroupModalOpen(true)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Create New +
                </button>
              </div>
              <div className="space-y-4">
                {createdGroups.map(group => (
                  <div key={group._id} className="border border-gray-100 rounded-lg p-4 hover:border-blue-200 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{group.name}</h3>
                        <p className="text-sm text-gray-600">{group.description}</p>
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
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Groups I've Joined</h2>
                <Link to="/groups" className="text-blue-600 hover:text-blue-800 font-medium">
                  Find Groups →
                </Link>
              </div>
              <div className="space-y-4">
                {joinedGroups.map(group => (
                  <div key={group._id} className="border border-gray-100 rounded-lg p-4 hover:border-blue-200 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{group.name}</h3>
                        <p className="text-sm text-gray-600">{group.description}</p>
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

            {/* Featured Directories */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Featured Directories</h2>
                <Link to="/directories" className="text-blue-600 hover:text-blue-800 font-medium">
                  View All →
                </Link>
              </div>
              <div className="space-y-4">
                {featuredDirectories.map(directory => (
                  <div key={directory._id} 
                       className="border border-gray-100 rounded-lg p-4 hover:border-blue-200 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{directory.name}</h3>
                        <p className="text-sm text-gray-600">{directory.path}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedDirectoryId(directory._id);
                          setDirectoryModalStates(prev => ({ ...prev, view: true }));
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      <span className="mr-4">Snippets: {directory.metadata?.snippetCount || 0}</span>
                      <span>Subdirectories: {directory.metadata?.subDirectoryCount || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* My Directories */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">My Directories</h2>
                <button
                  onClick={() => setDirectoryModalStates(prev => ({ ...prev, create: true }))}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Create New +
                </button>
              </div>
              <div className="space-y-4">
                {userDirectories.map(directory => (
                  <div key={directory._id} 
                       className="border border-gray-100 rounded-lg p-4 hover:border-blue-200 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{directory.name}</h3>
                        <p className="text-sm text-gray-600">{directory.path}</p>
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

      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default Home;
