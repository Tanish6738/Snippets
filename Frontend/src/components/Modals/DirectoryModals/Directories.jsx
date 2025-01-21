import { useState, useEffect } from 'react';
import { useUser } from '../../../Context/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFolder, FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import axios from '../../../Config/Axios';
import ViewDirectoryDetailsModal from './ViewDirectoryDetailsModal';
import CreateDirectoryModal from './CreateDirectoryModal';
import EditDirectoryDetails from './EditDirectoryDetails';

const Directories = () => {
  const { isAuthenticated, user } = useUser();
  const [directories, setDirectories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalStates, setModalStates] = useState({
    view: false,
    create: false,
    edit: false
  });
  const [selectedDirectory, setSelectedDirectory] = useState(null);

  const fetchDirectories = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        q: searchQuery,
        featured: viewMode === 'featured' ? 'true' : undefined
      };

      const { data } = await axios.get('/api/directories', { params });
      setDirectories(data.directories || []);
      setTotalPages(Math.ceil((data.total || 0) / 10));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch directories');
    } finally {
      setLoading(false);
    }
  };

  // Add new function for moving directories
  const handleMoveDirectory = async (directoryId, newParentId) => {
    try {
      await axios.post(`/api/directories/${directoryId}/move`, {
        newParentId
      });
      fetchDirectories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to move directory');
    }
  };

  // Add sharing functionality
  const handleShareDirectory = async (directoryId, entityId, entityType, role) => {
    try {
      await axios.post(`/api/directories/${directoryId}/share`, {
        entityId,
        entityType,
        role
      });
      fetchDirectories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to share directory');
    }
  };

  useEffect(() => {
    fetchDirectories();
  }, [viewMode, currentPage, searchQuery, isAuthenticated]);

  const handleModalToggle = (modalType, value, directory = null) => {
    setModalStates(prev => ({ ...prev, [modalType]: value }));
    if (directory) setSelectedDirectory(directory);
    if (!value) setSelectedDirectory(null);
  };

  const handleDelete = async (directoryId) => {
    try {
      await axios.delete(`/api/directories/${directoryId}`);
      fetchDirectories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete directory');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 sm:mb-0">
          <FiFolder className="inline-block mr-2" />
          Directories
        </h1>
        {isAuthenticated && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleModalToggle('create', true)}
            className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
          >
            <FiPlus className="mr-2" /> Create Directory
          </motion.button>
        )}
      </div>

      {/* Search and Filter Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search directories..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {isAuthenticated && (
          <select
            className="w-full sm:w-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="all">All Directories</option>
            <option value="my">My Directories</option>
          </select>
        )}
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r"
          >
            <p className="text-red-700">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Directory List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence>
            {directories.map((directory, index) => (
              <motion.div
                key={directory._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div className="mb-4 sm:mb-0">
                    <h3 className="text-xl font-semibold text-gray-900">{directory.name}</h3>
                    <p className="text-gray-600 mt-1">{directory.path}</p>
                  </div>
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleModalToggle('view', true, directory)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full"
                    >
                      <FiEye />
                    </motion.button>
                    {isAuthenticated && directory.createdBy === user._id && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleModalToggle('edit', true, directory)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                        >
                          <FiEdit2 />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(directory._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                        >
                          <FiTrash2 />
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                    Snippets: {directory.metadata.snippetCount}
                  </span>
                  <span className="flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    Subdirectories: {directory.metadata.subDirectoryCount}
                  </span>
                  <span className="flex items-center">
                    <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                    Visibility: {directory.visibility}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-lg ${
                  currentPage === i + 1
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {i + 1}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <ViewDirectoryDetailsModal
        isOpen={modalStates.view}
        onClose={() => handleModalToggle('view', false)}
        directoryId={selectedDirectory?._id}
      />

      <CreateDirectoryModal
        isOpen={modalStates.create}
        onClose={() => handleModalToggle('create', false)}
        onDirectoryCreated={fetchDirectories}
      />

      <EditDirectoryDetails
        isOpen={modalStates.edit}
        onClose={() => handleModalToggle('edit', false)}
        directory={selectedDirectory}
        onDirectoryUpdated={fetchDirectories}
      />
    </motion.div>
  );
};

export default Directories;