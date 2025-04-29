// useTimeTracking custom hook
import { useState, useEffect } from 'react';
import timeTrackingService from '../services/timeTrackingService';

export const useTimeTracking = (taskId) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    timeTrackingService.getTimeEntries(taskId)
      .then(res => setEntries(res.data || res))
      .catch(setError)
      .finally(() => setLoading(false));
  }, [taskId]);

  return { entries, loading, error };
};