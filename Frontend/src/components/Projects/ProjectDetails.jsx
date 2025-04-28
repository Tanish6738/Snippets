import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProject } from '../../Context/ProjectContext';
import { useAuth } from '../../Context/UserContext';
import { 
  FiEdit2, 
  FiTrash2, 
  FiPlus, 
  FiUsers, 
  FiUserPlus, 
  FiClock,
  FiAlertCircle,
  FiArrowLeft
} from 'react-icons/fi';
import { GiBrain } from "react-icons/gi";
import TaskList from '../Tasks/TaskList';
import ProjectDashboard from './ProjectDashboard';
import ProjectMembers from './ProjectMembers';
import AiTaskGenerator from '../Tasks/AiTaskGenerator';
import LoadingSpinner from '../Common/LoadingSpinner';
import { format } from 'date-fns';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    currentProject, 
    loadProject, 
    tasks, 
    deleteProject, 
    loading, 
    projectMembers,
    error 
  } = useProject();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  
  // Load project data
  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId, loadProject]);
  
  // Handle project deletion
  const handleDeleteProject = async () => {
    if (window.confirm('Are you sure you want to delete this project and all its tasks? This action cannot be undone.')) {
      try {
        await deleteProject(projectId);
        navigate('/projects');
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };
  
  // Check if user is project admin
  const isProjectAdmin = () => {
    if (!user || !projectMembers) return false;
    
    const currentMember = projectMembers.find(member => member.user._id === user._id);
    return currentMember?.role === 'Admin';
  };
  
  // Filter root level tasks (those without a parent)
  const rootTasks = tasks.filter(task => !task.parentTaskId);
  
  // If loading
  if (loading && !currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  // If error
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  // If project not found
  if (!currentProject) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAlertCircle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">Project not found</p>
            <p className="mt-2">
              <Link
                to="/projects"
                className="text-sm font-medium text-yellow-700 hover:text-yellow-600"
              >
                ← Back to Projects
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <div>
            <div className="flex items-center mb-1">
              <Link
                to="/projects"
                className="mr-2 text-gray-500 hover:text-gray-700"
              >
                <FiArrowLeft />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{currentProject.title}</h1>
            </div>
            
            <p className="text-gray-600">{currentProject.description}</p>
            
            <div className="flex items-center flex-wrap gap-2 mt-3">
              {currentProject.deadline && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <FiClock className="mr-1" /> 
                  Due: {format(new Date(currentProject.deadline), 'MMM d, yyyy')}
                </span>
              )}
              
              {currentProject.priority && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPriorityClasses(currentProject.priority)}`}>
                  Priority: {currentProject.priority}
                </span>
              )}
              
              {currentProject.tags && currentProject.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-2">
            {isProjectAdmin() && (
              <>
                <button
                  onClick={() => navigate(`/projects/${projectId}/edit`)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FiEdit2 className="mr-2 -ml-1" /> Edit
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                >
                  <FiTrash2 className="mr-2 -ml-1" /> Delete
                </button>
              </>
            )}
            <button
              onClick={() => navigate(`/projects/${projectId}/tasks/new`)}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <FiPlus className="mr-2 -ml-1" /> Add Task
            </button>
            <button
              onClick={() => setShowAiGenerator(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              <GiBrain className="mr-2 -ml-1" /> Generate Tasks
            </button>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px space-x-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-4 px-1 ${
              activeTab === 'dashboard'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } font-medium text-sm`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-4 px-1 ${
              activeTab === 'tasks'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } font-medium text-sm`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`py-4 px-1 ${
              activeTab === 'members'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } font-medium text-sm flex items-center`}
          >
            <FiUsers className="mr-2" /> Members
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div>
        {activeTab === 'dashboard' && <ProjectDashboard projectId={projectId} />}

        {activeTab === 'tasks' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate(`/projects/${projectId}/tasks/new`)}
                  className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <FiPlus className="mr-2 -ml-1" /> Add Task
                </button>
                <button
                  onClick={() => setShowAiGenerator(true)}
                  className="inline-flex items-center px-3 py-2 border border-purple-600 shadow-sm text-sm font-medium rounded-md text-purple-600 bg-white hover:bg-purple-50"
                >
                  <GiBrain className="mr-2 -ml-1" /> Generate Tasks
                </button>
              </div>
            </div>
            
            {rootTasks.length > 0 ? (
              <TaskList tasks={rootTasks} projectId={projectId} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg text-center px-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new task or generate with AI</p>
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => navigate(`/projects/${projectId}/tasks/new`)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <FiPlus className="mr-2 -ml-1" /> New Task
                  </button>
                  <button
                    onClick={() => setShowAiGenerator(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <GiBrain className="mr-2 -ml-1" /> Generate with AI
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'members' && (
          <ProjectMembers projectId={projectId} isAdmin={isProjectAdmin()} />
        )}
      </div>
      
      {/* AI Task Generator Modal */}
      {showAiGenerator && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="max-w-3xl w-full mx-auto">
            <AiTaskGenerator 
              projectId={projectId} 
              onClose={() => setShowAiGenerator(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function for priority classes
const getPriorityClasses = (priority) => {
  switch (priority) {
    case 'Low':
      return 'bg-green-100 text-green-800';
    case 'Medium':
      return 'bg-blue-100 text-blue-800';
    case 'High':
      return 'bg-orange-100 text-orange-800';
    case 'Urgent':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default ProjectDetails;