import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../../Context/ProjectContext';
import { 
  FiEdit2, 
  FiTrash2, 
  FiMessageCircle, 
  FiCopy, 
  FiClipboard 
} from 'react-icons/fi';

const TaskMenu = ({ task, projectId, onClose }) => {
  const navigate = useNavigate();
  const { deleteTask } = useProject();
  
  // Position the menu correctly
  const menuRef = React.useRef(null);
  
  React.useEffect(() => {
    function adjustPosition() {
      if (!menuRef.current) return;
      
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // If menu overflows on the right
      if (menuRect.right > viewportWidth) {
        menuRef.current.style.right = '0';
        menuRef.current.style.left = 'auto';
      }
      
      // If menu overflows at the bottom
      if (menuRect.bottom > viewportHeight) {
        menuRef.current.style.bottom = '0';
        menuRef.current.style.top = 'auto';
      }
    }
    
    adjustPosition();
    window.addEventListener('resize', adjustPosition);
    return () => window.removeEventListener('resize', adjustPosition);
  }, []);
  
  // Handle task edit
  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/projects/${projectId}/tasks/${task._id}/edit`);
    onClose();
  };
  
  // Handle task delete
  const handleDelete = async (e) => {
    e.stopPropagation();
    
    if (window.confirm(`Are you sure you want to delete "${task.title}"? This will also delete all its subtasks.`)) {
      try {
        await deleteTask(projectId, task._id);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
    
    onClose();
  };
  
  // Handle task duplication
  const handleDuplicate = (e) => {
    e.stopPropagation();
    navigate(`/projects/${projectId}/tasks/duplicate/${task._id}`);
    onClose();
  };
  
  // Handle comments
  const handleComments = (e) => {
    e.stopPropagation();
    // Open comment modal (implementation will be added later)
    // For now, we'll just navigate to the task detail page
    navigate(`/projects/${projectId}/tasks/${task._id}`);
    onClose();
  };
  
  // Copy task link to clipboard
  const handleCopyLink = (e) => {
    e.stopPropagation();
    
    const taskUrl = `${window.location.origin}/projects/${projectId}/tasks/${task._id}`;
    navigator.clipboard.writeText(taskUrl)
      .then(() => {
        alert('Task link copied to clipboard');
        onClose();
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        onClose();
      });
  };
  
  return (
    <div 
      ref={menuRef} 
      className="absolute right-0 top-full mt-1 z-10 bg-white shadow-lg rounded-md border border-gray-200 py-1 min-w-[160px]"
      onClick={(e) => e.stopPropagation()}
    >
      <button 
        onClick={handleEdit}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
      >
        <FiEdit2 className="mr-2" size={14} /> 
        Edit Task
      </button>
      
      <button 
        onClick={handleComments}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
      >
        <FiMessageCircle className="mr-2" size={14} /> 
        Comments
      </button>
      
      <button 
        onClick={handleDuplicate}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
      >
        <FiCopy className="mr-2" size={14} /> 
        Duplicate
      </button>
      
      <button 
        onClick={handleCopyLink}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
      >
        <FiClipboard className="mr-2" size={14} /> 
        Copy Link
      </button>
      
      <hr className="my-1 border-gray-200" />
      
      <button 
        onClick={handleDelete}
        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
      >
        <FiTrash2 className="mr-2" size={14} /> 
        Delete Task
      </button>
    </div>
  );
};

export default TaskMenu;