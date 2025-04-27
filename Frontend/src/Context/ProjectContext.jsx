import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as projectService from '../services/projectService';
import {
  initializeSocket,
  sendMessage,
  receiveMessage,
  disconnectSocket,
  getSocket
} from '../Config/Socket';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const ProjectContext = createContext();

export const useProject = () => useContext(ProjectContext);

export const ProjectProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
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

  // Force refresh function
  const refreshData = () => setRefresh(prev => prev + 1);

  // Fetch user's projects
  useEffect(() => {
    const loadProjects = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const data = await projectService.fetchProjects();
        setProjects(data.projects);
      } catch (err) {
        console.error('Error loading projects:', err);
        setError(err.message || 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [currentUser, refresh]);

  // Load project by ID
  const loadProject = async (projectId) => {
    if (!projectId) return;
    try {
      setLoading(true);
      const data = await projectService.fetchProjectById(projectId);
      setCurrentProject(data.project);
      await loadTasks(projectId);
      setProjectMembers(data.project.members);
      await loadProjectDashboard(projectId);
      // Connect to project socket
      if (currentUser) {
        initializeSocket({ projectId, token: currentUser.token, namespace: '/projects' });
        setupSocketListeners();
      }
    } catch (err) {
      console.error(`Error loading project ${projectId}:`, err);
      setError(err.message || 'Failed to load project');
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  // Load project dashboard
  const loadProjectDashboard = async (projectId) => {
    try {
      const data = await projectService.fetchProjectDashboard(projectId);
      setProjectDashboard(data.dashboard);
    } catch (err) {
      console.error(`Error loading project dashboard ${projectId}:`, err);
    }
  };

  // Load tasks for a project
  const loadTasks = async (projectId) => {
    try {
      const data = await projectService.fetchTasks(projectId);
      setTasks(data.tasks || []);
    } catch (err) {
      console.error(`Error loading tasks for project ${projectId}:`, err);
      toast.error('Failed to load tasks');
    }
  };

  // Create new project
  const createNewProject = async (projectData) => {
    try {
      setLoading(true);
      const response = await projectService.createProject(projectData);
      setProjects([...projects, response.project]);
      toast.success('Project created successfully');
      navigate(`/projects/${response.project._id}`);
      return response.project;
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project');
      toast.error('Failed to create project');
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
      setProjects(projects.map(p => 
        p._id === projectId ? { ...p, ...response.project } : p
      ));
      
      // Update current project if it's the one being edited
      if (currentProject && currentProject._id === projectId) {
        setCurrentProject({ ...currentProject, ...response.project });
      }
      
      // Emit socket event for real-time updates
      sendMessage('projectUpdate', {
        projectId,
        updates: projectData
      });
      
      toast.success('Project updated successfully');
      return response.project;
    } catch (err) {
      console.error(`Error updating project ${projectId}:`, err);
      setError(err.message || 'Failed to update project');
      toast.error('Failed to update project');
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
      
      // Remove from projects list
      setProjects(projects.filter(p => p._id !== projectId));
      
      // Clear current project if it's the one being deleted
      if (currentProject && currentProject._id === projectId) {
        setCurrentProject(null);
        disconnectSocket();
      }
      
      toast.success('Project deleted successfully');
      navigate('/projects');
    } catch (err) {
      console.error(`Error deleting project ${projectId}:`, err);
      setError(err.message || 'Failed to delete project');
      toast.error('Failed to delete project');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Add member to project
  const addMember = async (projectId, memberData) => {
    try {
      setLoading(true);
      const response = await projectService.addProjectMember(projectId, memberData);
      
      // Update current project members
      if (currentProject && currentProject._id === projectId) {
        setProjectMembers([...projectMembers, response.member]);
      }
      
      // Emit socket event for real-time updates
      sendMessage('projectUpdate', {
        projectId,
        action: 'member_added',
        member: response.member
      });
      
      toast.success('Member added successfully');
      return response.member;
    } catch (err) {
      console.error(`Error adding member to project ${projectId}:`, err);
      setError(err.message || 'Failed to add member');
      toast.error(err.response?.data?.message || 'Failed to add member');
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
      
      // Update current project members
      if (currentProject && currentProject._id === projectId) {
        setProjectMembers(projectMembers.filter(m => m.user._id !== memberId));
      }
      
      // Emit socket event for real-time updates
      sendMessage('projectUpdate', {
        projectId,
        action: 'member_removed',
        memberId
      });
      
      toast.success('Member removed successfully');
    } catch (err) {
      console.error(`Error removing member ${memberId} from project ${projectId}:`, err);
      setError(err.message || 'Failed to remove member');
      toast.error('Failed to remove member');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update member role
  const updateMemberRole = async (projectId, memberId, role) => {
    try {
      setLoading(true);
      const response = await projectService.updateMemberRole(projectId, memberId, { role });
      
      // Update current project members
      if (currentProject && currentProject._id === projectId) {
        setProjectMembers(projectMembers.map(m => 
          m.user._id === memberId ? { ...m, role: response.member.role } : m
        ));
      }
      
      // Emit socket event for real-time updates
      sendMessage('projectUpdate', {
        projectId,
        action: 'role_updated',
        memberId,
        role
      });
      
      toast.success('Member role updated successfully');
    } catch (err) {
      console.error(`Error updating role for member ${memberId} in project ${projectId}:`, err);
      setError(err.message || 'Failed to update role');
      toast.error('Failed to update member role');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create task
  const createTask = async (projectId, taskData) => {
    try {
      setLoading(true);
      const response = await projectService.createTask(projectId, taskData);
      
      // Update tasks list
      if (!taskData.parentTaskId) {
        // Add as root level task
        setTasks([...tasks, response.task]);
      } else {
        // Add as subtask - we'll need to reload tasks to get the updated hierarchy
        await loadTasks(projectId);
      }
      
      // Emit socket event for real-time updates
      sendMessage('newTask', {
        projectId,
        task: response.task
      });
      
      toast.success('Task created successfully');
      return response.task;
    } catch (err) {
      console.error(`Error creating task in project ${projectId}:`, err);
      setError(err.message || 'Failed to create task');
      toast.error('Failed to create task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update task
  const updateTaskFunc = async (taskId, taskData) => {
    try {
      setLoading(true);
      const response = await projectService.updateTask(taskId, taskData);
      
      // Update tasks list - reload tasks to ensure hierarchy is correct
      if (currentProject) {
        await loadTasks(currentProject._id);
      }
      
      // Emit socket event for real-time updates
      sendMessage('taskUpdate', {
        taskId,
        updates: taskData
      });
      
      // If status was changed, emit a specific status change event
      if (taskData.status) {
        sendMessage('statusChange', {
          taskId,
          status: taskData.status
        });
      }
      
      toast.success('Task updated successfully');
      return response.task;
    } catch (err) {
      console.error(`Error updating task ${taskId}:`, err);
      setError(err.message || 'Failed to update task');
      toast.error('Failed to update task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete task
  const deleteTask = async (taskId) => {
    try {
      setLoading(true);
      await projectService.deleteTask(taskId);
      
      // Update tasks list - reload tasks to ensure hierarchy is correct
      if (currentProject) {
        await loadTasks(currentProject._id);
        await loadProjectDashboard(currentProject._id); // Also refresh dashboard
      }
      
      toast.success('Task deleted successfully');
    } catch (err) {
      console.error(`Error deleting task ${taskId}:`, err);
      setError(err.message || 'Failed to delete task');
      toast.error('Failed to delete task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Assign task to users
  const assignTask = async (taskId, userIds) => {
    try {
      setLoading(true);
      const response = await projectService.assignTask(taskId, userIds);
      
      // Update tasks list - reload tasks to update assignments
      if (currentProject) {
        await loadTasks(currentProject._id);
      }
      
      // Emit socket event for real-time updates
      sendMessage('taskAssigned', {
        taskId,
        userIds
      });
      
      toast.success('Task assigned successfully');
      return response.task;
    } catch (err) {
      console.error(`Error assigning users to task ${taskId}:`, err);
      setError(err.message || 'Failed to assign task');
      toast.error('Failed to assign task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Add comment to task
  const addComment = async (taskId, commentData) => {
    try {
      setLoading(true);
      const response = await projectService.addComment(taskId, commentData);
      
      // Emit socket event for real-time updates
      sendMessage('newComment', {
        taskId,
        comment: response.comment
      });
      
      toast.success('Comment added successfully');
      
      // Reload task data to include the new comment
      if (currentProject) {
        await loadTasks(currentProject._id);
      }
      
      return response.comment;
    } catch (err) {
      console.error(`Error adding comment to task ${taskId}:`, err);
      setError(err.message || 'Failed to add comment');
      toast.error('Failed to add comment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Generate tasks with AI
  const generateTasks = async (description) => {
    try {
      setLoading(true);
      const response = await projectService.generateTasksWithAI(
        currentProject?._id,
        description
      );
      
      setAiGeneratedTasks(response.tasks);
      toast.success('Tasks generated successfully');
      return response.tasks;
    } catch (err) {
      console.error('Error generating tasks with AI:', err);
      setError(err.message || 'Failed to generate tasks');
      toast.error('Failed to generate tasks');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Add AI-generated tasks to project
  const addGeneratedTasksToProject = async (projectId, tasks) => {
    try {
      setLoading(true);
      
      // Create tasks one by one, maintaining the hierarchy
      const rootTaskIds = [];
      
      // First create all root tasks
      for (const task of tasks) {
        const newTask = await projectService.createTask(projectId, {
          title: task.title,
          description: task.description,
          priority: task.priority,
          aiGenerated: true
        });
        
        rootTaskIds.push({ taskId: newTask.task._id, subtasks: task.subtasks });
      }
      
      // Then create subtasks for each root task
      for (const { taskId, subtasks } of rootTaskIds) {
        if (subtasks && subtasks.length > 0) {
          await createSubtasks(projectId, taskId, subtasks);
        }
      }
      
      // Clear generated tasks
      setAiGeneratedTasks(null);
      
      // Reload tasks
      await loadTasks(projectId);
      await loadProjectDashboard(projectId);
      
      toast.success('AI-generated tasks added to project');
    } catch (err) {
      console.error('Error adding generated tasks:', err);
      setError(err.message || 'Failed to add generated tasks');
      toast.error('Failed to add generated tasks');
    } finally {
      setLoading(false);
    }
  };

  // Recursive function to create subtasks
  const createSubtasks = async (projectId, parentTaskId, subtasks) => {
    for (const subtask of subtasks) {
      const newSubtask = await projectService.createTask(projectId, {
        title: subtask.title,
        description: subtask.description,
        priority: subtask.priority,
        parentTaskId,
        aiGenerated: true
      });
      
      if (subtask.subtasks && subtask.subtasks.length > 0) {
        await createSubtasks(projectId, newSubtask.task._id, subtask.subtasks);
      }
    }
  };

  // Set up socket listeners for real-time updates
  const setupSocketListeners = () => {
    receiveMessage('userJoined', (data) => {
      setActiveUsers(prev => [...prev, data.userId]);
      toast.info('A team member joined the project');
    });
    receiveMessage('userLeft', (data) => {
      setActiveUsers(prev => prev.filter(id => id !== data.userId));
      toast.info('A team member left the project');
    });
    receiveMessage('taskUpdate', (data) => {
      if (currentProject) {
        loadTasks(currentProject._id);
      }
      toast.info(`Task updated by a team member`);
    });
    receiveMessage('taskAssigned', (data) => {
      if (currentProject) {
        loadTasks(currentProject._id);
      }
      toast.info('Task assignment changed by a team member');
    });
    receiveMessage('newTask', (data) => {
      if (currentProject) {
        loadTasks(currentProject._id);
      }
      toast.info('New task added by a team member');
    });
    receiveMessage('statusChange', (data) => {
      if (currentProject) {
        loadTasks(currentProject._id);
        loadProjectDashboard(currentProject._id);
      }
      toast.info(`Task status changed to ${data.status}`);
    });
    receiveMessage('newComment', (data) => {
      if (currentProject) {
        loadTasks(currentProject._id);
      }
      toast.info('New comment added by a team member');
    });
    receiveMessage('projectUpdate', (data) => {
      if (currentProject && currentProject._id === data.projectId) {
        loadProject(currentProject._id);
      }
      refreshData();
      toast.info('Project updated by a team member');
    });
  };

  // Clean up socket connection when unmounting
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  // Values to provide to consumers
  const value = {
    projects,
    currentProject,
    tasks,
    projectMembers,
    loading,
    error,
    activeUsers,
    projectDashboard,
    aiGeneratedTasks,
    loadProject,
    createNewProject,
    updateProject,
    deleteProject,
    addMember,
    removeMember,
    updateMemberRole,
    createTask,
    updateTask: updateTaskFunc,
    deleteTask,
    assignTask,
    addComment,
    generateTasks,
    addGeneratedTasksToProject,
    refreshData
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export default ProjectContext;