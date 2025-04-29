// Task List Item Component
import React, { useState } from 'react';
import { assignUsersToTask as assignTask } from '../../services/taskService';
import TaskComments from './TaskComments';

const TaskListItem = ({ task, onEdit, onAddSubtask, projectMembers = [], isAdmin = false, onTaskAssigned }) => {
  const [showAssign, setShowAssign] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState(task.assignedTo?.map(u => u._id || u) || []);
  const [assignLoading, setAssignLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleAssign = async () => {
    setAssignLoading(true);
    try {
      // Fixed: Send the userIds array as expected by the backend
      await assignTask(task._id, selectedUsers);
      setShowAssign(false);
      onTaskAssigned && onTaskAssigned();
    } catch (error) {
      console.error("Failed to assign task:", error);
      alert("Failed to assign task: " + (error.response?.data?.message || error.message || "Unknown error"));
    } finally {
      setAssignLoading(false);
    }
  };

  // Generate initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get color based on priority
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Urgent': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'High': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Medium': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Low': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  // Get color based on status
  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'In Progress': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Blocked': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'To Do': return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      case 'Under Review': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  // Avatar color based on username
  const avatarColors = [
    'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 
    'bg-red-500', 'bg-orange-500', 'bg-amber-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500',
    'bg-teal-500', 'bg-cyan-500', 'bg-blue-500'
  ];

  const getAvatarColor = (name) => {
    if (!name) return avatarColors[0];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % avatarColors.length;
    return avatarColors[index];
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const commentCount = task.comments?.length || 0;

  return (
    <div className="rounded-xl bg-gradient-to-br from-slate-800/70 to-slate-900/90 border border-slate-700/40 p-4 flex flex-col gap-3 shadow-md relative group">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-white text-base">{task.title}</h3>
        <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
          {isAdmin && (
            <button 
              onClick={() => setShowAssign(true)} 
              className="text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-1 rounded transition-colors"
            >
              Assign
            </button>
          )}
          {onEdit && (
            <button 
              onClick={() => onEdit(task)} 
              className="text-xs bg-indigo-600/50 hover:bg-indigo-600 text-indigo-300 hover:text-white px-2 py-1 rounded transition-colors"
            >
              Edit
            </button>
          )}
          {onAddSubtask && (
            <button 
              onClick={() => onAddSubtask(task)} 
              className="text-xs bg-emerald-600/50 hover:bg-emerald-600 text-emerald-300 hover:text-white px-2 py-1 rounded transition-colors"
            >
              + Subtask
            </button>
          )}
        </div>
      </div>
      
      {task.description && (
        <div className="text-sm text-slate-400 line-clamp-2">{task.description}</div>
      )}
      
      <div className="flex flex-wrap gap-2 items-center">
        <span className={`px-2 py-0.5 text-xs rounded border ${getStatusColor(task.status)}`}>
          {task.status}
        </span>
        <span className={`px-2 py-0.5 text-xs rounded border ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className="text-xs text-slate-400">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
      
      {/* Assignees */}
      {task.assignedTo && task.assignedTo.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-400 mr-1">Assignees:</span>
          <div className="flex -space-x-2">
            {task.assignedTo.map((user, index) => {
              const username = user.username || 'User';
              const avatarColor = getAvatarColor(username);
              return (
                <div 
                  key={user._id || index} 
                  className={`${avatarColor} w-6 h-6 rounded-full border border-slate-800 flex items-center justify-center text-white text-xs`}
                  title={username}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={username} className="rounded-full w-full h-full object-cover" />
                  ) : (
                    getInitials(username)
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comments toggle button */}
      <div className="mt-1">
        <button 
          onClick={toggleComments}
          className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" 
              clipRule="evenodd" 
            />
          </svg>
          {commentCount ? `${commentCount} Comment${commentCount !== 1 ? 's' : ''}` : 'Add Comment'}
        </button>
      </div>
      
      {/* Comments section */}
      {showComments && (
        <div className="mt-2 pt-3 border-t border-slate-700/50">
          <TaskComments 
            comments={task.comments || []} 
            taskId={task._id}
            onCommentAdded={onTaskAssigned} // Use the same refresh function
            projectMembers={projectMembers}
          />
        </div>
      )}
      
      {/* Assign Modal */}
      {isAdmin && showAssign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAssign(false)}>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-4 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Assign Task</h3>
              <button onClick={() => setShowAssign(false)} className="text-slate-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="text-sm text-slate-300 mb-3">Select team members to assign to "{task.title}":</div>
            
            <div className="max-h-60 overflow-y-auto mb-4">
              {projectMembers.length === 0 ? (
                <div className="text-slate-400 italic">No members available</div>
              ) : (
                <div className="space-y-2">
                  {projectMembers.map(member => {
                    const user = member.user;
                    const username = user.username || 'User';
                    const avatarColor = getAvatarColor(username);
                    return (
                      <label 
                        key={user._id} 
                        className="flex items-center gap-3 p-2 rounded hover:bg-slate-700/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user._id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                            }
                          }}
                          className="rounded border-slate-600 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className={`${avatarColor} w-8 h-8 rounded-full flex items-center justify-center text-white text-xs`}>
                          {user.avatar ? (
                            <img src={user.avatar} alt={username} className="rounded-full w-full h-full object-cover" />
                          ) : (
                            getInitials(username)
                          )}
                        </div>
                        <div>
                          <div className="text-white text-sm">{username}</div>
                          <div className="text-slate-400 text-xs">{member.role}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-4">
              <button 
                onClick={() => setShowAssign(false)} 
                className="px-3 py-1.5 rounded bg-slate-700 text-slate-300 text-sm hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={assignLoading}
                className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-70 flex items-center gap-1"
              >
                {assignLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Assigning...
                  </>
                ) : (
                  'Save Assignments'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskListItem;