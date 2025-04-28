import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as projectService from '../services/projectService';
import taskService from '../services/taskService';
import {
  initializeSocket,
  sendMessage,
  receiveMessage,
  disconnectSocket,
  getSocket
} from '../Config/Socket';
import { toast } from 'react-toastify';
import { useAuth } from './UserContext';
import { useNotification } from './NotificationContext';

const ProjectContext = createContext();

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

// Error Boundary for ProjectProvider
class ProjectErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    // Log error to a service
    console.error('ProjectProvider error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 border border-red-200 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-800 mb-3">Something went wrong in the Project Provider</h2>
          <p className="text-red-600 mb-4">We encountered an error while loading project data.</p>
          <pre className="bg-red-100 p-4 rounded text-red-800 text-sm overflow-auto max-h-60 mb-4">
            {this.state.error?.message || 'Unknown error'}
          </pre>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/projects';
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Return to Projects
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const ProjectProvider = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const { addNotification } = useNotification();
  const socketRef = useRef(null);
  
  // State
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [projectDashboard, setProjectDashboard] = useState(null);
  const [aiGeneratedTasks, setAiGeneratedTasks] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [socketConnected, setSocketConnected] = useState(false);
  const [taskFilters, setTaskFilters] = useState({
    status: 'all',
    assignee: 'all',
    priority: 'all',
    dueDate: 'all',
    search: ''
  });
  
  // Force refresh function
  const refreshData = useCallback(() => setRefresh(prev => prev + 1), []);
  
  // Socket management
  const setupSocketConnection = useCallback((projectId) => {
    if (!currentUser?.token) return;
    
    try {
      // Clean up previous connection if it exists
      if (socketRef.current) {
        disconnectSocket();
      }
      
      // Initialize new connection
      initializeSocket({ 
        projectId, 
        token: currentUser.token, 
        namespace: '/projects' 
      });
      
      socketRef.current = getSocket();
      
      // Event for connection status
      socketRef.current.on('connect', () => {
        setSocketConnected(true);
        console.log('Socket connected');
      });
      
      socketRef.current.on('disconnect', (reason) => {
        setSocketConnected(false);
        console.log('Socket disconnected:', reason);
        
        // Auto reconnect except if manually disconnected
        if (reason !== 'io client disconnect') {
          setTimeout(() => {
            setupSocketConnection(projectId);
          }, 5000);
        }
      });
      
      socketRef.current.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setSocketConnected(false);
      });
      
      setupSocketListeners();
      
    } catch (err) {
      console.error('Error setting up socket connection:', err);
      setSocketConnected(false);
    }
  }, [currentUser]);
  
  // Clean up socket on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        disconnectSocket();
        socketRef.current = null;
      }
    };
  }, []);
  
  // Fetch user's projects
  useEffect(() => {
    const loadProjects = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const response = await projectService.fetchProjects();
        setProjects(response.data.projects || []);
      } catch (err) {
        console.error('Error loading projects:', err);
        setError(err.message || 'Failed to load projects');
        
        // Show notification
        addNotification({
          type: 'error',
          message: 'Failed to load projects'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadProjects();
  }, [currentUser, refresh, addNotification]);
  
  // Load project by ID
  const loadProject = useCallback(async (projectId) => {
    if (!projectId || !currentUser) return;
    
    try {
      setLoading(true);
      
      // Reset states when loading a new project
      setCurrentProject(null);
      setTasks([]);
      setProjectMembers([]);
      setProjectDashboard(null);
      setActiveUsers([]);
      
      const response = await projectService.fetchProjectById(projectId);
      setCurrentProject(response.data.project);
      
      // Load associated data
      await loadTasks(projectId);
      await loadProjectMembers(projectId);
      await loadProjectDashboard(projectId);
      
      // Set up socket connection
      setupSocketConnection(projectId);
      
      return response.data.project;
    } catch (err) {
      console.error(`Error loading project ${projectId}:`, err);
      setError(err.message || 'Failed to load project');
      
      // Show notification
      addNotification({
        type: 'error',
        message: 'Failed to load project'
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, addNotification, setupSocketConnection]);
  
  // Load project dashboard data
  const loadProjectDashboard = async (projectId) => {
    try {
      const response = await projectService.fetchProjectDashboard(projectId);
      setProjectDashboard(response.data);
    } catch (err) {
      console.error(`Error loading project dashboard ${projectId}:`, err);
    }
  };
  
  // Load tasks for a project
  const loadTasks = async (projectId) => {
    try {
      const response = await taskService.getTasksByProject(projectId);
      setTasks(response.data.tasks || []);
      return response.data.tasks;
    } catch (err) {
      console.error(`Error loading tasks for project ${projectId}:`, err);
      addNotification({
        type: 'error',
        message: 'Failed to load tasks'
      });
      return [];
    }
  };
  
  // Load project members
  const loadProjectMembers = async (projectId) => {
    try {
      const response = await projectService.fetchProjectMembers(projectId);
      setProjectMembers(response.data.members || []);
      return response.data.members;
    } catch (err) {
      console.error(`Error loading members for project ${projectId}:`, err);
      return [];
    }
  };
  
  // Create a new project
  const createNewProject = async (projectData) => {
    try {
      setLoading(true);
      const response = await projectService.createProject(projectData);
      
      setProjects(prev => [...prev, response.data.project]);
      
      addNotification({
        type: 'success',
        message: 'Project created successfully'
      });
      
      return response.data.project;
    } catch (err) {
      setError(err.message || 'Failed to create project');
      
      addNotification({
        type: 'error',
        message: err.message || 'Failed to create project'
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Update project
  const updateProject = async (projectId, projectData) => {
    try {
      setLoading(true);
      const response = await projectService.updateProject(projectId, projectData);
      
      // Update projects list
      setProjects(prev => 
        prev.map(p => p._id === projectId ? response.data.project : p)
      );
      
      // Update current project if it's the active one
      if (currentProject && currentProject._id === projectId) {
        setCurrentProject(response.data.project);
      }
      
      // Broadcast update via socket
      if (socketConnected) {
        sendMessage('project_update', { projectId });
      }
      
      addNotification({
        type: 'success',
        message: 'Project updated successfully'
      });
      
      return response.data.project;
    } catch (err) {
      setError(err.message || 'Failed to update project');
      
      addNotification({
        type: 'error',
        message: err.message || 'Failed to update project'
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Delete project
  const deleteProject = async (projectId) => {
    try {
      setLoading(true);
      await projectService.deleteProject(projectId);
      
      // Update projects list
      setProjects(prev => prev.filter(p => p._id !== projectId));
      
      // If current project is deleted, reset data
      if (currentProject && currentProject._id === projectId) {
        setCurrentProject(null);
        setTasks([]);
        setProjectMembers([]);
        setProjectDashboard(null);
        
        // Clean up socket connection
        if (socketRef.current) {
          disconnectSocket();
          socketRef.current = null;
        }
      }
      
      addNotification({
        type: 'success',
        message: 'Project deleted successfully'
      });
      
      return { success: true, redirectTo: '/projects' };
    } catch (err) {
      setError(err.message || 'Failed to delete project');
      
      addNotification({
        type: 'error',
        message: err.message || 'Failed to delete project'
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Create task
  const createTask = async (projectId, taskData) => {
    try {
      setLoading(true);
      const response = await taskService.createTask(projectId, taskData);
      
      // Add task to state if not a subtask
      if (!taskData.parentTaskId) {
        setTasks(prev => [...prev, response.data.task]);
      } else {
        // If it's a subtask, reload all tasks to get the correct hierarchy
        await loadTasks(projectId);
      }
      
      // Update dashboard data
      await loadProjectDashboard(projectId);
      
      // Broadcast update via socket
      if (socketConnected) {
        sendMessage('new_task', {
          projectId,
          task: response.data.task
        });
      }
      
      addNotification({
        type: 'success',
        message: 'Task created successfully'
      });
      
      return response.data.task;
    } catch (err) {
      setError(err.message || 'Failed to create task');
      
      addNotification({
        type: 'error',
        message: err.message || 'Failed to create task'
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Update task
  const updateTask = async (taskId, taskData) => {
    try {
      setLoading(true);
      const response = await taskService.updateTask(taskId, taskData);
      
      if (currentProject) {
        // Reload tasks to get updated structure
        await loadTasks(currentProject._id);
        
        // Update dashboard if status changed
        if (taskData.status) {
          await loadProjectDashboard(currentProject._id);
        }
      }
      
      // Broadcast update via socket
      if (socketConnected) {
        sendMessage('task_update', {
          taskId,
          updates: taskData
        });
        
        // Send special event for status changes
        if (taskData.status) {
          sendMessage('status_change', {
            taskId,
            status: taskData.status
          });
        }
      }
      
      addNotification({
        type: 'success',
        message: 'Task updated successfully'
      });
      
      return response.data.task;
    } catch (err) {
      setError(err.message || 'Failed to update task');
      
      addNotification({
        type: 'error',
        message: err.message || 'Failed to update task'
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Delete task
  const deleteTask = async (taskId) => {
    try {
      setLoading(true);
      await taskService.deleteTask(taskId);
      
      if (currentProject) {
        // Reload tasks to refresh the list
        await loadTasks(currentProject._id);
        await loadProjectDashboard(currentProject._id);
      }
      
      // Broadcast update via socket
      if (socketConnected) {
        sendMessage('task_deleted', { taskId });
      }
      
      addNotification({
        type: 'success',
        message: 'Task deleted successfully'
      });
      
      return true;
    } catch (err) {
      setError(err.message || 'Failed to delete task');
      
      addNotification({
        type: 'error',
        message: err.message || 'Failed to delete task'
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Assign task to users
  const assignTask = async (taskId, userIds) => {
    try {
      setLoading(true);
      const response = await taskService.assignTask(taskId, userIds);
      
      if (currentProject) {
        await loadTasks(currentProject._id);
      }
      
      // Broadcast update via socket
      if (socketConnected) {
        sendMessage('task_assigned', {
          taskId,
          userIds
        });
      }
      
      addNotification({
        type: 'success',
        message: 'Task assigned successfully'
      });
      
      return response.data.task;
    } catch (err) {
      setError(err.message || 'Failed to assign task');
      
      addNotification({
        type: 'error',
        message: err.message || 'Failed to assign task'
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Add comment to task
  const addComment = async (taskId, commentData) => {
    try {
      setLoading(true);
      const response = await taskService.addTaskComment(taskId, commentData);
      
      if (currentProject) {
        await loadTasks(currentProject._id);
      }
      
      // Broadcast update via socket
      if (socketConnected) {
        sendMessage('new_comment', {
          taskId,
          comment: response.data.comment
        });
      }
      
      addNotification({
        type: 'success',
        message: 'Comment added successfully'
      });
      
      return response.data.comment;
    } catch (err) {
      setError(err.message || 'Failed to add comment');
      
      addNotification({
        type: 'error',
        message: err.message || 'Failed to add comment'
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Generate tasks with AI
  const generateTasks = async (description) => {
    try {
      setLoading(true);
      
      if (!currentProject?._id) {
        throw new Error('No project selected');
      }
      
      const response = await taskService.generateTasksWithAI(currentProject._id, { description });
      setAiGeneratedTasks(response.data.tasks);
      
      addNotification({
        type: 'success',
        message: 'Tasks generated successfully'
      });
      
      return response.data.tasks;
    } catch (err) {
      setError(err.message || 'Failed to generate tasks');
      
      addNotification({
        type: 'error',
        message: err.message || 'Failed to generate tasks'
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Add AI-generated tasks to project
  const addGeneratedTasksToProject = async (projectId, tasks) => {
    try {
      setLoading(true);
      await taskService.saveGeneratedTasks(projectId, tasks);
      setAiGeneratedTasks(null);
      
      // Refresh data
      await loadTasks(projectId);
      await loadProjectDashboard(projectId);
      
      // Broadcast update via socket
      if (socketConnected) {
        sendMessage('tasks_added', { projectId });
      }
      
      addNotification({
        type: 'success',
        message: 'Tasks added to project successfully'
      });
      
      return true;
    } catch (err) {
      setError(err.message || 'Failed to add generated tasks');
      
      addNotification({
        type: 'error',
        message: err.message || 'Failed to add generated tasks'
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Add member to project
  const addMember = async (projectId, { email, role }) => {
    try {
      setLoading(true);
      await projectService.addProjectMember(projectId, email, role);
      
      // Refresh members
      await loadProjectMembers(projectId);
      
      // Broadcast update via socket
      if (socketConnected) {
        sendMessage('member_added', { projectId, email });
      }
      
      addNotification({
        type: 'success',
        message: 'Member added successfully'
      });
      
      return true;
    } catch (err) {
      setError(err.message || 'Failed to add member');
      
      addNotification({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to add member'
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Remove member from project
  const removeMember = async (projectId, memberId) => {
    try {
      setLoading(true);
      await projectService.removeProjectMember(projectId, memberId);
      
      // Refresh members
      await loadProjectMembers(projectId);
      
      // Broadcast update via socket
      if (socketConnected) {
        sendMessage('member_removed', { projectId, memberId });
      }
      
      addNotification({
        type: 'success',
        message: 'Member removed successfully'
      });
      
      return true;
    } catch (err) {
      setError(err.message || 'Failed to remove member');
      
      addNotification({
        type: 'error',
        message: err.message || 'Failed to remove member'
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Update member role
  const updateMemberRole = async (projectId, memberId, role) => {
    try {
      setLoading(true);
      await projectService.updateMemberRole(projectId, memberId, role);
      
      // Refresh members
      await loadProjectMembers(projectId);
      
      // Broadcast update via socket
      if (socketConnected) {
        sendMessage('member_role_updated', { projectId, memberId, role });
      }
      
      addNotification({
        type: 'success',
        message: 'Member role updated successfully'
      });
      
      return true;
    } catch (err) {
      setError(err.message || 'Failed to update member role');
      
      addNotification({
        type: 'error',
        message: err.message || 'Failed to update member role'
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Filter tasks
  const filterTasks = async (filters) => {
    try {
      setTaskFilters(prev => ({ ...prev, ...filters }));
      
      if (!currentProject) return tasks;
      
      const response = await taskService.filterTasks(currentProject._id, filters);
      return response.data.tasks;
    } catch (err) {
      console.error('Error filtering tasks:', err);
      return tasks;
    }
  };
  
  // Set up socket listeners for real-time updates
  const setupSocketListeners = () => {
    // Track active users
    receiveMessage('user_joined', (data) => {
      setActiveUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
      
      addNotification({
        type: 'info',
        message: 'A team member joined the project'
      });
    });
    
    receiveMessage('user_left', (data) => {
      setActiveUsers(prev => prev.filter(id => id !== data.userId));
      
      addNotification({
        type: 'info',
        message: 'A team member left the project'
      });
    });
    
    // Task updates
    receiveMessage('task_update', async (data) => {
      if (currentProject) {
        await loadTasks(currentProject._id);
      }
      
      addNotification({
        type: 'info',
        message: `Task updated by a team member`
      });
    });
    
    receiveMessage('task_assigned', async (data) => {
      if (currentProject) {
        await loadTasks(currentProject._id);
      }
      
      addNotification({
        type: 'info',
        message: 'Task assignment changed by a team member'
      });
    });
    
    receiveMessage('new_task', async (data) => {
      if (currentProject) {
        await loadTasks(currentProject._id);
        await loadProjectDashboard(currentProject._id);
      }
      
      addNotification({
        type: 'info',
        message: 'New task added by a team member'
      });
    });
    
    receiveMessage('task_deleted', async (data) => {
      if (currentProject) {
        await loadTasks(currentProject._id);
        await loadProjectDashboard(currentProject._id);
      }
      
      addNotification({
        type: 'info',
        message: 'A task was deleted by a team member'
      });
    });
    
    receiveMessage('status_change', async (data) => {
      if (currentProject) {
        await loadTasks(currentProject._id);
        await loadProjectDashboard(currentProject._id);
      }
      
      addNotification({
        type: 'info',
        message: `Task status changed to ${data.status}`
      });
    });
    
    receiveMessage('new_comment', async (data) => {
      if (currentProject) {
        await loadTasks(currentProject._id);
      }
      
      addNotification({
        type: 'info',
        message: 'New comment added by a team member'
      });
    });
    
    // Project updates
    receiveMessage('project_update', async (data) => {
      if (currentProject && currentProject._id === data.projectId) {
        await loadProject(currentProject._id);
      }
      
      // Refresh projects list
      refreshData();
      
      addNotification({
        type: 'info',
        message: 'Project updated by a team member'
      });
    });
    
    // Member updates
    receiveMessage('member_added', async (data) => {
      if (currentProject && currentProject._id === data.projectId) {
        await loadProjectMembers(currentProject._id);
      }
      
      addNotification({
        type: 'info',
        message: 'New member added to the project'
      });
    });
    
    receiveMessage('member_removed', async (data) => {
      if (currentProject && currentProject._id === data.projectId) {
        await loadProjectMembers(currentProject._id);
      }
      
      addNotification({
        type: 'info',
        message: 'A member was removed from the project'
      });
    });
    
    receiveMessage('member_role_updated', async (data) => {
      if (currentProject && currentProject._id === data.projectId) {
        await loadProjectMembers(currentProject._id);
      }
      
      addNotification({
        type: 'info',
        message: 'A member role was updated'
      });
    });
  };
  
  // Values to provide to consumers
  const contextValue = {
    // Data
    projects,
    currentProject,
    tasks,
    projectMembers,
    loading,
    error,
    activeUsers,
    projectDashboard,
    aiGeneratedTasks,
    socketConnected,
    taskFilters,
    
    // Actions
    loadProject,
    createNewProject,
    updateProject,
    deleteProject,
    addMember,
    removeMember,
    updateMemberRole,
    createTask,
    updateTask,
    deleteTask,
    assignTask,
    addComment,
    generateTasks,
    addGeneratedTasksToProject,
    refreshData,
    filterTasks,
    setTaskFilters,
    
    // Getter methods
    getProjects: async () => {
      try {
        const response = await projectService.fetchProjects();
        return response.data.projects || [];
      } catch (err) {
        console.error('Error fetching projects:', err);
        return [];
      }
    },
    
    getProject: async (projectId) => {
      try {
        const response = await projectService.fetchProjectById(projectId);
        return response.data.project;
      } catch (err) {
        console.error(`Error fetching project ${projectId}:`, err);
        return null;
      }
    },
    
    getProjectMembers: async (projectId) => {
      try {
        const response = await projectService.fetchProjectMembers(projectId);
        return response.data.members || [];
      } catch (err) {
        console.error(`Error fetching members for project ${projectId}:`, err);
        return [];
      }
    },
    
    // Analytics and reporting
    getTaskMetrics: async (projectId) => {
      try {
        // This function doesn't exist in projectService, using fetchProjectDashboard instead
        const response = await projectService.fetchProjectDashboard(projectId);
        return response.data;
      } catch (err) {
        console.error(`Error fetching task metrics for project ${projectId}:`, err);
        return null;
      }
    },
    
    getTaskStatusDistribution: async (projectId) => {
      try {
        // This function doesn't exist in projectService, using fetchProjectDashboard instead
        const response = await projectService.fetchProjectDashboard(projectId);
        return response.data;
      } catch (err) {
        console.error(`Error fetching task status distribution for project ${projectId}:`, err);
        return null;
      }
    },
    
    getTaskCompletionTrend: async (projectId, timeRange) => {
      try {
        // This function doesn't exist in projectService, using fetchProjectDashboard instead
        const response = await projectService.fetchProjectDashboard(projectId);
        return response.data;
      } catch (err) {
        console.error(`Error fetching task completion trend for project ${projectId}:`, err);
        return null;
      }
    }
  };
  
  // Prevent rendering if AuthContext is not ready
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="p-6 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-slate-600 font-medium">Loading authentication...</p>
        </div>
      </div>
    );
  }
  
  return (
    <ProjectErrorBoundary>
      <ProjectContext.Provider value={contextValue}>
        {children}
      </ProjectContext.Provider>
    </ProjectErrorBoundary>
  );
};

export default ProjectContext;