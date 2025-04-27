import axios from "axios";

// Project endpoints
export const fetchProjects = async () => {
  try {
    const response = await axios.get('/api/projects');
    return response.data;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

export const fetchProjectById = async (projectId) => {
  try {
    const response = await axios.get(`/api/projects/${projectId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching project ${projectId}:`, error);
    throw error;
  }
};

export const fetchProjectDashboard = async (projectId) => {
  try {
    const response = await axios.get(`/api/projects/${projectId}/dashboard`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching project dashboard ${projectId}:`, error);
    throw error;
  }
};

export const createProject = async (projectData) => {
  try {
    const response = await axios.post('/api/projects', projectData);
    return response.data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

export const updateProject = async (projectId, projectData) => {
  try {
    const response = await axios.patch(`/api/projects/${projectId}`, projectData);
    return response.data;
  } catch (error) {
    console.error(`Error updating project ${projectId}:`, error);
    throw error;
  }
};

export const deleteProject = async (projectId) => {
  try {
    const response = await axios.delete(`/api/projects/${projectId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting project ${projectId}:`, error);
    throw error;
  }
};

// Project members management
export const addProjectMember = async (projectId, memberData) => {
  try {
    const response = await axios.post(`/api/projects/${projectId}/members`, memberData);
    return response.data;
  } catch (error) {
    console.error(`Error adding member to project ${projectId}:`, error);
    throw error;
  }
};

export const removeProjectMember = async (projectId, memberId) => {
  try {
    const response = await axios.delete(`/api/projects/${projectId}/members/${memberId}`);
    return response.data;
  } catch (error) {
    console.error(`Error removing member ${memberId} from project ${projectId}:`, error);
    throw error;
  }
};

export const updateMemberRole = async (projectId, memberId, roleData) => {
  try {
    const response = await axios.patch(`/api/projects/${projectId}/members/${memberId}`, roleData);
    return response.data;
  } catch (error) {
    console.error(`Error updating role for member ${memberId} in project ${projectId}:`, error);
    throw error;
  }
};

// Task endpoints
export const fetchTasks = async (projectId) => {
  try {
    const response = await axios.get(`/api/tasks/projects/${projectId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching tasks for project ${projectId}:`, error);
    throw error;
  }
};

export const fetchTaskById = async (taskId) => {
  try {
    const response = await axios.get(`/api/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching task ${taskId}:`, error);
    throw error;
  }
};

export const createTask = async (projectId, taskData) => {
  try {
    const response = await axios.post(`/api/tasks/projects/${projectId}`, taskData);
    return response.data;
  } catch (error) {
    console.error(`Error creating task in project ${projectId}:`, error);
    throw error;
  }
};

export const updateTask = async (taskId, taskData) => {
  try {
    const response = await axios.patch(`/api/tasks/${taskId}`, taskData);
    return response.data;
  } catch (error) {
    console.error(`Error updating task ${taskId}:`, error);
    throw error;
  }
};

export const deleteTask = async (taskId) => {
  try {
    const response = await axios.delete(`/api/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting task ${taskId}:`, error);
    throw error;
  }
};

export const assignTask = async (taskId, userIds) => {
  try {
    const response = await axios.post(`/api/tasks/${taskId}/assign`, { userIds });
    return response.data;
  } catch (error) {
    console.error(`Error assigning users to task ${taskId}:`, error);
    throw error;
  }
};

export const addComment = async (taskId, commentData) => {
  try {
    const response = await axios.post(`/api/tasks/${taskId}/comments`, commentData);
    return response.data;
  } catch (error) {
    console.error(`Error adding comment to task ${taskId}:`, error);
    throw error;
  }
};

// AI task generation
export const generateTasksWithAI = async (projectId, description) => {
  try {
    const response = await axios.post(`/api/ai/generate-tasks`, { 
      projectTitle: '',
      description
    });
    return response.data;
  } catch (error) {
    console.error('Error generating tasks with AI:', error);
    throw error;
  }
};