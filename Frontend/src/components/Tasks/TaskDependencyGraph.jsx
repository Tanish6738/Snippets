import React, { useEffect, useState } from 'react';
import taskService from '../../services/taskService';

/**
 * TaskDependencyGraph - Visualizes dependencies between tasks in a project
 * Props:
 *   projectId: string (required)
 */
const TaskDependencyGraph = ({ projectId }) => {
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

  // Placeholder: Render a simple list of dependencies
  if (!projectId) return <div>No project selected.</div>;
  if (loading) return <div>Loading dependencies...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="p-4 bg-white rounded shadow mt-4">
      <h2 className="text-lg font-bold mb-2">Task Dependency Graph</h2>
      <ul>
        {tasks.map(task => (
          <li key={task._id}>
            {task.title} depends on: {(task.dependencies || []).join(', ') || 'None'}
          </li>
        ))}
      </ul>
      {/* Replace with a real graph visualization as needed */}
    </div>
  );
};

export default TaskDependencyGraph;
