import React, { useEffect, useState } from 'react';
import taskService from '../../services/taskService';

/**
 * TaskTimeline - Displays tasks on a timeline/calendar
 * Props:
 *   projectId: string (required)
 */
const TaskTimeline = ({ projectId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    taskService.getTasksByProject(projectId)
      .then(res => setTasks(res.data || []))
      .catch(() => setError('Failed to load tasks'))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (!projectId) return <div>No project selected.</div>;
  if (loading) return <div>Loading timeline...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="p-4 bg-white rounded shadow mt-4">
      <h2 className="text-lg font-bold mb-2">Task Timeline</h2>
      <ul>
        {tasks.map(task => (
          <li key={task._id}>
            {task.title} - Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
          </li>
        ))}
      </ul>
      {/* Replace with a real timeline/calendar visualization as needed */}
    </div>
  );
};

export default TaskTimeline;
