import { useState, useEffect } from 'react';
import axios from '../../../Config/Axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFolder, FiX, FiSave, FiEdit } from 'react-icons/fi';

const EditDirectoryDetails = ({ isOpen, onClose, directoryId, onDirectoryUpdated }) => {
  const [directory, setDirectory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    visibility: 'private',
  });

  useEffect(() => {
    const fetchDirectoryDetails = async () => {
      if (!directoryId) return;
      try {
        setLoading(true);
        setError('');
        // Using getDirectoryById endpoint which includes populated data
        const { data } = await axios.get(`/api/directories/${directoryId}`);
        setDirectory(data);
        setFormData({
          name: data.name,
          visibility: data.visibility
        });
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

  const hasChanges = () => {
    if (!directory) return false;
    return formData.name !== directory.name || 
           formData.visibility !== directory.visibility;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasChanges()) {
      onClose();
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Using updateDirectory endpoint
      const { data } = await axios.put(`/api/directories/${directoryId}`, {
        name: formData.name,
        visibility: formData.visibility
      });

      // Log activity after successful update
      await axios.post('/api/activities', {
        action: 'edit',
        targetType: 'directory',
        targetId: directoryId,
        metadata: {
          previousState: {
            name: directory.name,
            visibility: directory.visibility
          },
          newState: {
            name: formData.name,
            visibility: formData.visibility
          }
        }
      });

      onDirectoryUpdated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update directory');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-md w-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg border border-slate-700/30 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-700/30">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <FiFolder className="text-slate-300" />
                Edit Directory
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
              >
                <FiX size={18} />
              </motion.button>
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mx-6 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-300 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600 hover:scrollbar-thumb-slate-500 pr-4">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin -ml-1 mr-3 h-8 w-8 text-white">
                  <svg className="animate-spin h-8 w-8 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>
            ) : directory ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Directory Info */}
                <div>
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Last Updated</span>
                      <span className="text-slate-300">
                        {directory.updatedAt ? new Date(directory.updatedAt).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 mb-6">
                    <h3 className="text-sm font-medium text-slate-300 mb-2">Path</h3>
                    <div className="text-slate-400 font-mono text-sm break-all max-h-[80px] overflow-y-auto scrollbar-thin scrollbar-track-slate-700/30 scrollbar-thumb-slate-600/50 pr-2">
                      {directory.path}
                    </div>
                  </div>
                </div>

                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Directory Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder-slate-400 focus:border-slate-600 focus:ring-1 focus:ring-slate-500 hover:border-slate-600/70 transition-all duration-200"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                {/* Visibility Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Visibility
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'private', label: 'Private', icon: <FiX size={16} /> },
                      { value: 'public', label: 'Public', icon: <FiFolder size={16} /> },
                      { value: 'shared', label: 'Shared', icon: <FiEdit size={16} /> },
                    ].map(({ value, label, icon }) => (
                      <motion.button
                        key={value}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setFormData(prev => ({ ...prev, visibility: value }))}
                        className={`p-3 rounded-xl flex flex-col items-center justify-center border ${
                          formData.visibility === value
                            ? 'border-slate-600 bg-slate-700/70 text-slate-200'
                            : 'border-slate-700/50 hover:border-slate-600/70 text-slate-400 hover:bg-slate-800/60'
                        } transition-all duration-200`}
                      >
                        {icon}
                        <span className="text-sm mt-1">{label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Statistics */}
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <h3 className="text-sm font-medium text-slate-300 mb-4">Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50">
                      <p className="text-xs text-slate-400">Total Snippets</p>
                      <p className="text-slate-200 font-medium">{directory.metadata?.snippetCount || 0}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50">
                      <p className="text-xs text-slate-400">Subdirectories</p>
                      <p className="text-slate-200 font-medium">{directory.metadata?.subDirectoryCount || 0}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50">
                      <p className="text-xs text-slate-400">Total Size</p>
                      <p className="text-slate-200 font-medium">{((directory.metadata?.size || 0) / 1024).toFixed(2)} KB</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50">
                      <p className="text-xs text-slate-400">Current Visibility</p>
                      <p className="text-slate-200 font-medium capitalize">{directory.visibility}</p>
                    </div>
                  </div>
                </div>
              </form>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-700/30 bg-slate-800/30">
            <div className="flex justify-end space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-300 hover:text-slate-200 hover:bg-slate-800/60 transition-all duration-200"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={loading || !hasChanges()}
                className="px-6 py-2 rounded-xl text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </span>
                ) : (
                  'Update Directory'
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditDirectoryDetails;