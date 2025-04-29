import axios from 'axios';
import { getAuthToken } from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Configure axios with auth header
const getAuthHeader = () => {
  const token = getAuthToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

const timeTrackingService = {
  // Get all time entries for a task
  getTimeEntries: async (taskId) => {
    return axios.get(`${API_BASE_URL}/tasks/${taskId}/time`, getAuthHeader());
  },

  // Start time tracking for a task
  startTimeTracking: async (taskId) => {
    return axios.post(`${API_BASE_URL}/tasks/${taskId}/time/start`, {}, getAuthHeader());
  },

  // Stop time tracking for a task
  stopTimeTracking: async (taskId, timeEntryId, data = {}) => {
    return axios.post(`${API_BASE_URL}/tasks/${taskId}/time/stop`, data, getAuthHeader());
  },

  // Update a time entry
  updateTimeEntry: async (taskId, timeEntryId, data) => {
    return axios.patch(
      `${API_BASE_URL}/tasks/${taskId}/time/${timeEntryId}`,
      data,
      getAuthHeader()
    );
  },

  // Delete a time entry
  deleteTimeEntry: async (taskId, timeEntryId) => {
    return axios.delete(
      `${API_BASE_URL}/tasks/${taskId}/time/${timeEntryId}`,
      getAuthHeader()
    );
  },

  // Get time reports for a project
  getProjectTimeReport: async (projectId, filters = {}) => {
    return axios.get(
      `${API_BASE_URL}/projects/${projectId}/time/report`,
      {
        ...getAuthHeader(),
        params: filters
      }
    );
  },

  // Get time reports for a user across all projects
  getUserTimeReport: async (userId, filters = {}) => {
    return axios.get(
      `${API_BASE_URL}/users/${userId}/time/report`,
      {
        ...getAuthHeader(),
        params: filters
      }
    );
  }
};

export default timeTrackingService;