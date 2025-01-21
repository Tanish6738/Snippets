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
        const { data } = await axios.get(`/api/directories/${directoryId}`);
        console.log('Fetched directory data:', data);
        setDirectory(data);
        setFormData({
          name: data.name,
          visibility: data.visibility,
        });
      } catch (err) {
        console.error('Error fetching directory:', err);
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
      const { data } = await axios.put(`/api/directories/${directoryId}`, formData);
      console.log('Directory updated successfully:', data);
      onDirectoryUpdated(data);
      onClose();
    } catch (err) {
      console.error('Error updating directory:', err);
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
                Edit Directory: {formData.name}
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
                <div className="animate-pulse text-indigo-400">Loading directory details...</div>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-300">
                {error}
              </div>
            ) : directory ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Initial Data Display */}
                <div className="bg-indigo-500/5 rounded-xl p-4 border border-indigo-500/20">
                  <p className="text-sm text-indigo-400">Last Updated</p>
                  <p className="text-indigo-200">
                    {directory.updatedAt ? new Date(directory.updatedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>

                {/* Path Section */}
                <div className="bg-indigo-500/5 rounded-xl p-4 border border-indigo-500/20">
                  <h3 className="text-lg font-medium text-indigo-200 mb-2">Path</h3>
                  <p className="text-indigo-300 font-mono text-sm">{directory.path}</p>
                </div>

                {/* Edit Form Fields */}
                <div className="bg-indigo-500/5 rounded-xl p-4 border border-indigo-500/20 space-y-4">
                  <h3 className="text-lg font-medium text-indigo-200 mb-2">Directory Details</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-2">
                      Directory Name
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 
                               text-white placeholder-indigo-400/60 focus:border-indigo-500 
                               focus:ring-1 focus:ring-indigo-500 transition-all"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-2">
                      Visibility
                    </label>
                    <select
                      className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 
                               text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 
                               transition-all"
                      value={formData.visibility}
                      onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
                    >
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                      <option value="shared">Shared</option>
                    </select>
                  </div>
                </div>

                {/* Statistics Grid */}
                <div className="bg-indigo-500/5 rounded-xl p-4 border border-indigo-500/20">
                  <h3 className="text-lg font-medium text-indigo-200 mb-4">Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Total Snippets', value: directory.metadata?.snippetCount || 0 },
                      { label: 'Subdirectories', value: directory.metadata?.subDirectoryCount || 0 },
                      { label: 'Total Size', value: `${((directory.metadata?.size || 0) / 1024).toFixed(2)} KB` },
                      { label: 'Current Visibility', value: directory.visibility, capitalize: true }
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

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-indigo-500/20">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-indigo-300 hover:text-indigo-200 
                             hover:bg-indigo-500/10 transition-all"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading || !hasChanges()}
                    className={`px-6 py-2 rounded-xl text-white bg-gradient-to-r 
                              ${hasChanges() 
                                ? 'from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600' 
                                : 'from-gray-500 to-gray-600 cursor-not-allowed'
                              } transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 
                              flex items-center`}
                  >
                    <FiSave className="mr-2" />
                    {loading ? 'Updating...' : hasChanges() ? 'Update Directory' : 'No Changes'}
                  </motion.button>
                </div>
              </form>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditDirectoryDetails;