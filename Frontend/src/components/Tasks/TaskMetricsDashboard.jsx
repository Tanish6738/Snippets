import React, { useEffect, useState } from 'react';
import taskService from '../../services/taskService';

/**
 * TaskMetricsDashboard - Shows analytics/metrics for tasks in a project
 * Props:
 *   projectId: string (required)
 */
const TaskMetricsDashboard = ({ projectId }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    // Placeholder: Replace with real API call for metrics
    taskService.getTasksByProject(projectId)
      .then(res => {
        const tasks = res.data || [];
        const byStatus = tasks.reduce((acc, t) => {
          acc[t.status] = (acc[t.status] || 0) + 1;
          return acc;
        }, {});
        setMetrics({ byStatus });
      })
      .catch(() => setError('Failed to load metrics'))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (!projectId) return <div>No project selected.</div>;
  if (loading) return <div>Loading metrics...</div>;
  if (error) return <div>{error}</div>;
  if (!metrics) return null;

  return (
    <div className="p-4 bg-white rounded shadow mt-4">
      <h2 className="text-lg font-bold mb-2">Task Metrics Dashboard</h2>
      <ul>
        {Object.entries(metrics.byStatus).map(([status, count]) => (
          <li key={status}>{status}: {count}</li>
        ))}
      </ul>
      {/* Extend with more analytics as needed */}
    </div>
  );
};

export default TaskMetricsDashboard;
