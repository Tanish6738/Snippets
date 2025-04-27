import React, { useState } from 'react';
import { FiSend, FiPlus, FiEdit2, FiTrash2, FiCheck } from 'react-icons/fi';
import { useProject } from '../../Context/ProjectContext';
import LoadingSpinner from '../Common/LoadingSpinner';

const AiTaskGenerator = ({ projectId, onClose }) => {
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { generateTasks, aiGeneratedTasks, addGeneratedTasksToProject, loading } = useProject();
  
  // Handle generate tasks
  const handleGenerateTasks = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;
    
    try {
      setSubmitted(true);
      await generateTasks(description.trim());
    } catch (error) {
      console.error('Error generating tasks:', error);
    }
  };
  
  // Handle add tasks to project
  const handleAddToProject = async () => {
    if (!aiGeneratedTasks) return;
    
    try {
      await addGeneratedTasksToProject(projectId, aiGeneratedTasks);
      onClose();
    } catch (error) {
      console.error('Error adding tasks to project:', error);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Generate Tasks with AI
      </h2>
      
      {!submitted || loading ? (
        <form onSubmit={handleGenerateTasks} className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Describe your project or feature in detail
            </label>
            <textarea
              id="description"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="Describe what you want to build, and the AI will suggest tasks..."
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              The more details you provide, the better the AI can generate relevant tasks.
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !description.trim()}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex items-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Generating...</span>
                </>
              ) : (
                <>
                  <FiSend className="mr-2" />
                  Generate Tasks
                </>
              )}
            </button>
          </div>
        </form>
      ) : aiGeneratedTasks && aiGeneratedTasks.length > 0 ? (
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            The AI has generated the following tasks based on your description. You can edit them before adding to your project.
          </p>
          
          <div className="max-h-[400px] overflow-y-auto">
            <TaskTree tasks={aiGeneratedTasks} level={0} />
          </div>
          
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Go Back
            </button>
            <button
              type="button"
              onClick={handleAddToProject}
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex items-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Adding...</span>
                </>
              ) : (
                <>
                  <FiPlus className="mr-2" />
                  Add to Project
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No tasks were generated. Please try again with a more detailed description.</p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

// Task tree preview component
const TaskTree = ({ tasks, level = 0 }) => {
  return (
    <div className={level > 0 ? "ml-6" : ""}>
      {tasks.map((task, index) => (
        <TaskItem key={index} task={task} level={level} index={index} />
      ))}
    </div>
  );
};

// Task item preview component
const TaskItem = ({ task, level, index }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  
  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="mb-2">
      <div className="p-3 border border-gray-200 rounded-md bg-white hover:bg-gray-50">
        <div className="flex items-center">
          {hasSubtasks && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 mr-2 p-1 rounded-full hover:bg-gray-200"
            >
              {isExpanded ? (
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          )}
          
          <div className="flex-grow">
            <div className="flex items-center">
              <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
              
              {task.priority && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getPriorityClass(task.priority)}`}>
                  {task.priority}
                </span>
              )}
              
              {task.estimatedHours && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">
                  {task.estimatedHours}h
                </span>
              )}
            </div>
            
            {task.description && (
              <p className="mt-1 text-xs text-gray-500">
                {task.description.length > 100 
                  ? `${task.description.substring(0, 100)}...` 
                  : task.description}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {isExpanded && hasSubtasks && (
        <TaskTree tasks={task.subtasks} level={level + 1} />
      )}
    </div>
  );
};

export default AiTaskGenerator;