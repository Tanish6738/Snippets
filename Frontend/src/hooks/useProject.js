// useProject custom hook
import { useState, useEffect } from 'react';
import { fetchProjects, fetchProjectById } from '../services/projectService';

export const useProject = (projectId, refresh = 0) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId || typeof projectId !== 'string' || projectId === 'undefined' || projectId === '') return;
    setLoading(true);
    fetchProjectById(projectId)
      .then(res => setProject(res.project))
      .catch(setError)
      .finally(() => setLoading(false));
  }, [projectId, refresh]);

  return { project, loading, error };
};

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchProjects()
      .then(setProjects)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { projects, loading, error };
};