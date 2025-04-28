import React, { useEffect, useState } from 'react';
import taskService from '../../services/taskService';

/**
 * RecurringTaskManager - Manages recurring tasks for a project
 * Props:
 *   projectId: string (required)
 */
const RecurringTaskManager = ({ projectId }) => {
  const [recurringTasks, setRecurringTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    // Placeholder: Replace with real API call for recurring tasks
    taskService.getTasksByProject(projectId)
      .then(res => {
        const tasks = res.data || [];
        setRecurringTasks(tasks.filter(t => t.isRecurring));
      })
      .catch(() => setError('Failed to load recurring tasks'))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (!projectId) return <div>No project selected.</div>;
  if (loading) return <div>Loading recurring tasks...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="p-4 bg-white rounded shadow mt-4">
      <h2 className="text-lg font-bold mb-2">Recurring Task Manager</h2>
      <ul>
        {recurringTasks.length === 0 && <li>No recurring tasks found.</li>}
        {recurringTasks.map(task => (
          <li key={task._id}>{task.title} - Pattern: {task.recurrencePattern || 'N/A'}</li>
        ))}
      </ul>
      {/* Add UI for creating/editing recurring tasks as needed */}
    </div>
  );
};

export default RecurringTaskManager;
