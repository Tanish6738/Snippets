import { useState, useEffect } from 'react';
import axios from '../../../Config/Axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFolder, FiX, FiInfo } from 'react-icons/fi';

const ViewDirectoryDetailsModal = ({ isOpen, onClose, directoryId }) => {
  const [directory, setDirectory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDirectoryDetails = async () => {
      if (!directoryId) return;
      try {
        setLoading(true);
        setError('');
        const { data } = await axios.get(`/api/directories/${directoryId}`);
        setDirectory(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load directory details');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && directoryId) {
      fetchDirectoryDetails();
    }
  }, [isOpen, directoryId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-2xl w-full bg-[#0B1120]/95 backdrop-blur-xl rounded-2xl shadow-lg border border-indigo-500/30 overflow-hidden transition-all transform duration-300 ease-in-out hover:border-indigo-400/50 hover:shadow-indigo-500/10 mx-4"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-indigo-500/20">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent flex items-center">
                <FiFolder className="mr-3 text-indigo-400" />
                {directory?.name || 'Loading...'}
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
              >
                <FiX className="w-6 h-6" />
              </motion.button>
            </div>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-track-indigo-500/10 scrollbar-thumb-indigo-500/40">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-pulse text-indigo-400">Loading...</div>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-300">
                {error}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Path Section */}
                <div className="bg-indigo-500/5 rounded-xl p-4 border border-indigo-500/20">
                  <h3 className="text-lg font-medium text-indigo-200 mb-2">Path</h3>
                  <p className="text-indigo-300 font-mono text-sm">{directory.path}</p>
                </div>

                {/* Statistics Grid */}
                <div className="bg-indigo-500/5 rounded-xl p-4 border border-indigo-500/20">
                  <h3 className="text-lg font-medium text-indigo-200 mb-4">Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Total Snippets', value: directory.metadata.snippetCount },
                      { label: 'Subdirectories', value: directory.metadata.subDirectoryCount },
                      { label: 'Total Size', value: `${(directory.metadata.size / 1024).toFixed(2)} KB` },
                      { label: 'Visibility', value: directory.visibility, capitalize: true }
                    ].map(({ label, value, capitalize }) => (
                      <div key={label} className="bg-indigo-500/10 rounded-xl p-3 border border-indigo-500/20">
                        <p className="text-sm text-indigo-400">{label}</p>
                        <p className={`font-medium text-indigo-200 ${capitalize ? 'capitalize' : ''}`}>
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div className="flex flex-col gap-2 text-sm text-indigo-400">
                  <p>Created: {new Date(directory.createdAt).toLocaleDateString()}</p>
                  <p>Last Updated: {new Date(directory.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ViewDirectoryDetailsModal;