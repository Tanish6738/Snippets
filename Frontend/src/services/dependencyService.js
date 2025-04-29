import axios from '../Config/Axios';

/**
 * DependencyService - Handles all dependency-related operations
 */
export default {
  /**
   * Add a dependency to a task
   * @param {string} taskId - The ID of the dependent task
   * @param {string} dependencyId - The ID of the task it depends on
   * @param {Object} data - Dependency data like type and delay
   * @returns {Promise}
   */
  addDependency: async (taskId, dependencyId, data = {}) => {
    try {
      return await axios.post(`/tasks/${taskId}/dependencies/${dependencyId}`, data);
    } catch (error) {
      console.error('Error adding dependency:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Remove a dependency from a task
   * @param {string} taskId - The ID of the dependent task
   * @param {string} dependencyId - The ID of the dependency to remove
   * @returns {Promise}
   */
  removeDependency: async (taskId, dependencyId) => {
    try {
      return await axios.delete(`/tasks/${taskId}/dependencies/${dependencyId}`);
    } catch (error) {
      console.error('Error removing dependency:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get all dependencies for a task
   * @param {string} taskId - The ID of the task
   * @returns {Promise}
   */
  getDependencies: async (taskId) => {
    try {
      return await axios.get(`/tasks/${taskId}/dependencies`);
    } catch (error) {
      console.error('Error fetching dependencies:', error);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Get all dependent tasks (tasks that depend on this task)
   * @param {string} taskId - The ID of the task
   * @returns {Promise}
   */
  getDependentTasks: async (taskId) => {
    try {
      return await axios.get(`/tasks/${taskId}/dependent-tasks`);
    } catch (error) {
      console.error('Error fetching dependent tasks:', error);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Check if adding a dependency would create a circular reference
   * @param {string} taskId - The ID of the dependent task
   * @param {string} dependencyId - The ID of the task it depends on
   * @returns {Promise}
   */
  checkCircularDependency: async (taskId, dependencyId) => {
    try {
      return await axios.get(`/tasks/${taskId}/check-circular/${dependencyId}`);
    } catch (error) {
      console.error('Error checking circular dependency:', error);
      throw error.response?.data || error;
    }
  }
};