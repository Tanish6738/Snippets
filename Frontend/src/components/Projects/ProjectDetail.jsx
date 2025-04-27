import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProject } from '../../Context/ProjectContext';
import { useAuth } from '../../Context/AuthContext';
import { 
  FiUsers, FiClock, FiFlag, FiCalendar, FiTag, 
  FiEdit2, FiTrash2, FiPlus, FiChevronDown, FiSettings
} from 'react-icons/fi';
import LoadingSpinner from '../Common/LoadingSpinner';
import TaskList from '../Tasks/TaskList';
import ProjectDashboard from './ProjectDashboard';
import MembersPanel from './MembersPanel';
import TaskForm from '../Tasks/TaskForm';
import AiTaskGenerator from '../Tasks/AiTaskGenerator';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    currentProject, 
    tasks, 
    projectMembers, 
    loading, 
    loadProject, 
    updateProject, 
    deleteProject,
  } = useProject();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showActions, setShowActions] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: '',
    status: '',
    tags: []
  });

  // Load project data on component mount
  useEffect(() => {
    loadProject(id);
  }, [id]);

  // Update form data when project data is loaded
  useEffect(() => {
    if (currentProject) {
      setFormData({
        title: currentProject.title || '',
        description: currentProject.description || '',
        deadline: currentProject.deadline ? new Date(currentProject.deadline).toISOString().split('T')[0] : '',
        priority: currentProject.priority || 'Medium',
        status: currentProject.status || 'Planning',
        tags: currentProject.tags || []
      });
    }
  }, [currentProject]);

  if (loading || !currentProject) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Check if current user is project admin
  const isAdmin = currentProject.createdBy._id === user?._id || 
                  projectMembers.some(m => m.user._id === user?._id && m.role === 'Admin');

  // Format deadline date
  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-500';
      case 'Medium': return 'text-yellow-500';
      case 'Low': return 'text-blue-500';
      case 'Urgent': return 'text-red-700 font-bold';
      default: return 'text-gray-500';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Planning': return 'bg-purple-100 text-purple-800';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle form submission for editing project
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await updateProject(id, formData);
      setEditMode(false);
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  // Handle field changes in edit form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle project deletion
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await deleteProject(id);
        // navigate is called inside deleteProject
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <Link 
              to="/projects"
              className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
            >
              &larr; Back to Projects
            </Link>

            {!editMode ? (
              <h1 className="text-2xl font-bold text-gray-800">{currentProject.title}</h1>
            ) : (
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="text-2xl font-bold text-gray-800 border-b border-gray-300 focus:border-primary-500 focus:outline-none w-full"
              />
            )}
          </div>
          
          {isAdmin && !editMode && (
            <div className="relative">
              <button 
                className="bg-white border border-gray-300 rounded-lg p-2 hover:bg-gray-50"
                onClick={() => setShowActions(!showActions)}
              >
                <FiSettings className="text-gray-600" />
              </button>
              
              {showActions && (
                <div className="absolute right-0 z-10 mt-1 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <button
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      setEditMode(true);
                      setShowActions(false);
                    }}
                  >
                    <FiEdit2 className="mr-2" /> Edit Project
                  </button>
                  <button
                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    onClick={handleDelete}
                  >
                    <FiTrash2 className="mr-2" /> Delete Project
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-4 bg-white rounded-lg shadow-sm p-6">
          {!editMode ? (
            <div>
              <p className="text-gray-600 mb-4">
                {currentProject.description || 'No description provided.'}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <FiUsers className="mr-2" />
                    <span>{projectMembers?.length || 0} Team Members</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <FiClock className="mr-2" />
                    <span>Created {new Date(currentProject.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center text-sm mb-2">
                    <FiFlag className="mr-2 text-gray-500" />
                    <span className={`${getPriorityColor(currentProject.priority)}`}>
                      {currentProject.priority} Priority
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <FiCalendar className="mr-2" />
                    <span>Deadline: {formatDate(currentProject.deadline)}</span>
                  </div>
                  
                  <div className="flex items-center mb-2">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${getStatusColor(currentProject.status)}`}>
                      {currentProject.status}
                    </span>
                  </div>
                  
                  {currentProject.tags && currentProject.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {currentProject.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center"
                        >
                          <FiTag className="mr-1" size={10} /> {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm font-medium text-gray-700">{currentProject.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full" 
                    style={{ width: `${currentProject.progress || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                  placeholder="Project description"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    id="deadline"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                  />
                </div>
                
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
        
        {/* Team and action buttons */}
        <div className="flex flex-wrap justify-between items-center mt-6 gap-2">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 mr-2">Team:</span>
            <div className="flex -space-x-2">
              {projectMembers?.slice(0, 5).map((member, index) => (
                <img
                  key={index}
                  className="w-8 h-8 rounded-full border-2 border-white"
                  src={member.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user?.username || 'User')}&background=random`}
                  alt={member.user?.username}
                  title={member.user?.username}
                />
              ))}
              
              {projectMembers?.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white">
                  +{projectMembers.length - 5}
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowMembersPanel(true)}
              className="ml-2 text-sm text-primary-600 hover:text-primary-700 flex items-center"
            >
              Manage <FiChevronDown className="ml-1" size={14} />
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowAIModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg flex items-center px-4 py-2 text-sm"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              Generate Tasks with AI
            </button>
            
            <button
              onClick={() => setShowTaskModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg flex items-center px-4 py-2 text-sm"
            >
              <FiPlus className="mr-2" /> Add Task
            </button>
          </div>
        </div>
      </div>
      
      {/* Navigation tabs */}
      <div className="border-b border-gray-200 mb-6">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`inline-flex items-center py-4 px-4 text-sm font-medium text-center border-b-2 ${
                activeTab === 'dashboard'
                  ? 'text-primary-600 border-primary-600'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`inline-flex items-center py-4 px-4 text-sm font-medium text-center border-b-2 ${
                activeTab === 'tasks'
                  ? 'text-primary-600 border-primary-600'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              Tasks
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('team')}
              className={`inline-flex items-center py-4 px-4 text-sm font-medium text-center border-b-2 ${
                activeTab === 'team'
                  ? 'text-primary-600 border-primary-600'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              Team
            </button>
          </li>
        </ul>
      </div>
      
      {/* Tab content */}
      <div className="mb-6">
        {activeTab === 'dashboard' && <ProjectDashboard />}
        {activeTab === 'tasks' && <TaskList tasks={tasks} projectId={id} />}
        {activeTab === 'team' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Team Members</h2>
            <div className="space-y-4">
              {projectMembers?.map((member) => (
                <div key={member.user._id} className="flex justify-between items-center border-b pb-4">
                  <div className="flex items-center">
                    <img
                      src={member.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user?.username || 'User')}&background=random`}
                      alt={member.user?.username}
                      className="w-10 h-10 rounded-full mr-4"
                    />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{member.user?.username}</h3>
                      <p className="text-sm text-gray-500">{member.user?.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    member.role === 'Admin' 
                      ? 'bg-red-100 text-red-800' 
                      : member.role === 'Contributor' 
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowMembersPanel(true)}
              className="mt-4 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Manage Team Members
            </button>
          </div>
        )}
      </div>
      
      {/* Task Creation Modal */}
      {showTaskModal && (
        <TaskForm 
          projectId={id} 
          onClose={() => setShowTaskModal(false)} 
        />
      )}
      
      {/* Members Management Panel */}
      {showMembersPanel && (
        <MembersPanel
          projectId={id}
          members={projectMembers}
          onClose={() => setShowMembersPanel(false)}
        />
      )}
      
      {/* AI Task Generator Modal */}
      {showAIModal && (
        <AiTaskGenerator
          projectId={id}
          onClose={() => setShowAIModal(false)}
        />
      )}
    </div>
  );
};

export default ProjectDetail;