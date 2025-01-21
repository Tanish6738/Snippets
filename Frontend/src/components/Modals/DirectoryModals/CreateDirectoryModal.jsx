import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFolder, FiX, FiLock, FiGlobe, FiUsers } from 'react-icons/fi';
import axios from '../../../Config/Axios';

const CreateDirectoryModal = ({ isOpen, onClose, onDirectoryCreated, parentId = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    visibility: 'private',
    parentId: null,
    path: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableParents, setAvailableParents] = useState([]);

  useEffect(() => {
    const fetchParentDirectories = async () => {
      try {
        const { data } = await axios.get('/api/directories/tree');
        setAvailableParents(data);
      } catch (err) {
        console.error('Failed to fetch parent directories:', err);
      }
    };

    if (isOpen) {
      fetchParentDirectories();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      // Filter out undefined/null values
      const payload = Object.entries(formData)
        .filter(([_, value]) => value !== null && value !== undefined)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

      const { data } = await axios.post('/api/directories', payload);
      
      // Log activity
      await axios.post('/api/activities', {
        action: 'create',
        targetType: 'directory',
        targetId: data._id
      });

      onDirectoryCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create directory');
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
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-md w-full bg-[#0B1120]/95 backdrop-blur-xl rounded-2xl shadow-lg border border-indigo-500/30 overflow-hidden transition-all transform duration-300 ease-in-out hover:border-indigo-400/50 hover:shadow-indigo-500/10 mx-4"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-indigo-500/20">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent flex items-center">
                <FiFolder className="mr-3 text-indigo-400" />
                Create Directory
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

          {/* Form Content */}
          <div className="px-6 py-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-1">
                  Directory Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white placeholder-indigo-400/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter directory name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-1">
                  Visibility
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'private', icon: FiLock, label: 'Private' },
                    { value: 'public', icon: FiGlobe, label: 'Public' },
                    { value: 'shared', icon: FiUsers, label: 'Shared' },
                  ].map(({ value, icon: Icon, label }) => (
                    <motion.button
                      key={value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFormData(prev => ({ ...prev, visibility: value }))}
                      className={`p-3 rounded-xl flex flex-col items-center justify-center border ${
                        formData.visibility === value
                          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                          : 'border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      <span className="text-sm">{label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-1">
                  Parent Directory
                </label>
                <select
                  className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white placeholder-indigo-400/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                  value={formData.parentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                >
                  <option value="">Select parent directory</option>
                  {availableParents.map(parent => (
                    <option key={parent._id} value={parent._id}>
                      {parent.name}
                    </option>
                  ))}
                </select>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-indigo-500/20 bg-indigo-500/5">
            <div className="flex justify-end space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 transition-all duration-200"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 rounded-xl text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_25px_rgba(99,102,241,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create Directory'
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateDirectoryModal;