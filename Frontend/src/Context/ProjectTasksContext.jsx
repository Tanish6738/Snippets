import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from '../Config/Axios';

const ProjectTasksContext = createContext();

export const useProjectTasks = () => useContext(ProjectTasksContext);

export const ProjectTasksProvider = ({ projectId, children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`/api/tasks/project/${projectId}`);
      setTasks(data.tasks || []); // Ensure we're handling the response structure correctly
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Fetch tasks when the component mounts or projectId changes
  useEffect(() => {
    fetchTasks();
  }, [projectId, fetchTasks]);

  return (
    <ProjectTasksContext.Provider value={{ tasks, setTasks, fetchTasks, loading, error }}>
      {children}
    </ProjectTasksContext.Provider>
  );
};
