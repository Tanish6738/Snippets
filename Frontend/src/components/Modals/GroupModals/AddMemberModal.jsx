import { useState, useEffect } from 'react';
import axios from '../../../Config/Axios';
import { FaSearch, FaSpinner, FaUserPlus, FaTimes } from 'react-icons/fa';

const AddMemberModal = ({ isOpen, onClose, groupId, onMemberAdded }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingMembers, setAddingMembers] = useState(false);
  const [error, setError] = useState('');

  // Fetch available users on modal open
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await axios.get('/api/users/all');
      // Filter out users already in the group
      const availableUsers = data.filter(user => 
        !user.groups?.some(g => g.groupId === groupId)
      );
      setUsers(availableUsers);
      setFilteredUsers(availableUsers);
    } catch (err) {
      setError('Failed to load users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUsers.length) return;

    try {
      setAddingMembers(true);
      setError('');

      // Add members sequentially
      for (const userId of selectedUsers) {
        await axios.post(`/api/groups/${groupId}/members`, {
          userId,
          role: 'member'
        });

        // Log activity for each added member
        await axios.post('/api/activities', {
          action: 'create',
          targetType: 'group',
          targetId: groupId,
          metadata: {
            action: 'add_member',
            memberRole: 'member'
          },
          relatedUsers: [userId]
        });
      }

      onMemberAdded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add members');
    } finally {
      setAddingMembers(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm"></div>
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative max-w-2xl w-full bg-[#0B1120]/95 backdrop-blur-xl rounded-2xl shadow-lg border border-indigo-500/30 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-indigo-500/20">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                Add Members
              </h2>
              <button 
                onClick={onClose} 
                className="p-2 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-300">
              {error}
            </div>
          )}

          <div className="p-6 space-y-6">
            {/* Search Box */}
            <div className="relative">
              <FaSearch className="absolute left-4 top-3.5 text-indigo-400/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 
                         text-white placeholder-indigo-400/60 focus:border-indigo-500 focus:ring-1 
                         focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Users List */}
            <div className="border border-indigo-500/20 rounded-xl overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-indigo-400">
                  <FaSpinner className="animate-spin mx-auto mb-2" size={24} />
                  <p>Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-indigo-400">
                  No users found
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto">
                  {filteredUsers.map(user => (
                    <div
                      key={user._id}
                      onClick={() => toggleUserSelection(user._id)}
                      className={`
                        flex items-center px-4 py-3 cursor-pointer transition-all
                        ${selectedUsers.includes(user._id) 
                          ? 'bg-indigo-500/20' 
                          : 'hover:bg-indigo-500/10'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => toggleUserSelection(user._id)}
                        className="w-4 h-4 rounded border-indigo-500/50 text-indigo-500 
                                 focus:ring-indigo-500 focus:ring-offset-0 bg-indigo-500/10"
                      />
                      <div className="ml-4">
                        <div className="text-indigo-200 font-medium">
                          {user.username}
                        </div>
                        <div className="text-indigo-400 text-sm">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-indigo-500/20">
              <div className="text-indigo-400 text-sm">
                {selectedUsers.length} users selected
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-indigo-300 hover:text-indigo-200 
                           hover:bg-indigo-500/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={addingMembers || selectedUsers.length === 0}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl text-white 
                           bg-gradient-to-r from-indigo-500 to-violet-500 
                           hover:from-indigo-600 hover:to-violet-600 transition-all 
                           shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                >
                  {addingMembers ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <FaUserPlus />
                      Add Selected
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;