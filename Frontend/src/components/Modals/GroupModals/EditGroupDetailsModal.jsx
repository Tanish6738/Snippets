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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Edit Group</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Group Name</label>
            <input
              type="text"
              name="name"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              rows="3"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Join Policy</label>
            <select
              name="settings.joinPolicy"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={formData.settings.joinPolicy}
              onChange={handleChange}
            >
              <option value="open">Open</option>
              <option value="invite">Invite Only</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Visibility</label>
            <select
              name="settings.visibility"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={formData.settings.visibility}
              onChange={handleChange}
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGroupDetailsModal;