import { useState, useEffect, useCallback } from 'react';
import axios from '../../../Config/Axios';
import { FaSearch, FaSpinner, FaUserPlus, FaTimes } from 'react-icons/fa';

const AddMemberModal = ({ isOpen, onClose, groupId, onMemberAdded, currentMembers = [] }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingMembers, setAddingMembers] = useState(false);
  const [error, setError] = useState('');

  // Add validation for props
  useEffect(() => {
    if (isOpen && (!groupId || !Array.isArray(currentMembers))) {
      console.error('Invalid props:', { groupId, currentMembers });
      onClose();
      return;
    }
  }, [isOpen, groupId, currentMembers]);

  // Fetch available users on modal open
  useEffect(() => {
    if (isOpen && groupId) {
      console.log('AddMemberModal opened for group:', {
        groupId,
        currentMembers: currentMembers?.length || 0
      });
      
      if (!currentMembers) {
        console.warn('No current members provided');
        return;
      }

      fetchUsers();
    }
  }, [isOpen, groupId, currentMembers]);

  // Add debug logs for state changes
  useEffect(() => {
    console.log('AddMemberModal state:', {
      isOpen,
      groupId,
      currentMemberCount: currentMembers?.length,
      selectedUserCount: selectedUsers.length,
      loading,
      addingMembers
    });
  }, [isOpen, groupId, currentMembers, selectedUsers, loading, addingMembers]);

  // Debounced search function
  const debouncedSearch = useCallback((query) => {
    console.log('Performing search with query:', query);
    const filtered = users.filter(user =>
      user?.username?.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    );
    console.log('Search results:', filtered);
    setFilteredUsers(filtered);
  }, [users]);

  // Use effect for search debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearch]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedUsers([]);
      setSearchQuery('');
      setError('');
    }
  }, [isOpen]);

  // Update fetchUsers to properly filter existing members
  const fetchUsers = async () => {
    try {
        console.log('Starting user fetch');
        setLoading(true);
        setError('');
        
        const response = await axios.get(`/api/users/available-for-group/${groupId}`);
        
        if (!response.data) {
            throw new Error('No data received from server');
        }

        const availableUsers = response.data;
        console.log('Available users:', {
            count: availableUsers.length,
            users: availableUsers
        });
        
        setUsers(availableUsers);
        setFilteredUsers(availableUsers);

    } catch (err) {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to load users';
        console.error('User fetch error:', {
            message: errorMessage,
            status: err.response?.status,
            data: err.response?.data
        });
        setError(errorMessage);
        setUsers([]);
        setFilteredUsers([]);
    } finally {
        setLoading(false);
        console.log('User fetch completed');
    }
  };

  // Fix for continuous loading animation
  useEffect(() => {
    let timeoutId;
    if (loading) {
      console.log('Loading timeout started');
      timeoutId = setTimeout(() => {
        console.warn('Loading taking too long, forcing state update');
        setLoading(false);
      }, 10000); // 10 second timeout
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        console.log('Loading timeout cleared');
      }
    };
  }, [loading]);

  const handleSearch = (query) => {
    console.log('Searching users with query:', query);
    setSearchQuery(query);
  };

  const toggleUserSelection = (userId) => {
    console.log('Toggling user selection:', userId);
    setSelectedUsers(prev => {
      const newSelection = prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      console.log('Updated selection:', newSelection);
      return newSelection;
    });
  };

  // Update handleSubmit to ensure proper payload structure
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUsers.length) {
        console.log('No users selected, skipping submit');
        return;
    }

    try {
        setAddingMembers(true);
        setError('');
        console.log('Starting member addition:', {
            groupId,
            selectedUsers,
            count: selectedUsers.length
        });

        // Add members one at a time with error handling
        for (const userId of selectedUsers) {
            try {
                await axios.post(`/api/groups/${groupId}/members`, {
                    userId,
                    role: 'member',
                    permissions: [
                        'create_snippet',
                        'edit_snippet',
                        'create_directory',
                        'edit_directory'
                    ]
                });
                console.log(`Successfully added member: ${userId}`);
            } catch (err) {
                console.error(`Failed to add member ${userId}:`, err);
                throw err;
            }
        }

        console.log('All members added successfully');
        await onMemberAdded();
        onClose();

    } catch (err) {
        const errorMsg = err.response?.data?.error || 'Failed to add members';
        console.error('Member addition error:', {
            message: errorMsg,
            response: err.response?.data,
            error: err
        });
        setError(errorMsg);
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
              ) : error ? (
                <div className="p-8 text-center text-red-400">
                  <p>{error}</p>
                  <button 
                      onClick={fetchUsers}
                      className="mt-4 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-lg"
                  >
                      Retry
                  </button>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-indigo-400">
                  {searchQuery ? 'No users found matching your search' : 'No users available'}
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
                          {user?.username || 'User'}
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