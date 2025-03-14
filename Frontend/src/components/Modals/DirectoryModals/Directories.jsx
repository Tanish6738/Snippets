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
      className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 pt-16"
    >
      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Header Section */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <FiFolder className="text-slate-300" />
              Directories
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-2">
              Organize and manage your code snippet directories
            </p>
          </div>

          {isAuthenticated && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleModalToggle('create', true)}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <FiPlus size={18} /> Create Directory
            </motion.button>
          )}
        </div>

        {/* Search and Filter Section */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search directories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-12 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder-slate-400 focus:border-slate-600 focus:ring-1 focus:ring-slate-500 hover:border-slate-600/70 transition-all duration-200"
                />
                <FiSearch className="absolute left-4 top-3.5 text-slate-400" size={20} />
              </div>
            </div>
            
            {isAuthenticated && (
              <select
                className="w-full sm:w-48 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:text-slate-200 hover:bg-slate-700/50 hover:border-slate-600 focus:border-slate-600 focus:ring-1 focus:ring-slate-500 transition-all duration-200"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
              >
                <option value="all">All Directories</option>
                <option value="my">My Directories</option>
              </select>
            )}
          </div>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-300"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Directory List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6">
            <AnimatePresence>
              {directories.map((directory, index) => (
                <motion.div
                  key={directory._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-slate-700/30 shadow-lg hover:shadow-xl hover:border-slate-600/50 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-700/5 via-transparent to-slate-800/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700/50 group-hover:border-slate-600/70 transition-colors">
                          <FiFolder className="text-slate-300 group-hover:text-slate-200" size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                            {directory.name}
                          </h3>
                          <p className="text-sm text-slate-400 mt-1.5">
                            {directory.path}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleModalToggle('view', true, directory)}
                          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
                          aria-label="View directory"
                        >
                          <FiEye size={18} />
                        </motion.button>
                        {isAuthenticated && directory.createdBy === user?._id && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleModalToggle('edit', true, directory)}
                              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
                              aria-label="Edit directory"
                            >
                              <FiEdit2 size={18} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(directory._id)}
                              className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                              aria-label="Delete directory"
                            >
                              <FiTrash2 size={18} />
                            </motion.button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className="px-2.5 py-1 text-xs rounded-full bg-slate-800 text-slate-300 border border-slate-700/50 hover:border-slate-600/70 transition-colors flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Snippets: {directory.metadata.snippetCount}
                      </span>
                      <span className="px-2.5 py-1 text-xs rounded-full bg-slate-800 text-slate-300 border border-slate-700/50 hover:border-slate-600/70 transition-colors flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Subdirectories: {directory.metadata.subDirectoryCount}
                      </span>
                      <span className="px-2.5 py-1 text-xs rounded-full bg-slate-800 text-slate-300 border border-slate-700/50 hover:border-slate-600/70 transition-colors flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        Visibility: {directory.visibility}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    currentPage === i + 1
                      ? 'bg-slate-700 text-white border border-slate-600'
                      : 'bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-600'
                  } transition-colors`}
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
      </div>
    </motion.div>
  );
};

export default Directories;