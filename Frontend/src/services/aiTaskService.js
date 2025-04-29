import axios from '../Config/Axios';

/**
 * AITaskService - Handles all AI-powered task operations
 */
export default {
  /**
   * Generate tasks using AI based on project description
   * @param {string} projectId - The ID of the project
   * @param {Object} data - Project data with description, type, etc.
   * @returns {Promise}
   */
  generateTasks: async (projectId, data) => {
    try {
      return await axios.post(`/tasks/ai/generate/${projectId}`, data);
    } catch (error) {
      console.error('Error generating tasks with AI:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Save AI-generated tasks to the project
   * @param {string} projectId - The ID of the project
   * @param {Array} tasks - The generated tasks to save
   * @returns {Promise}
   */
  saveGeneratedTasks: async (projectId, tasks) => {
    try {
      return await axios.post(`/tasks/ai/save/${projectId}`, { tasks });
    } catch (error) {
      console.error('Error saving generated tasks:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get project health insights using AI analysis
   * @param {string} projectId - The ID of the project
   * @returns {Promise}
   */
  getProjectHealth: async (projectId, data) => {
    try {
      // Send the required data (e.g., tasks) in the POST body
      return await axios.post(`/api/ai/tasks/health/${projectId}`, data);
    } catch (error) {
      console.error('Error getting project health insights:', error);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Get AI recommendations for recurring tasks
   * @param {string} projectId - The ID of the project
   * @param {Object} data - Project data with type and existing tasks
   * @returns {Promise}
   */
  getRecurringTaskRecommendations: async (projectId, data) => {
    try {
      return await axios.post(`/ai/tasks/recurring/${projectId}`, data);
    } catch (error) {
      console.error('Error getting recurring task recommendations:', error);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Get AI suggestions for task priority optimization
   * @param {string} projectId - The ID of the project
   * @returns {Promise}
   */
  getTaskPriorityRecommendations: async (projectId) => {
    try {
      return await axios.post(`/ai/tasks/priorities/${projectId}`);
    } catch (error) {
      console.error('Error getting task priority recommendations:', error);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Get AI-suggested deadline adjustments
   * @param {string} projectId - The ID of the project
   * @returns {Promise}
   */
  getDeadlineRecommendations: async (projectId) => {
    try {
      return await axios.post(`/ai/tasks/deadlines/${projectId}`);
    } catch (error) {
      console.error('Error getting deadline recommendations:', error);
      throw error.response?.data || error;
    }
  }
};