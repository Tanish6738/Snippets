import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { createSubtask, updateTaskStatus } from '../../services/taskService';

const TaskSubtasks = ({ taskId, subtasks, projectMembers, isAdmin }) => {
  const [newSubtask, setNewSubtask] = useState({ 
    title: '', 
    description: '', 
    priority: 'Medium',
    assignedTo: []
  });
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAssignees, setShowAssignees] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Function to handle status change for a subtask
  const handleStatusChange = async (subtaskId, newStatus) => {
    try {
      setLoading(true);
      await updateTaskStatus(subtaskId, newStatus);
      // You might want to refresh the parent task data here
      window.location.reload(); // Simple refresh for now, could be optimized
    } catch (err) {
      setError("Failed to update subtask status");
      console.error("Error updating status:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSubtask({
      ...newSubtask,
      [name]: value
    });
  };

  // Toggle assignee selection
  const toggleAssignee = (userId) => {
    const currentAssignees = [...newSubtask.assignedTo];
    if (currentAssignees.includes(userId)) {
      setNewSubtask({
        ...newSubtask,
        assignedTo: currentAssignees.filter(id => id !== userId)
      });
    } else {
      setNewSubtask({
        ...newSubtask,
        assignedTo: [...currentAssignees, userId]
      });
    }
  };

  // Filter members based on search
  const filteredMembers = projectMembers.filter(member => {
    const username = member.user?.username || '';
    const email = member.user?.email || '';
    return username.toLowerCase().includes(searchQuery.toLowerCase()) || 
           email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Submit new subtask
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newSubtask.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setLoading(true);
      await createSubtask(taskId, newSubtask);
      
      // Reset form
      setNewSubtask({ title: '', description: '', priority: 'Medium', assignedTo: [] });
      setIsCreating(false);
      
      // Refresh the page to show new subtask
      window.location.reload();
    } catch (err) {
      setError("Failed to create subtask");
      console.error("Error creating subtask:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate task status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'To Do': return 'bg-gray-500';
      case 'In Progress': return 'bg-blue-500';
      case 'On Hold': return 'bg-yellow-500';
      case 'Completed': return 'bg-green-500';
      case 'Cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="mt-2">
      {/* List of subtasks */}
      {subtasks && subtasks.length > 0 ? (
        <div className="space-y-3 mb-4">
          {subtasks.map((subtask) => (
            <div key={subtask._id} className="border rounded-md p-4 bg-white">
              <div className="flex justify-between items-center mb-2">
                <Link to={`/tasks/${subtask._id}`} className="text-lg font-medium hover:text-blue-600">
                  {subtask.title}
                </Link>
                <span 
                  className={`px-3 py-1 text-xs rounded text-white ${getStatusColor(subtask.status)}`}
                >
                  {subtask.status}
                </span>
              </div>
              
              {/* Subtask details */}
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {subtask.description || 'No description'}
              </p>
              
              <div className="flex justify-between items-center">
                {/* Assignees */}
                <div className="flex -space-x-2">
                  {subtask.assignedTo && subtask.assignedTo.length > 0 ? (
                    <>
                      {subtask.assignedTo.slice(0, 3).map((user) => (
                        <div 
                          key={user._id} 
                          className="w-7 h-7 rounded-full bg-gray-300 border border-white overflow-hidden"
                          title={user.username}
                        >
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-xs">
                              {user.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                      ))}
                      {subtask.assignedTo.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-gray-200 border border-white flex items-center justify-center text-xs">
                          +{subtask.assignedTo.length - 3}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-gray-500">Unassigned</span>
                  )}
                </div>
                
                {/* Status actions for admins */}
                {isAdmin && (
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleStatusChange(subtask._id, 'In Progress')}
                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      disabled={subtask.status === 'In Progress' || loading}
                    >
                      Start
                    </button>
                    <button 
                      onClick={() => handleStatusChange(subtask._id, 'Completed')}
                      className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                      disabled={subtask.status === 'Completed' || loading}
                    >
                      Complete
                    </button>
                  </div>
                )}
              </div>
              
              {/* If this subtask has subtasks, recursively render them */}
              {subtask.subtasks && subtask.subtasks.length > 0 && (
                <div className="mt-3 pl-4 border-l">
                  <div className="text-sm text-gray-500 mb-2">Sub-subtasks:</div>
                  {subtask.subtasks.map(subSubtask => (
                    <div key={subSubtask._id} className="flex items-center mb-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(subSubtask.status)} mr-2`}></div>
                      <Link to={`/tasks/${subSubtask._id}`} className="text-sm hover:text-blue-600">
                        {subSubtask.title}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 mb-4">No subtasks yet</p>
      )}

      {/* Error message */}
      {error && (
        <div className="text-red-500 mb-3">{error}</div>
      )}

      {/* Create subtask form */}
      {isAdmin && !isCreating ? (
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Subtask
        </button>
      ) : isCreating ? (
        <form onSubmit={handleSubmit} className="border rounded-md p-4 bg-gray-50">
          <h3 className="text-lg font-medium mb-3">Create New Subtask</h3>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={newSubtask.title}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={newSubtask.description}
              onChange={handleInputChange}
              className="w-full p-2 border rounded h-24"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Priority</label>
            <select
              name="priority"
              value={newSubtask.priority}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          
          {/* Assignees section */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Assign To</label>
            
            {/* Selected assignees */}
            <div className="flex flex-wrap gap-1 mb-2">
              {newSubtask.assignedTo.length > 0 ? (
                newSubtask.assignedTo.map(userId => {
                  const memberData = projectMembers.find(m => m.user._id === userId);
                  return memberData ? (
                    <div key={userId} className="bg-blue-100 rounded-full px-3 py-1 text-sm flex items-center">
                      {memberData.user.username}
                      <button 
                        type="button" 
                        onClick={() => toggleAssignee(userId)}
                        className="ml-2 text-xs text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  ) : null;
                })
              ) : (
                <div className="text-gray-500 text-sm">No users assigned</div>
              )}
            </div>
            
            {/* Assignee selector */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setShowAssignees(!showAssignees)}
                className="w-full p-2 border rounded text-left flex justify-between items-center"
              >
                <span>Select team members</span>
                <span>{showAssignees ? '▲' : '▼'}</span>
              </button>
              
              {showAssignees && (
                <div className="absolute z-10 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-2 border-b">
                    <input
                      type="text"
                      placeholder="Search members..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  
                  {filteredMembers.length === 0 ? (
                    <div className="p-3 text-gray-500">No members found</div>
                  ) : (
                    filteredMembers.map((member) => (
                      <div
                        key={member.user._id}
                        onClick={() => toggleAssignee(member.user._id)}
                        className={`p-3 hover:bg-gray-100 cursor-pointer flex justify-between items-center ${
                          newSubtask.assignedTo.includes(member.user._id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center">
                          {member.user.avatar && (
                            <img
                              src={member.user.avatar}
                              alt={member.user.username}
                              className="w-6 h-6 rounded-full mr-2"
                            />
                          )}
                          <div>
                            {member.user.username}
                            <span className="ml-2 text-xs text-gray-500">{member.role}</span>
                          </div>
                        </div>
                        {newSubtask.assignedTo.includes(member.user._id) && (
                          <div className="text-blue-600">✓</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Subtask'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
};

TaskSubtasks.propTypes = {
  taskId: PropTypes.string.isRequired,
  subtasks: PropTypes.array,
  projectMembers: PropTypes.array,
  isAdmin: PropTypes.bool
};

TaskSubtasks.defaultProps = {
  subtasks: [],
  projectMembers: [],
  isAdmin: false
};

export default TaskSubtasks;