import axios from '../Config/Axios';
import { sendMessage, receiveMessage } from '../Config/Socket';

/**
 * TaskService - Handles all task-related API operations
 */
export default {
  /**
   * Create a new task in a project
   * @param {string} projectId - The ID of the project
   * @param {Object} taskData - Task data (title, description, etc.)
   * @returns {Promise}
   */
  createTask: async (projectId, taskData) => {
    try {
      return await axios.post(`/tasks/projects/${projectId}`, taskData);
    } catch (error) {
      console.error('Error creating task:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get all tasks for a project
   * @param {string} projectId
   * @returns {Promise}
   */
  getTasksByProject: async (projectId) => {
    try {
      return await axios.get(`/tasks/projects/${projectId}`);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get a single task by ID
   * @param {string} taskId
   * @returns {Promise}
   */
  getTaskById: async (taskId) => {
    try {
      return await axios.get(`/tasks/${taskId}`);
    } catch (error) {
      console.error('Error fetching task:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Update a task
   * @param {string} taskId
   * @param {Object} updateData
   * @returns {Promise}
   */
  updateTask: async (taskId, updateData) => {
    try {
      return await axios.patch(`/tasks/${taskId}`, updateData);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Delete a task
   * @param {string} taskId
   * @returns {Promise}
   */
  deleteTask: async (taskId) => {
    try {
      return await axios.delete(`/tasks/${taskId}`);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Assign task to user(s)
   * @param {string} taskId
   * @param {Array} userIds
   * @returns {Promise}
   */
  assignTask: async (taskId, userIds) => {
    try {
      return await axios.post(`/tasks/${taskId}/assign`, { userIds });
    } catch (error) {
      console.error('Error assigning task:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Add a comment to a task
   * @param {string} taskId
   * @param {Object} commentData { text, mentions }
   * @returns {Promise}
   */
  addTaskComment: async (taskId, commentData) => {
    try {
      return await axios.post(`/tasks/${taskId}/comments`, commentData);
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get all comments for a task
   * @param {string} taskId
   * @returns {Promise}
   */
  getTaskComments: async (taskId) => {
    try {
      return await axios.get(`/tasks/${taskId}/comments`);
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Delete a comment
   * @param {string} taskId
   * @param {string} commentId
   * @returns {Promise}
   */
  deleteComment: async (taskId, commentId) => {
    try {
      return await axios.delete(`/tasks/${taskId}/comments/${commentId}`);
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Add task dependency
   * @param {string} taskId
   * @param {string} dependencyId
   * @param {Object} data { type, delay }
   * @returns {Promise}
   */
  addTaskDependency: async (taskId, dependencyId, data = {}) => {
    try {
      return await axios.post(`/tasks/${taskId}/dependencies/${dependencyId}`, data);
    } catch (error) {
      console.error('Error adding dependency:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Remove task dependency
   * @param {string} taskId
   * @param {string} dependencyId
   * @returns {Promise}
   */
  removeTaskDependency: async (taskId, dependencyId) => {
    try {
      return await axios.delete(`/tasks/${taskId}/dependencies/${dependencyId}`);
    } catch (error) {
      console.error('Error removing dependency:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get task dependencies
   * @param {string} taskId
   * @returns {Promise}
   */
  getTaskDependencies: async (taskId) => {
    try {
      return await axios.get(`/tasks/${taskId}/dependencies`);
    } catch (error) {
      console.error('Error fetching dependencies:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Start time tracking
   * @param {string} taskId
   * @returns {Promise}
   */
  startTimeTracking: async (taskId) => {
    try {
      return await axios.post(`/tasks/${taskId}/time/start`);
    } catch (error) {
      console.error('Error starting time tracking:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Stop time tracking
   * @param {string} taskId
   * @param {string} notes
   * @returns {Promise}
   */
  stopTimeTracking: async (taskId, notes = '') => {
    try {
      return await axios.post(`/tasks/${taskId}/time/stop`, { notes });
    } catch (error) {
      console.error('Error stopping time tracking:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get time entries for a task
   * @param {string} taskId
   * @returns {Promise}
   */
  getTimeEntries: async (taskId) => {
    try {
      return await axios.get(`/tasks/${taskId}/time`);
    } catch (error) {
      console.error('Error fetching time entries:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Calculate health for a single task
   * @param {string} taskId
   * @returns {Promise}
   */
  calculateTaskHealth: async (taskId) => {
    try {
      return await axios.post(`/tasks/${taskId}/health`);
    } catch (error) {
      console.error('Error calculating task health:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Calculate health for all tasks in a project
   * @param {string} projectId
   * @returns {Promise}
   */
  calculateProjectTasksHealth: async (projectId) => {
    try {
      return await axios.post(`/tasks/projects/${projectId}/health`);
    } catch (error) {
      console.error('Error calculating project tasks health:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Generate tasks using AI
   * @param {string} projectId
   * @param {Object} data { description }
   * @returns {Promise}
   */
  generateTasksWithAI: async (projectId, data) => {
    try {
      return await axios.post(`/tasks/ai/generate/${projectId}`, data);
    } catch (error) {
      console.error('Error generating tasks with AI:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Save AI-generated tasks to project
   * @param {string} projectId
   * @param {Array} tasks
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
   * Create a recurring task
   * @param {string} projectId
   * @param {Object} data
   * @returns {Promise}
   */
  createRecurringTask: async (projectId, data) => {
    try {
      return await axios.post(`/tasks/recurring/projects/${projectId}`, data);
    } catch (error) {
      console.error('Error creating recurring task:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get all recurring tasks for a project
   * @param {string} projectId
   * @returns {Promise}
   */
  getRecurringTasks: async (projectId) => {
    try {
      return await axios.get(`/tasks/recurring/projects/${projectId}`);
    } catch (error) {
      console.error('Error fetching recurring tasks:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Update a recurring task
   * @param {string} taskId
   * @param {Object} data
   * @returns {Promise}
   */
  updateRecurringTask: async (taskId, data) => {
    try {
      return await axios.patch(`/tasks/recurring/${taskId}`, data);
    } catch (error) {
      console.error('Error updating recurring task:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Delete a recurring task
   * @param {string} taskId
   * @returns {Promise}
   */
  deleteRecurringTask: async (taskId) => {
    try {
      return await axios.delete(`/tasks/recurring/${taskId}`);
    } catch (error) {
      console.error('Error deleting recurring task:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Generate recurring task instances (admin only)
   * @param {number} days
   * @returns {Promise}
   */
  generateRecurringInstances: async (days = 30) => {
    try {
      return await axios.post(`/tasks/recurring/generate?days=${days}`);
    } catch (error) {
      console.error('Error generating recurring instances:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Clone a task
   * @param {string} taskId - The ID of the task to clone
   * @param {Object} options - Clone options
   * @returns {Promise} - API response with cloned task
   */
  cloneTask: async (taskId, options = {}) => {
    try {
      return await axios.post(`/tasks/${taskId}/clone`, options);
    } catch (error) {
      console.error('Error cloning task:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Add attachment to a task
   * @param {string} taskId - The ID of the task
   * @param {File} file - The file to attach
   * @returns {Promise} - API response
   */
  addTaskAttachment: async (taskId, file) => {
    try {
      const formData = new FormData();
      formData.append('attachment', file);
      
      return await axios.post(`/tasks/${taskId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      console.error('Error adding attachment:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get task attachments
   * @param {string} taskId - The ID of the task
   * @returns {Promise} - API response with attachments
   */
  getTaskAttachments: async (taskId) => {
    try {
      return await axios.get(`/tasks/${taskId}/attachments`);
    } catch (error) {
      console.error('Error fetching attachments:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Remove attachment from task
   * @param {string} taskId - The ID of the task
   * @param {string} attachmentId - The ID of the attachment
   * @returns {Promise} - API response
   */
  removeTaskAttachment: async (taskId, attachmentId) => {
    try {
      return await axios.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
    } catch (error) {
      console.error('Error removing attachment:', error);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Update tasks in bulk
   * @param {string} projectId - The ID of the project
   * @param {Array} taskUpdates - Array of {taskId, updates} objects
   * @returns {Promise} - API response
   */
  bulkUpdateTasks: async (projectId, taskUpdates) => {
    try {
      return await axios.patch(`/tasks/projects/${projectId}/bulk`, { updates: taskUpdates });
    } catch (error) {
      console.error('Error updating tasks in bulk:', error);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Change priority of multiple tasks at once
   * @param {string} projectId - The ID of the project
   * @param {Array} priorityUpdates - Array of {taskId, priority} objects
   * @returns {Promise} - API response
   */
  bulkUpdatePriorities: async (projectId, priorityUpdates) => {
    try {
      return await axios.patch(`/tasks/projects/${projectId}/priorities`, { updates: priorityUpdates });
    } catch (error) {
      console.error('Error updating priorities in bulk:', error);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Filter tasks by complex criteria
   * @param {string} projectId - The ID of the project
   * @param {Object} filters - Filter criteria (status, assignee, priority, date range, etc.)
   * @returns {Promise} - API response with filtered tasks
   */
  filterTasks: async (projectId, filters) => {
    try {
      return await axios.post(`/tasks/projects/${projectId}/filter`, filters);
    } catch (error) {
      console.error('Error filtering tasks:', error);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Get task history/audit trail
   * @param {string} taskId - The ID of the task
   * @returns {Promise} - API response with task history
   */
  getTaskHistory: async (taskId) => {
    try {
      return await axios.get(`/tasks/${taskId}/history`);
    } catch (error) {
      console.error('Error fetching task history:', error);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Create a subtask
   * @param {string} parentTaskId - The ID of the parent task
   * @param {Object} taskData - Task data (title, description, etc.)
   * @returns {Promise} - API response
   */
  createSubtask: async (parentTaskId, taskData) => {
    try {
      return await axios.post(`/tasks/${parentTaskId}/subtasks`, taskData);
    } catch (error) {
      console.error('Error creating subtask:', error);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Get all subtasks for a task
   * @param {string} taskId - The ID of the parent task
   * @returns {Promise} - API response with subtasks
   */
  getSubtasks: async (taskId) => {
    try {
      return await axios.get(`/tasks/${taskId}/subtasks`);
    } catch (error) {
      console.error('Error fetching subtasks:', error);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Set task completion percentage
   * @param {string} taskId - The ID of the task
   * @param {number} percentage - Completion percentage (0-100)
   * @returns {Promise} - API response
   */
  setCompletionPercentage: async (taskId, percentage) => {
    try {
      return await axios.post(`/tasks/${taskId}/completion`, { percentage });
    } catch (error) {
      console.error('Error setting completion percentage:', error);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Add a checklist to a task
   * @param {string} taskId - The ID of the task
   * @param {Object} checklistData - Checklist data (title, items)
   * @returns {Promise} - API response
   */
  addChecklist: async (taskId, checklistData) => {
    try {
      return await axios.post(`/tasks/${taskId}/checklists`, checklistData);
    } catch (error) {
      console.error('Error adding checklist:', error);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Update a checklist item
   * @param {string} taskId - The ID of the task
   * @param {string} checklistId - The ID of the checklist
   * @param {string} itemId - The ID of the checklist item
   * @param {Object} data - Update data (text, checked)
   * @returns {Promise} - API response
   */
  updateChecklistItem: async (taskId, checklistId, itemId, data) => {
    try {
      return await axios.patch(`/tasks/${taskId}/checklists/${checklistId}/items/${itemId}`, data);
    } catch (error) {
      console.error('Error updating checklist item:', error);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Get all checklists for a task
   * @param {string} taskId - The ID of the task
   * @returns {Promise} - API response with checklists
   */
  getChecklists: async (taskId) => {
    try {
      return await axios.get(`/tasks/${taskId}/checklists`);
    } catch (error) {
      console.error('Error fetching checklists:', error);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Subscribe to task updates via socket
   * @param {string} taskId - The ID of the task
   * @param {Function} callback - Callback function for updates
   */
  subscribeToTaskUpdates: (taskId, callback) => {
    receiveMessage(`task_update:${taskId}`, callback);
  },

  /**
   * Send task update via socket
   * @param {string} taskId - The ID of the task
   * @param {Object} data - Update data
   */
  sendTaskUpdate: (taskId, data) => {
    sendMessage(`task_update:${taskId}`, data);
  },
  
  /**
   * Log work for a task
   * @param {string} taskId - The ID of the task
   * @param {Object} workLog - Work log details (hours, description, date)
   * @returns {Promise} - API response
   */
  logWork: async (taskId, workLog) => {
    try {
      return await axios.post(`/tasks/${taskId}/worklog`, workLog);
    } catch (error) {
      console.error('Error logging work:', error);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Get work logs for a task
   * @param {string} taskId - The ID of the task
   * @returns {Promise} - API response with work logs
   */
  getWorkLogs: async (taskId) => {
    try {
      return await axios.get(`/tasks/${taskId}/worklog`);
    } catch (error) {
      console.error('Error fetching work logs:', error);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Delete a work log
   * @param {string} taskId - The ID of the task
   * @param {string} workLogId - The ID of the work log
   * @returns {Promise} - API response
   */
  deleteWorkLog: async (taskId, workLogId) => {
    try {
      return await axios.delete(`/tasks/${taskId}/worklog/${workLogId}`);
    } catch (error) {
      console.error('Error deleting work log:', error);
      throw error.response?.data || error;
    }
  },
};