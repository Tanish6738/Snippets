import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import taskService from '../../services/taskService';
import TaskList from '../../components/Task/TaskList';
import TaskForm from '../../components/Task/TaskForm';

const ProjectTasks = () => {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [editError, setEditError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    setLoading(true);
    taskService.getTasksByProject(projectId)
      .then(res => setTasks(res.tasks || res.data?.tasks || []))
      .catch(err => setError(err.message || 'Failed to load tasks'))
      .finally(() => setLoading(false));
  }, [projectId, refresh]);

  const handleEditTask = (task) => setEditingTask(task);
  const handleEditSubmit = async (data) => {
    try {
      await taskService.updateTask(editingTask._id, data);
      setEditingTask(null);
      setRefresh(r => r + 1);
    } catch (err) {
      setEditError(err.message || 'Failed to update task');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link to={`/projects/${projectId}`} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-sm font-medium">Back to Project</Link>
        <Link to={`/projects/${projectId}/tasks/new`} className="ml-auto px-3 py-1.5 rounded-lg bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-600 transition-all">+ Add Task</Link>
      </div>
      <h2 className="text-2xl font-bold mb-4">All Tasks</h2>
      {editingTask && (
        <div className="mb-4 bg-slate-100 p-4 rounded">
          <TaskForm initialValues={editingTask} onSubmit={handleEditSubmit} />
          {editError && <div className="text-red-600 text-xs mt-1">{editError}</div>}
          <button className="text-xs text-gray-500 mt-2" onClick={() => setEditingTask(null)}>Cancel</button>
        </div>
      )}
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <TaskList tasks={tasks} onEditTask={handleEditTask} onAddSubtask={() => setRefresh(r => r + 1)} projectId={projectId} />
      )}
    </div>
  );
};

export default ProjectTasks;
