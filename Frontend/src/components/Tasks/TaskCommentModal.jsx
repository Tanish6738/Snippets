import React, { useState, useEffect } from 'react';
import { FiX, FiSend, FiMessageCircle, FiTrash2 } from 'react-icons/fi';
import { useProject } from '../../Context/ProjectContext';
import { format } from 'date-fns';
import LoadingSpinner from '../Common/LoadingSpinner';

const TaskCommentModal = ({ isOpen, onClose, projectId, taskId }) => {
  const { getTask, addTaskComment, deleteTaskComment, loading } = useProject();
  
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState(null);
  
  // Fetch task data when modal is opened
  useEffect(() => {
    if (isOpen && taskId) {
      const fetchTask = async () => {
        try {
          const fetchedTask = await getTask(projectId, taskId);
          setTask(fetchedTask);
          setComments(fetchedTask.comments || []);
        } catch (err) {
          console.error('Error fetching task', err);
          setError('Could not load task comments. Please try again.');
        }
      };
      
      fetchTask();
    }
  }, [isOpen, taskId, projectId, getTask]);
  
  // Handle submitting a new comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      return;
    }
    
    try {
      const updatedTask = await addTaskComment(projectId, taskId, { text: newComment });
      setComments(updatedTask.comments || []);
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment', err);
      setError('Failed to add comment. Please try again.');
    }
  };
  
  // Handle deleting a comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    try {
      const updatedTask = await deleteTaskComment(projectId, taskId, commentId);
      setComments(updatedTask.comments || []);
    } catch (err) {
      console.error('Error deleting comment', err);
      setError('Failed to delete comment. Please try again.');
    }
  };
  
  // If modal is not open, don't render anything
  if (!isOpen) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FiMessageCircle className="mr-2" />
            {task ? `Comments: ${task.title}` : 'Task Comments'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <FiX size={24} />
          </button>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border-b border-red-200">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        {/* Comments List */}
        <div className="flex-grow overflow-y-auto p-4">
          {loading && !comments.length ? (
            <div className="flex justify-center items-center h-32">
              <LoadingSpinner />
            </div>
          ) : comments.length > 0 ? (
            <ul className="space-y-4">
              {comments.map(comment => (
                <li key={comment._id} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-2">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                        {comment.user?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{comment.user?.username || 'Unknown User'}</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(comment.createdAt), 'MMM d, yyyy • h:mm a')}
                          </span>
                        </div>
                        <p className="mt-1 text-gray-700">{comment.text}</p>
                      </div>
                    </div>
                    
                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="text-gray-400 hover:text-red-500"
                      title="Delete comment"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No comments yet.</p>
              <p className="text-sm mt-1">Be the first to leave a comment!</p>
            </div>
          )}
        </div>
        
        {/* New Comment Form */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSubmitComment} className="flex items-center gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-grow border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="Write a comment..."
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className={`px-4 py-2 rounded-lg flex items-center justify-center ${
                loading || !newComment.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {loading ? <LoadingSpinner size="sm" /> : <FiSend />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskCommentModal;