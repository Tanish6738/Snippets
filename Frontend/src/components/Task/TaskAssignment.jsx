import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const TaskAssignment = ({ taskId, currentAssignees, projectMembers, onAssign, isAdmin }) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Initialize selected users based on current assignees
  useEffect(() => {
    if (currentAssignees && Array.isArray(currentAssignees)) {
      setSelectedUsers(currentAssignees.map(user => typeof user === 'object' ? user._id : user));
    }
  }, [currentAssignees]);

  // Filter members based on search query
  const filteredMembers = projectMembers.filter(member => {
    const username = member.user?.username || '';
    const email = member.user?.email || '';
    return username.toLowerCase().includes(searchQuery.toLowerCase()) || 
           email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Toggle user selection
  const toggleUserSelection = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // Handle assignment submission
  const handleAssign = () => {
    onAssign(selectedUsers);
  };

  // Check if user is already assigned
  const isUserAssigned = (userId) => {
    return selectedUsers.includes(userId);
  };

  return (
    <div className="mt-2">
      {/* Display current assignees */}
      <div className="flex flex-wrap gap-2 mb-4">
        {currentAssignees.length === 0 ? (
          <p className="text-gray-500">No users assigned</p>
        ) : (
          currentAssignees.map((user) => (
            <div 
              key={typeof user === 'object' ? user._id : user} 
              className="flex items-center bg-blue-100 rounded-full px-3 py-1"
            >
              {user.avatar && (
                <img 
                  src={user.avatar} 
                  alt={user?.username || 'User'} 
                  className="w-6 h-6 rounded-full mr-2"
                />
              )}
              <span>{user?.username || 'Unknown user'}</span>
              {isAdmin && (
                <button 
                  onClick={() => toggleUserSelection(typeof user === 'object' ? user._id : user)}
                  className="ml-2 text-red-500 text-xs hover:text-red-700"
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {isAdmin && (
        <div className="relative">
          {/* Search input */}
          <div className="flex mb-2">
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={() => setIsDropdownOpen(true)}
              className="p-2 border rounded flex-grow mr-2"
            />
            <button
              onClick={handleAssign}
              disabled={selectedUsers.length === 0}
              className={`px-4 py-2 rounded ${
                selectedUsers.length === 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Update Assignment
            </button>
          </div>

          {/* Members dropdown */}
          {isDropdownOpen && (
            <div className="absolute z-10 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
              {filteredMembers.length === 0 ? (
                <div className="p-3 text-gray-500">No members found</div>
              ) : (
                filteredMembers.map((member) => (
                  <div
                    key={member.user._id}
                    onClick={() => toggleUserSelection(member.user._id)}
                    className={`p-3 hover:bg-gray-100 cursor-pointer flex justify-between items-center ${
                      isUserAssigned(member.user._id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      {member.user.avatar && (
                        <img
                          src={member.user.avatar}
                          alt={member.user?.username || 'User'}
                          className="w-8 h-8 rounded-full mr-3"
                        />
                      )}
                      <div>
                        <div>{member.user?.username || 'User'}</div>
                        <div className="text-xs text-gray-500">{member.role}</div>
                      </div>
                    </div>
                    {isUserAssigned(member.user._id) && (
                      <div className="text-blue-600">✓</div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

TaskAssignment.propTypes = {
  taskId: PropTypes.string.isRequired,
  currentAssignees: PropTypes.array,
  projectMembers: PropTypes.array,
  onAssign: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool
};

TaskAssignment.defaultProps = {
  currentAssignees: [],
  projectMembers: [],
  isAdmin: false
};

export default TaskAssignment;