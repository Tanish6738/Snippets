import { useState, useEffect } from 'react';
import axios from '../../../Config/Axios';

const EditDirectoryDetails = ({ isOpen, onClose, directory, onDirectoryUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    visibility: 'private'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (directory) {
      setFormData({
        name: directory.name,
        visibility: directory.visibility
      });
    }
  }, [directory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const { data } = await axios.put(`/api/directories/${directory._id}`, formData);
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
                Edit Directory
              </h2>
              <button onClick={onClose} className="text-2xl text-indigo-400 
                                                hover:text-indigo-300 transition-colors">×</button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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

              {/* Footer */}
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
                  className="px-6 py-2 rounded-xl text-white bg-gradient-to-r from-indigo-500 
                           to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all 
                           shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Directory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditDirectoryDetails;