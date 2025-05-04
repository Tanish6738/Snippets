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
            <div key={subtask._id} className="border rounded-xl p-4 bg-gradient-to-br from-white to-slate-100 shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-center mb-2">
                <Link to={`/tasks/${subtask._id}`} className="text-lg font-semibold text-slate-800 hover:text-indigo-600 transition-colors">
                  {subtask.title}
                </Link>
                <span 
                  className={`px-3 py-1 text-xs rounded-full font-semibold shadow-sm ${getStatusColor(subtask.status)}`}
                >
                  {subtask.status}
                </span>
              </div>
              {/* Subtask details */}
              <p className="text-gray-500 text-sm mb-3 line-clamp-2">
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
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 border-2 border-white overflow-hidden shadow"
                          title={user?.username || 'User'}
                        >
                          {user.avatar ? (
                            <img src={user.avatar} alt={user?.username || 'User'} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-xs font-bold text-slate-700">
                              {user?.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                      ))}
                      {subtask.assignedTo.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center text-xs font-semibold text-slate-700 shadow">
                          +{subtask.assignedTo.length - 3}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Unassigned</span>
                  )}
                </div>
                {/* Status actions for admins */}
                {isAdmin && (
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleStatusChange(subtask._id, 'In Progress')}
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                      disabled={subtask.status === 'In Progress' || loading}
                    >
                      Start
                    </button>
                    <button 
                      onClick={() => handleStatusChange(subtask._id, 'Completed')}
                      className="px-3 py-1 text-xs bg-green-500 text-white rounded-lg shadow hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 transition"
                      disabled={subtask.status === 'Completed' || loading}
                    >
                      Complete
                    </button>
                  </div>
                )}
              </div>
              {/* If this subtask has subtasks, recursively render them */}
              {subtask.subtasks && subtask.subtasks.length > 0 && (
                <div className="mt-3 pl-4 border-l-2 border-slate-200">
                  <div className="text-sm text-slate-400 mb-2 font-medium">Sub-subtasks:</div>
                  {subtask.subtasks.map(subSubtask => (
                    <div key={subSubtask._id} className="flex items-center mb-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(subSubtask.status)} mr-2`}></div>
                      <Link to={`/tasks/${subSubtask._id}`} className="text-sm hover:text-indigo-600 transition-colors">
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
        <p className="text-slate-400 mb-4 italic">No subtasks yet</p>
      )}

      {/* Error message */}
      {error && (
        <div className="text-red-600 mb-3 font-medium bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
      )}

      {/* Create subtask form */}
      {isAdmin && !isCreating ? (
        <button
          onClick={() => setIsCreating(true)}
          className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg shadow hover:from-indigo-600 hover:to-blue-600 font-semibold transition"
        >
          + Add Subtask
        </button>
      ) : isCreating ? (
        <form onSubmit={handleSubmit} className="border rounded-xl p-5 bg-gradient-to-br from-slate-50 to-white shadow-md mt-4">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Create New Subtask</h3>
          <div className="mb-4">
            <label className="block text-slate-700 mb-1 font-medium">Title</label>
            <input
              type="text"
              name="title"
              value={newSubtask.title}
              onChange={handleInputChange}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-slate-700 mb-1 font-medium">Description</label>
            <textarea
              name="description"
              value={newSubtask.description}
              onChange={handleInputChange}
              className="w-full p-2 border border-slate-300 rounded-lg h-24 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
            />
          </div>
          <div className="mb-4">
            <label className="block text-slate-700 mb-1 font-medium">Priority</label>
            <select
              name="priority"
              value={newSubtask.priority}
              onChange={handleInputChange}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          {/* Assignees section */}
          <div className="mb-4">
            <label className="block text-slate-700 mb-1 font-medium">Assign To</label>
            {/* Selected assignees */}
            <div className="flex flex-wrap gap-2 mb-2">
              {newSubtask.assignedTo.length > 0 ? (
                newSubtask.assignedTo.map(userId => {
                  const memberData = projectMembers.find(m => m.user._id === userId);
                  return memberData ? (
                    <div key={userId} className="bg-indigo-100 rounded-full px-3 py-1 text-sm flex items-center font-medium text-indigo-700 shadow">
                      {memberData.user?.username || 'User'}
                      <button 
                        type="button" 
                        onClick={() => toggleAssignee(userId)}
                        className="ml-2 text-xs text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ) : null;
                })
              ) : (
                <div className="text-slate-400 text-sm italic">No users assigned</div>
              )}
            </div>
            {/* Assignee selector */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setShowAssignees(!showAssignees)}
                className="w-full p-2 border border-slate-300 rounded-lg text-left flex justify-between items-center bg-white hover:bg-slate-50 transition font-medium"
              >
                <span>Select team members</span>
                <span>{showAssignees ? '▲' : '▼'}</span>
              </button>
              {showAssignees && (
                <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto mt-1">
                  <div className="p-2 border-b border-slate-100">
                    <input
                      type="text"
                      placeholder="Search members..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition"
                    />
                  </div>
                  {filteredMembers.length === 0 ? (
                    <div className="p-3 text-slate-400">No members found</div>
                  ) : (
                    filteredMembers.map((member) => (
                      <div
                        key={member.user._id}
                        onClick={() => toggleAssignee(member.user._id)}
                        className={`p-3 hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition ${
                          newSubtask.assignedTo.includes(member.user._id) ? 'bg-indigo-100' : ''
                        }`}
                      >
                        <div className="flex items-center">
                          {member.user.avatar && (
                            <img
                              src={member.user.avatar}
                              alt={member.user?.username || 'User'}
                              className="w-6 h-6 rounded-full mr-2"
                            />
                          )}
                          <div>
                            {member.user?.username || 'User'}
                            <span className="ml-2 text-xs text-slate-400">{member.role}</span>
                          </div>
                        </div>
                        {newSubtask.assignedTo.includes(member.user._id) && (
                          <div className="text-indigo-600 font-bold">✓</div>
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
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg shadow hover:from-indigo-600 hover:to-blue-600 font-semibold transition"
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