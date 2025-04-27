import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../../Context/ProjectContext';
import { 
  FiEdit2, FiTrash2, FiClock, FiCalendar, 
  FiTag, FiFlag, FiUser, FiMessageSquare,
  FiChevronLeft, FiCheckSquare
} from 'react-icons/fi';
import LoadingSpinner from '../Common/LoadingSpinner';
import CommentSection from '../Comments/CommentSection';
import ConfirmationModal from '../Common/ConfirmationModal';

const TaskDetail = () => {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const { getTask, deleteTask, completeTask, loading } = useProject();
  
  const [task, setTask] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Fetch task data
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const taskData = await getTask(projectId, taskId);
        setTask(taskData);
      } catch (error) {
        console.error('Error fetching task:', error);
      }
    };
    
    fetchTask();
  }, [projectId, taskId, getTask]);
  
  // Handle task completion
  const handleCompleteTask = async () => {
    try {
      await completeTask(projectId, taskId);
      // Update local state
      setTask({...task, status: 'Completed'});
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };
  
  // Handle task deletion
  const handleDeleteTask = async () => {
    try {
      await deleteTask(projectId, taskId);
      navigate(`/projects/${projectId}`);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };
  
  if (loading) {
    return <LoadingSpinner size="lg" />;
  }
  
  if (!task) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Task not found</h3>
        <p className="mt-2 text-sm text-gray-500">
          The task you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <FiChevronLeft className="mr-2" />
          Back to Project
        </button>
      </div>
    );
  }
  
  const priorityColors = {
    Low: 'bg-blue-100 text-blue-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    High: 'bg-orange-100 text-orange-800',
    Urgent: 'bg-red-100 text-red-800'
  };
  
  const statusColors = {
    'Not Started': 'bg-gray-100 text-gray-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'On Hold': 'bg-yellow-100 text-yellow-800',
    'Completed': 'bg-green-100 text-green-800'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(`/projects/${projectId}`)}
              className="mr-4 text-gray-500 hover:text-gray-700"
            >
              <FiChevronLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
          </div>
          
          <div className="flex items-center mt-4 md:mt-0 space-x-3">
            {task.status !== 'Completed' && (
              <button
                onClick={handleCompleteTask}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <FiCheckSquare className="mr-2" />
                Mark Complete
              </button>
            )}
            
            <button
              onClick={() => navigate(`/projects/${projectId}/tasks/${taskId}/edit`)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <FiEdit2 className="mr-2" />
              Edit
            </button>
            
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <FiTrash2 className="mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>
      
      {/* Task content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
            <div className="prose max-w-none">
              {task.description ? (
                <p className="text-gray-700">{task.description}</p>
              ) : (
                <p className="text-gray-500 italic">No description provided</p>
              )}
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Comments</h2>
            <CommentSection 
              projectId={projectId}
              taskId={taskId}
              comments={task.comments || []}
            />
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Task Details</h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-8 flex-shrink-0 text-gray-400">
                  <FiFlag />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status] || 'bg-gray-100 text-gray-800'}`}>
                    {task.status}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 flex-shrink-0 text-gray-400">
                  <FiFlag />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Priority</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority] || 'bg-gray-100 text-gray-800'}`}>
                    {task.priority}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 flex-shrink-0 text-gray-400">
                  <FiUser />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Assignee</p>
                  {task.assignedTo ? (
                    <p className="text-sm font-medium">{task.assignedTo.username}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Unassigned</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 flex-shrink-0 text-gray-400">
                  <FiCalendar />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  {task.dueDate ? (
                    <p className="text-sm font-medium">
                      {new Date(task.dueDate).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No due date</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 flex-shrink-0 text-gray-400">
                  <FiClock />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm font-medium">
                    {new Date(task.createdAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              {task.tags && task.tags.length > 0 && (
                <div className="flex items-start">
                  <div className="w-8 flex-shrink-0 text-gray-400 pt-1">
                    <FiTag />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {task.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteTask}
        onCancel={() => setShowDeleteModal(false)}
        confirmButtonType="danger"
      />
    </div>
  );
};

export default TaskDetail;