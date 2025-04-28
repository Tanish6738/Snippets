import React, { useEffect, useState } from 'react';
import taskService from '../../services/taskService';

/**
 * TaskHealthDashboard - Visualizes the health of tasks in a project
 * Props:
 *   projectId: string (required)
 */
const TaskHealthDashboard = ({ projectId }) => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    // Placeholder: Replace with actual API call when backend endpoint is available
    taskService.getTasksByProject(projectId)
      .then(res => {
        // Example health calculation (replace with real logic or API response)
        const tasks = res.data || [];
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'completed').length;
        const overdue = tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length;
        setHealth({ total, completed, overdue });
      })
      .catch(err => setError('Failed to load task health'))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (!projectId) return <div>No project selected.</div>;
  if (loading) return <div>Loading task health...</div>;
  if (error) return <div>{error}</div>;
  if (!health) return null;

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-bold mb-2">Task Health Dashboard</h2>
      <ul>
        <li>Total Tasks: {health.total}</li>
        <li>Completed Tasks: {health.completed}</li>
        <li>Overdue Tasks: {health.overdue}</li>
      </ul>
    </div>
  );
};

export default TaskHealthDashboard;
