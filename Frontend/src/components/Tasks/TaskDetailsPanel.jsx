import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiEdit2, 
  FiTrash2, 
  FiMessageCircle, 
  FiClock, 
  FiUser, 
  FiTag, 
  FiFlag, 
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiX
} from 'react-icons/fi';
import { format } from 'date-fns';
import TaskCommentModal from './TaskCommentModal';

const TaskDetailsPanel = ({ projectId, task, onClose, onDelete, members }) => {
  const navigate = useNavigate();
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  if (!task) return null;

  // Format task due date
  const formattedDueDate = task.dueDate 
    ? format(new Date(task.dueDate), 'MMM d, yyyy')
    : 'No due date';

  // Get assigned user name
  const assignedUser = task.assignedTo 
    ? members.find(member => member.user._id === task.assignedTo._id)?.user.username || 'Unknown User'
    : 'Unassigned';

  // Status color mapping
  const statusColorMap = {
    'Not Started': 'bg-gray-200 text-gray-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'On Hold': 'bg-yellow-100 text-yellow-800',
    'Completed': 'bg-green-100 text-green-800'
  };

  // Priority color mapping
  const priorityColorMap = {
    'Low': 'bg-gray-100 text-gray-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'High': 'bg-orange-100 text-orange-800',
    'Urgent': 'bg-red-100 text-red-800'
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      onDelete(task._id);
    }
  };

  const handleEdit = () => {
    navigate(`/projects/${projectId}/tasks/edit/${task._id}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{task.title}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${statusColorMap[task.status] || 'bg-gray-200'}`}>
                {task.status}
              </span>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${priorityColorMap[task.priority] || 'bg-gray-200'}`}>
                {task.priority} Priority
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* Description */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">Description</h4>
            <div className="bg-gray-50 rounded-md p-4 text-gray-700">
              {task.description || <span className="text-gray-400 italic">No description provided</span>}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Due Date */}
            <div className="flex items-center">
              <div className="bg-gray-100 p-2 rounded-md">
                <FiCalendar className="text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">Due Date</p>
                <p className="font-medium">{formattedDueDate}</p>
              </div>
            </div>

            {/* Assignee */}
            <div className="flex items-center">
              <div className="bg-gray-100 p-2 rounded-md">
                <FiUser className="text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">Assigned To</p>
                <p className="font-medium">{assignedUser}</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center">
              <div className="bg-gray-100 p-2 rounded-md">
                <FiCheckCircle className="text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">{task.status}</p>
              </div>
            </div>

            {/* Priority */}
            <div className="flex items-center">
              <div className="bg-gray-100 p-2 rounded-md">
                <FiFlag className="text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">Priority</p>
                <p className="font-medium">{task.priority}</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <FiTag className="text-gray-600 mr-2" />
                <h4 className="font-medium text-gray-700">Tags</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Created/Updated Info */}
          <div className="border-t border-gray-200 pt-4 mt-4 text-xs text-gray-500 flex flex-col gap-1">
            {task.createdAt && (
              <div className="flex items-center">
                <FiClock className="mr-1" />
                <span>Created {format(new Date(task.createdAt), 'MMM d, yyyy • h:mm a')}</span>
              </div>
            )}
            {task.updatedAt && task.updatedAt !== task.createdAt && (
              <div className="flex items-center">
                <FiClock className="mr-1" />
                <span>Last updated {format(new Date(task.updatedAt), 'MMM d, yyyy • h:mm a')}</span>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FiMessageCircle className="mr-2 text-gray-600" />
                <h4 className="font-medium text-gray-700">
                  Comments ({task.commentCount || 0})
                </h4>
              </div>
              <button
                onClick={() => setIsCommentModalOpen(true)}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View all comments
              </button>
            </div>
          </div>
        </div>

        {/* Footer with Actions */}
        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex justify-end">
          <div className="flex gap-3">
            <button 
              onClick={handleDelete}
              className="text-red-600 hover:text-red-800 font-medium flex items-center"
            >
              <FiTrash2 className="mr-1" />
              Delete
            </button>
            <button
              onClick={handleEdit}
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium rounded px-4 py-2 flex items-center"
            >
              <FiEdit2 className="mr-2" />
              Edit Task
            </button>
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      <TaskCommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        projectId={projectId}
        taskId={task._id}
      />
    </div>
  );
};

export default TaskDetailsPanel;