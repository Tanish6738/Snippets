import axios from '../Config/Axios';

// Create a new project
export const createProject = async (projectData) => {
  try {
    const response = await axios.post('/api/projects', projectData);
    return response.data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error.response?.data || error.message;
  }
};

export const getUserProjects = async () => {
  try {
    const response = await axios.get('/api/projects');
    return response.data;
  } catch (error) {
    console.error('Error fetching user projects:', error);
    throw error.response?.data || error.message;
  }
};

export const fetchProjects = getUserProjects;

export const getPublicProjects = async () => {
  try {
    const response = await axios.get('/api/projects/public');
    return response.data;
  } catch (error) {
    console.error('Error fetching public projects:', error);
    throw error.response?.data || error.message;
  }
};

export const fetchProjectById = async (projectId) => {
  try {
    const response = await axios.get(`/api/projects/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching project details:', error);
    throw error.response?.data || error.message;
  }
};

export const updateProject = async (projectId, projectData) => {
  try {
    const response = await axios.put(`/api/projects/${projectId}`, projectData);
    return response.data;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error.response?.data || error.message;
  }
};

export const deleteProject = async (projectId) => {
  try {
    const response = await axios.delete(`/api/projects/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error.response?.data || error.message;
  }
};

export const getProjectDashboard = async (projectId) => {
  try {
    const response = await axios.get(`/api/projects/${projectId}/dashboard`);
    return response.data;
  } catch (error) {
    console.error('Error fetching project dashboard:', error);
    throw error.response?.data || error.message;
  }
};

export const addProjectMember = async (projectId, email, role = 'Contributor') => {
  try {
    const response = await axios.post(`/api/projects/${projectId}/members`, { email, role });
    return response.data;
  } catch (error) {
    console.error('Error adding project member:', error);
    throw error.response?.data || error.message;
  }
};

export const removeProjectMember = async (projectId, memberId) => {
  try {
    const response = await axios.delete(`/api/projects/${projectId}/members/${memberId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing project member:', error);
    throw error.response?.data || error.message;
  }
};

export const updateMemberRole = async (projectId, memberId, role) => {
  try {
    const response = await axios.put(`/api/projects/${projectId}/members/${memberId}`, { role });
    return response.data;
  } catch (error) {
    console.error('Error updating member role:', error);
    throw error.response?.data || error.message;
  }
};

export const getProjectTasks = async (projectId) => {
  try {
    const response = await axios.get(`/api/projects/${projectId}/tasks`);
    return response.data;
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    throw error.response?.data || error.message;
  }
};

export const fetchTaskById = async (taskId) => {
  try {
    const response = await axios.get(`/api/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching task details:', error);
    throw error.response?.data || error.message;
  }
};

export const generateProjectTasks = async (projectId, description) => {
  try {
    const response = await axios.post(`/api/projects/${projectId}/generate-tasks`, { description });
    return response.data;
  } catch (error) {
    console.error('Error generating tasks with AI:', error);
    throw error.response?.data || error.message;
  }
};

export const calculateProjectTasksHealth = async (projectId) => {
  try {
    const response = await axios.get(`/api/projects/${projectId}/tasks-health`);
    return response.data;
  } catch (error) {
    console.error('Error calculating task health:', error);
    throw error.response?.data || error.message;
  }
};

export const getProjectMembers = async (projectId) => {
  try {
    const response = await axios.get(`/api/projects/${projectId}/members`);
    return response.data;
  } catch (error) {
    console.error('Error fetching project members:', error);
    throw error.response?.data || error.message;
  }
};