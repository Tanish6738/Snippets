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
      setUsers(data.filter(user => !user.groups.some(g => g.groupId === groupId)));
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const { data } = await axios.post(`/api/groups/${groupId}/members`, {
        userId: formData.userId,
        role: formData.role
      });

      await axios.post('/api/activities', {
        action: 'create',
        targetType: 'group',
        targetId: groupId,
        metadata: {
          action: 'add_member',
          memberRole: formData.role
        },
        relatedUsers: [formData.userId]
      });

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
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm"></div>
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative max-w-2xl w-full bg-[#0B1120]/95 backdrop-blur-xl rounded-2xl shadow-lg border border-indigo-500/30 overflow-hidden">
          <div className="px-6 py-4 border-b border-indigo-500/20">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                Add Member
              </h2>
              <button onClick={onClose} className="text-indigo-400 hover:text-indigo-300 transition-colors">×</button>
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-indigo-300 mb-1">Search User</label>
              <input
                type="text"
                onChange={(e) => searchUsers(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white placeholder-indigo-400/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="Search by username or email"
              />
              {users.length > 0 && (
                <div className="mt-2 border border-indigo-500/20 rounded-xl max-h-40 overflow-y-auto">
                  {users.map(user => (
                    <div
                      key={user._id}
                      onClick={() => setFormData(prev => ({ ...prev, userId: user._id }))}
                      className="p-3 hover:bg-indigo-500/10 cursor-pointer text-indigo-200"
                    >
                      {user.username}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-indigo-300 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-indigo-500/20">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.userId}
                className="px-6 py-2 rounded-xl text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;