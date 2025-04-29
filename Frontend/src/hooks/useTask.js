// useTask custom hook
import { useState, useEffect } from 'react';
import { fetchTaskById, fetchTasks } from '../services/projectService';

export const useTask = (taskId) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    fetchTaskById(taskId)
      .then(setTask)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [taskId]);

  return { task, loading, error };
};

export const useTasks = (projectId) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    fetchTasks(projectId)
      .then(setTasks)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [projectId]);

  return { tasks, loading, error };
};