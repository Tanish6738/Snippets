import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiX, FiLock, FiGlobe, FiUserPlus, FiUserX } from 'react-icons/fi';
import axios from '../../../Config/Axios';

const validateGroupData = (data) => {
  const errors = [];
  if (!data.name || data.name.trim().length < 3) {
    errors.push('Group name must be at least 3 characters');
  }
  if (data.name.trim().length > 50) {
    errors.push('Group name must be less than 50 characters');
  }
  if (data.description && data.description.trim().length > 500) {
    errors.push('Description must be less than 500 characters');
  }
  return errors;
};

const initialFormState = {
  name: '',
  description: '',
  settings: {
    joinPolicy: 'invite',
    visibility: 'private',
    snippetPermissions: {
      defaultVisibility: 'group',
      allowMemberCreation: true
    },
    directoryPermissions: {
      allowMemberCreation: true
    }
  }
};

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormState);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    const validationErrors = validateGroupData(formData);
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Match the exact schema expected by the backend
      const groupData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        settings: {
          joinPolicy: formData.settings.joinPolicy,
          visibility: formData.settings.visibility,
          snippetPermissions: {
            defaultVisibility: formData.settings.snippetPermissions.defaultVisibility,
            allowMemberCreation: formData.settings.snippetPermissions.allowMemberCreation
          },
          directoryPermissions: {
            allowMemberCreation: formData.settings.directoryPermissions.allowMemberCreation
          }
        }
      };

      const response = await axios.post('/api/groups', groupData);

      if (!response.data) {
        throw new Error('No data received from server');
      }

      // Only log activity if group creation was successful
      await axios.post('/api/activities', {
        action: 'create',
        targetType: 'group',
        targetId: response.data._id,
        metadata: {
          name: response.data.name,
          visibility: response.data.settings.visibility
        }
      });

      onGroupCreated(response.data);
      onClose();
    } catch (err) {
      console.error('Error creating group:', err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.errors?.[0]?.msg ||
        'Failed to create group. Please try again.'
      );
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
                <FiUsers className="mr-3 text-indigo-400" />
                Create Group
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
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white placeholder-indigo-400/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter group name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white placeholder-indigo-400/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter group description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-1">
                  Visibility
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: 'private', icon: FiLock, label: 'Private' },
                    { value: 'public', icon: FiGlobe, label: 'Public' },
                  ].map(({ value, icon: Icon, label }) => (
                    <motion.button
                      key={value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        settings: { ...prev.settings, visibility: value }
                      }))}
                      className={`p-3 rounded-xl flex flex-col items-center justify-center border ${
                        formData.settings.visibility === value
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
                  Join Policy
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'open', icon: FiUsers, label: 'Open' },
                    { value: 'invite', icon: FiUserPlus, label: 'Invite' },
                    { value: 'closed', icon: FiUserX, label: 'Closed' },
                  ].map(({ value, icon: Icon, label }) => (
                    <motion.button
                      key={value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        settings: { ...prev.settings, joinPolicy: value }
                      }))}
                      className={`p-3 rounded-xl flex flex-col items-center justify-center border ${
                        formData.settings.joinPolicy === value
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
                  'Create Group'
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateGroupModal;