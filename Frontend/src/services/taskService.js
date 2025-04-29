import axios from '../Config/Axios';

// Create a new task for a project
export const createTask = async (projectId, taskData) => {
  try {
    const response = await axios.post(`/api/projects/${projectId}/tasks`, taskData);
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error.response?.data || error.message;
  }
};

// Create a subtask under a parent task
export const createSubtask = async (taskId, subtaskData) => {
  try {
    const response = await axios.post(`/api/tasks/${taskId}/subtasks`, subtaskData);
    return response.data;
  } catch (error) {
    console.error('Error creating subtask:', error);
    throw error.response?.data || error.message;
  }
};

// Get all tasks for a project
export const getTasksByProject = async (projectId) => {
  try {
    const response = await axios.get(`/api/projects/${projectId}/tasks`);
    return response.data;
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    throw error.response?.data || error.message;
  }
};

// Get task by ID
export const fetchTaskById = async (taskId) => {
  try {
    const response = await axios.get(`/api/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching task details:', error);
    throw error.response?.data || error.message;
  }
};

// Update task details
export const updateTask = async (taskId, taskData) => {
  try {
    const response = await axios.put(`/api/tasks/${taskId}`, taskData);
    return response.data;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error.response?.data || error.message;
  }
};

// Update task status
export const updateTaskStatus = async (taskId, status) => {
  try {
    const response = await axios.patch(`/api/tasks/${taskId}`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error.response?.data || error.message;
  }
};

// Delete a task
export const deleteTask = async (taskId) => {
  try {
    const response = await axios.delete(`/api/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error.response?.data || error.message;
  }
};

// Assign users to a task
export const assignUsersToTask = async (taskId, userIds) => {
  try {
    const response = await axios.post(`/api/tasks/${taskId}/assign`, { userIds });
    return response.data;
  } catch (error) {
    console.error('Error assigning users to task:', error);
    throw error.response?.data || error.message;
  }
};

// Add comment to a task
export const addTaskComment = async (taskId, comment) => {
  try {
    const response = await axios.post(`/api/tasks/${taskId}/comments`, comment);
    return response.data;
  } catch (error) {
    console.error('Error adding comment to task:', error);
    throw error.response?.data || error.message;
  }
};

// Get task health status
export const getTaskHealth = async (taskId) => {
  try {
    const response = await axios.get(`/api/tasks/${taskId}/health`);
    return response.data;
  } catch (error) {
    console.error('Error getting task health:', error);
    throw error.response?.data || error.message;
  }
};

// Clone a task
export const cloneTask = async (taskId, options) => {
  try {
    const response = await axios.post(`/api/tasks/${taskId}/clone`, { options });
    return response.data;
  } catch (error) {
    console.error('Error cloning task:', error);
    throw error.response?.data || error.message;
  }
};

// Add dependency between tasks
export const addTaskDependency = async (taskId, dependencyId, dependencyType) => {
  try {
    const response = await axios.post(`/api/tasks/${taskId}/dependencies/${dependencyId}`, { type: dependencyType });
    return response.data;
  } catch (error) {
    console.error('Error adding task dependency:', error);
    throw error.response?.data || error.message;
  }
};

// Remove dependency between tasks
export const removeTaskDependency = async (taskId, dependencyId) => {
  try {
    const response = await axios.delete(`/api/tasks/${taskId}/dependencies/${dependencyId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing task dependency:', error);
    throw error.response?.data || error.message;
  }
};

// Generate tasks using AI
export const generateTasksWithAI = async (projectId, description) => {
  try {
    const response = await axios.post(`/api/projects/${projectId}/generate-tasks`, { description });
    return response.data;
  } catch (error) {
    console.error('Error generating tasks with AI:', error);
    throw error.response?.data || error.message;
  }
};

// Save AI-generated tasks
export const saveGeneratedTasks = async (projectId, tasks) => {
  try {
    const response = await axios.post(`/api/projects/${projectId}/save-generated-tasks`, { tasks });
    return response.data;
  } catch (error) {
    console.error('Error saving generated tasks:', error);
    throw error.response?.data || error.message;
  }
};

export default {
  createTask,
  createSubtask,
  getTasksByProject,
  fetchTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  assignUsersToTask,
  addTaskComment,
  getTaskHealth,
  cloneTask,
  addTaskDependency,
  removeTaskDependency,
  generateTasksWithAI,
  saveGeneratedTasks
};