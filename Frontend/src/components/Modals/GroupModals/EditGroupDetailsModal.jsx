import { useState, useEffect } from 'react';
import axios from '../../../Config/Axios';

const EditGroupDetailsModal = ({ isOpen, onClose, group, onGroupUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    settings: {
      joinPolicy: 'invite',
      visibility: 'private'
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: group.description,
        settings: {
          joinPolicy: group.settings.joinPolicy,
          visibility: group.settings.visibility
        }
      });
    }
  }, [group]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('settings.')) {
      const setting = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [setting]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const { data } = await axios.put(`/api/groups/${group._id}`, formData);
      onGroupUpdated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update group');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"></div>
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative max-w-2xl w-full bg-[#0B1120]/95 backdrop-blur-xl rounded-2xl 
                       shadow-lg border border-indigo-500/30 overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-indigo-500/20">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 
                           bg-clip-text text-transparent">
                Edit Group
              </h2>
              <button onClick={onClose} className="text-2xl text-indigo-400 
                                                hover:text-indigo-300 transition-colors">×</button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/50 
                          text-red-300">
              {error}
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              {/* Group Name */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">Group Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border 
                           border-indigo-500/20 text-white placeholder-indigo-400/60 
                           focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 
                           transition-all"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">Description</label>
                <textarea
                  name="description"
                  rows="4"
                  className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border 
                           border-indigo-500/20 text-white placeholder-indigo-400/60 
                           focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 
                           transition-all resize-none"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              {/* Join Policy */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">Join Policy</label>
                <select
                  name="settings.joinPolicy"
                  className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border 
                           border-indigo-500/20 text-white focus:border-indigo-500 
                           focus:ring-1 focus:ring-indigo-500 transition-all"
                  value={formData.settings.joinPolicy}
                  onChange={handleChange}
                >
                  <option value="open">Open</option>
                  <option value="invite">Invite Only</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">Visibility</label>
                <select
                  name="settings.visibility"
                  className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border 
                           border-indigo-500/20 text-white focus:border-indigo-500 
                           focus:ring-1 focus:ring-indigo-500 transition-all"
                  value={formData.settings.visibility}
                  onChange={handleChange}
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-indigo-500/20">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-indigo-300 hover:text-indigo-200 
                         hover:bg-indigo-500/10 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 rounded-xl text-white bg-gradient-to-r 
                         from-indigo-500 to-violet-500 hover:from-indigo-600 
                         hover:to-violet-600 transition-all shadow-lg 
                         shadow-indigo-500/25 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditGroupDetailsModal;