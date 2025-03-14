import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFolder, FiX, FiLock, FiGlobe, FiUsers } from 'react-icons/fi';
import axios from '../../../Config/Axios';
import { useLocation } from 'react-router-dom';

const CreateDirectoryModal = ({ isOpen, onClose, onDirectoryCreated }) => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    visibility: 'private',
    parentId: null,
    path: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableParents, setAvailableParents] = useState([]);

  // Update formData when modal opens with current directory context
  useEffect(() => {
    if (isOpen && location.state?.currentDirectory) {
      const currentDir = location.state.currentDirectory;
      setFormData(prev => ({
        ...prev,
        parentId: currentDir._id,
        path: currentDir.path ? `${currentDir.path}/${currentDir.name}` : currentDir.name
      }));
    }
  }, [isOpen, location.state]);

  // Fetch available parent directories
  useEffect(() => {
    const fetchParentDirectories = async () => {
      try {
        const response = await axios.get('/api/directories');
        // Ensure we have an array and handle the directories data structure
        const directories = response.data.directories || response.data || [];
        
        if (!Array.isArray(directories)) {
          console.error('Received invalid directories data:', directories);
          return;
        }

        // Filter out the current directory and its children to avoid circular references
        const filteredDirectories = directories.filter(dir => {
          if (!formData.parentId) return true;
          return dir._id !== formData.parentId && !dir.path?.includes(formData.path);
        });

        setAvailableParents(filteredDirectories);
      } catch (error) {
        console.error('Failed to fetch parent directories:', error);
        setError('Failed to load available directories');
      }
    };

    if (isOpen) {
      fetchParentDirectories();
    }
  }, [isOpen, formData.parentId, formData.path]);

  // Add this effect to handle path updates
  useEffect(() => {
    const updatePath = () => {
      if (formData.parentId) {
        const parent = availableParents.find(p => p._id === formData.parentId);
        if (parent) {
          const parentPath = parent.path ? `${parent.path}/${parent.name}` : parent.name;
          setFormData(prev => ({
            ...prev,
            path: parentPath
          }));
        }
      } else {
        setFormData(prev => ({
          ...prev,
          path: ''
        }));
      }
    };

    updatePath();
  }, [formData.parentId, availableParents]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      // Construct the full path for the new directory
      const fullPath = formData.path 
        ? `${formData.path}/${formData.name}`
        : formData.name;

      const payload = {
        name: formData.name,
        visibility: formData.visibility,
        parentId: formData.parentId,
        path: fullPath
      };

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
                Create Directory
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

          {/* Form Content */}
          <div className="px-6 py-4">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="Enter directory name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
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
                          ? 'border-slate-600 bg-slate-700/70 text-slate-200'
                          : 'border-slate-700/50 hover:border-slate-600/70 text-slate-400 hover:bg-slate-800/60'
                      } transition-all duration-200`}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      <span className="text-sm">{label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Parent directory selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Parent Directory
                </label>
                <div className="relative">
                  <FiFolder className="absolute left-4 top-3.5 text-slate-400" size={20} />
                  <select
                    name="parentId"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 focus:border-slate-600 focus:ring-1 focus:ring-slate-500 hover:border-slate-600/70 transition-all duration-200"
                    value={formData.parentId || ''}
                    onChange={(e) => {
                      const selectedParentId = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        parentId: selectedParentId || null
                      }));
                    }}
                  >
                    <option value="">Root Directory</option>
                    {availableParents.map(parent => (
                      <option 
                        key={parent._id} 
                        value={parent._id}
                        disabled={parent._id === formData._id}
                      >
                        {parent.path ? `${parent.path}/${parent.name}` : parent.name}
                        {parent.allSnippets?.length > 0 && ` (${parent.allSnippets.length} snippets)`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </form>
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
                disabled={loading}
                className="px-6 py-2 rounded-xl text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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