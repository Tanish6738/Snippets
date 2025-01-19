import React from 'react'
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

const Home = () => {
  const { isAuthenticated, user } = useUser();
  const [recentSnippets, setRecentSnippets] = useState([]);
  const [featuredDirectories, setFeaturedDirectories] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [bulkCreateModalOpen, setBulkCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedSnippetId, setSelectedSnippetId] = useState(null);

  useEffect(() => {
    fetchHomeData();
  }, [isAuthenticated]);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError('');

      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();

      // Fetch recent snippets
      const snippetsResponse = await axios.get('/api/snippets', {
        params: {
          limit: 5,
          sort: '-createdAt',
          _t: timestamp  // Add timestamp to force refresh
        },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      // Fetch featured directories
      const directoriesResponse = await axios.get('/api/directories', {
        params: {
          featured: true,
          limit: 4,
          _t: timestamp  // Add timestamp to force refresh
        },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      setRecentSnippets(snippetsResponse.data.snippets);
      setFeaturedDirectories(directoriesResponse.data.directories);

      // Fetch user stats if authenticated
      if (isAuthenticated) {
        const activitiesResponse = await axios.get('/api/activities/user', {
          params: { _t: timestamp },
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        const stats = {
          totalSnippets: snippetsResponse.data.total,
          totalDirectories: directoriesResponse.data.directories?.length || 0,
          recentActivities: activitiesResponse.data.activities
        };
        setUserStats(stats);
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-3xl font-bold mb-4">
          {isAuthenticated ? `Welcome back, ${user.username}!` : 'Welcome to Code Snippets'}
        </h1>
        <p className="text-gray-600 mb-6">
          {isAuthenticated 
            ? 'Manage your code snippets, directories, and collaborations.'
            : 'Store, share, and manage your code snippets efficiently.'}
        </p>
        {!isAuthenticated && (
          <div className="flex gap-4">
            <Link 
              to="/register" 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
            <Link 
              to="/login" 
              className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions for Authenticated Users */}
      {isAuthenticated && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button 
            onClick={() => setCreateModalOpen(true)}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
          >
            <h3 className="text-lg font-semibold mb-2">Create Snippet</h3>
            <p className="text-gray-600">Add a new code snippet to your collection</p>
          </button>
          <button
            onClick={() => setBulkCreateModalOpen(true)}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
          >
            <h3 className="text-lg font-semibold mb-2">Bulk Create</h3>
            <p className="text-gray-600">Create multiple snippets at once</p>
          </button>
          <Link 
            to="/directories/new" 
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">New Directory</h3>
            <p className="text-gray-600">Organize your snippets in directories</p>
          </Link>
        </div>
      )}

      {/* Recent Snippets */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Snippets</h2>
          <Link to="/snippets" className="text-blue-600 hover:text-blue-800">
            View All →
          </Link>
        </div>
        <div className="grid gap-4">
          {recentSnippets.map(snippet => (
            <div key={snippet._id} className="border rounded-lg p-4">
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

      {/* Featured Directories */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Featured Directories</h2>
          <Link to="/directories" className="text-blue-600 hover:text-blue-800">
            View All →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {featuredDirectories.map(directory => (
            <div key={directory._id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{directory.name}</h3>
                  <p className="text-sm text-gray-600">{directory.description}</p>
                </div>
                <Link 
                  to={`/directories/${directory._id}`} 
                  className="text-blue-600 hover:text-blue-800"
                >
                  Open →
                </Link>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <span className="mr-4">Snippets: {directory.snippetCount || 0}</span>
                <span>Visibility: {directory.visibility}</span>
              </div>
            </div>
          ))}
        </div>
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

      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default Home;
