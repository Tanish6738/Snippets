import axios from "axios";

// Project endpoints
export const fetchProjects = async () => {
  try {
    const response = await axios.get('/api/projects');
    console.log('[fetchProjects] Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[fetchProjects] Error:', error, error?.response?.data);
    throw error;
  }
};

export const fetchProjectById = async (projectId) => {
  try {
    const response = await axios.get(`/api/projects/${projectId}`);
    console.log(`[fetchProjectById] Project ${projectId} fetched successfully. Response:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[fetchProjectById] Error fetching project ${projectId}:`, error, error?.response?.data);
    throw error;
  }
};

export const fetchProjectDashboard = async (projectId) => {
  try {
    const response = await axios.get(`/api/projects/${projectId}/dashboard`);
    console.log(`[fetchProjectDashboard] Project ${projectId} dashboard response:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[fetchProjectDashboard] Error fetching dashboard for project ${projectId}:`, error, error?.response?.data);
    throw error;
  }
};

export const createProject = async (projectData) => {
  try {
    const response = await axios.post('/api/projects', projectData);
    console.log('[createProject] Project created. Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[createProject] Error creating project:', error, error?.response?.data);
    throw error;
  }
};

export const updateProject = async (projectId, projectData) => {
  try {
    const response = await axios.patch(`/api/projects/${projectId}`, projectData);
    console.log(`[updateProject] Project ${projectId} updated. Response:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[updateProject] Error updating project ${projectId}:`, error, error?.response?.data);
    throw error;
  }
};

export const deleteProject = async (projectId) => {
  try {
    const response = await axios.delete(`/api/projects/${projectId}`);
    console.log(`[deleteProject] Project ${projectId} deleted. Response:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[deleteProject] Error deleting project ${projectId}:`, error, error?.response?.data);
    throw error;
  }
};

// Project members management
export const addProjectMember = async (projectId, memberData) => {
  try {
    const response = await axios.post(`/api/projects/${projectId}/members`, memberData);
    console.log(`[addProjectMember] Member added to project ${projectId}. Response:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error adding member to project ${projectId}:`, error);
    throw error;
  }
};

export const removeProjectMember = async (projectId, memberId) => {
  try {
    const response = await axios.delete(`/api/projects/${projectId}/members/${memberId}`);
    console.log(`[removeProjectMember] Member ${memberId} removed from project ${projectId}. Response:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error removing member ${memberId} from project ${projectId}:`, error);
    throw error;
  }
};

export const updateMemberRole = async (projectId, memberId, roleData) => {
  try {
    const response = await axios.patch(`/api/projects/${projectId}/members/${memberId}`, roleData);
    console.log(`[updateMemberRole] Member ${memberId} role updated in project ${projectId}. Response:`, response.data);
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
    console.log(`[fetchTasks] Tasks for project ${projectId} fetched successfully. Response:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching tasks for project ${projectId}:`, error);
    throw error;
  }
};

export const fetchTaskById = async (taskId) => {
  try {
    const response = await axios.get(`/api/tasks/${taskId}`);
    console.log(`[fetchTaskById] Task ${taskId} fetched successfully. Response:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching task ${taskId}:`, error);
    throw error;
  }
};

export const createTask = async (projectId, taskData) => {
  try {
    const response = await axios.post(`/api/tasks/projects/${projectId}`, taskData);
    console.log(`[createTask] Task created in project ${projectId}. Response:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error creating task in project ${projectId}:`, error);
    throw error;
  }
};

export const updateTask = async (taskId, taskData) => {
  try {
    const response = await axios.patch(`/api/tasks/${taskId}`, taskData);
    console.log(`[updateTask] Task ${taskId} updated successfully. Response:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating task ${taskId}:`, error);
    throw error;
  }
};

export const deleteTask = async (taskId) => {
  try {
    const response = await axios.delete(`/api/tasks/${taskId}`);
    console.log(`[deleteTask] Task ${taskId} deleted successfully. Response:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error deleting task ${taskId}:`, error);
    throw error;
  }
};

export const assignTask = async (taskId, userIds) => {
  try {
    const response = await axios.post(`/api/tasks/${taskId}/assign`, { userIds });
    console.log(`[assignTask] Users assigned to task ${taskId}. Response:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error assigning users to task ${taskId}:`, error);
    throw error;
  }
};

export const addComment = async (taskId, commentData) => {
  try {
    const response = await axios.post(`/api/tasks/${taskId}/comments`, commentData);
    console.log(`[addComment] Comment added to task ${taskId}. Response:`, response.data);
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
    console.log(`[generateTasksWithAI] Tasks generated for project ${projectId}. Response:`, response.data);
    return response.data;
  } catch (error) {
    console.error('Error generating tasks with AI:', error);
    throw error;
  }
};