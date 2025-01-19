import { useState, useEffect } from 'react';
import { useUser } from '../../../Context/UserContext';
import axios from '../../../Config/Axios';
import ViewDirectoryDetailsModal from './ViewDirectoryDetailsModal';
import CreateDirectoryModal from './CreateDirectoryModal';
import EditDirectoryDetails from './EditDirectoryDetails';

const Directories = () => {
  const { isAuthenticated, user } = useUser();
  const [directories, setDirectories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'my'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDirectory, setSelectedDirectory] = useState(null);

  const fetchDirectories = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        q: searchQuery
      };

      if (viewMode === 'my' && isAuthenticated) {
        params.userId = user._id;
      }

      const { data } = await axios.get('/api/directories', { params });
      setDirectories(data.directories || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch directories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectories();
  }, [viewMode, currentPage, searchQuery, isAuthenticated]);

  const handleDelete = async (directoryId) => {
    try {
      await axios.delete(`/api/directories/${directoryId}`);
      fetchDirectories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete directory');
    }
  };

  const handleDirectoryCreated = () => {
    fetchDirectories();
  };

  const handleDirectoryUpdated = () => {
    fetchDirectories();
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Directories</h1>
        {isAuthenticated && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Directory
          </button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search directories..."
            className="w-full p-2 border rounded"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {isAuthenticated && (
          <select
            className="p-2 border rounded"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="all">All Directories</option>
            <option value="my">My Directories</option>
          </select>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid gap-6">
          {directories.map(directory => (
            <div key={directory._id} className="border rounded-lg p-4 bg-white shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{directory.name}</h3>
                  <p className="text-gray-600 mb-2">{directory.path}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedDirectory(directory);
                      setViewModalOpen(true);
                    }}
                    className="px-3 py-1 text-blue-600 hover:text-blue-800"
                  >
                    View
                  </button>
                  {isAuthenticated && directory.createdBy === user._id && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedDirectory(directory);
                          setEditModalOpen(true);
                        }}
                        className="px-3 py-1 text-green-600 hover:text-green-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(directory._id)}
                        className="px-3 py-1 text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <span className="mr-4">Snippets: {directory.metadata.snippetCount}</span>
                <span className="mr-4">Subdirectories: {directory.metadata.subDirectoryCount}</span>
                <span>Visibility: {directory.visibility}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center space-x-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Modals */}
      {viewModalOpen && (
        <ViewDirectoryDetailsModal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedDirectory(null);
          }}
          directoryId={selectedDirectory?._id}
        />
      )}

      {createModalOpen && (
        <CreateDirectoryModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onDirectoryCreated={handleDirectoryCreated}
        />
      )}

      {editModalOpen && (
        <EditDirectoryDetails
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedDirectory(null);
          }}
          directory={selectedDirectory}
          onDirectoryUpdated={handleDirectoryUpdated}
        />
      )}
    </div>
  );
};

export default Directories;