import { useState } from 'react';
import axios from '../../../Config/Axios';

const AddMemberModal = ({ isOpen, onClose, groupId, onMemberAdded }) => {
  const [formData, setFormData] = useState({
    userId: '',
    role: 'member'
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchUsers = async (query) => {
    if (!query) return setUsers([]);
    try {
      const { data } = await axios.get(`/api/users/search?q=${query}`);
      setUsers(data);
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const { data } = await axios.post(`/api/groups/${groupId}/members`, formData);
      onMemberAdded(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Add Member</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Search User</label>
            <input
              type="text"
              onChange={(e) => searchUsers(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="Search by username or email"
            />
            {users.length > 0 && (
              <div className="mt-2 border rounded-md max-h-40 overflow-y-auto">
                {users.map(user => (
                  <div
                    key={user._id}
                    onClick={() => setFormData(prev => ({ ...prev, userId: user._id }))}
                    className="p-2 hover:bg-gray-50 cursor-pointer"
                  >
                    {user.username}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
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
              disabled={loading || !formData.userId}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;