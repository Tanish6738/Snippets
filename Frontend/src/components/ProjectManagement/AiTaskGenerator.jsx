import React, { useState, useEffect } from 'react';
import axios from '../../Config/Axios';
import { useNotification } from '../../Context/NotificationContext';
import { useProjectTasks } from '../../Context/ProjectTasksContext';

const renderTasks = (tasks, level = 0) => (
  <ul style={{ marginLeft: level * 20 }}>
    {tasks.map((task, idx) => (
      <li key={idx} style={{ marginBottom: 8 }}>
        <div>
          <strong>{task.title}</strong> <span style={{ color: '#888' }}>({task.status || 'To Do'})</span>
          <div style={{ fontSize: 13, color: '#666' }}>{task.description}</div>
          {task.dueDate && <div style={{ fontSize: 12, color: '#999' }}>Due: {task.dueDate}</div>}
          {task.priority && <div style={{ fontSize: 12, color: '#999' }}>Priority: {task.priority}</div>}
        </div>
        {task.subtasks && task.subtasks.length > 0 && renderTasks(task.subtasks, level + 1)}
      </li>
    ))}
  </ul>
);

const AiTaskGenerator = ({ isOpen, onClose, onApprove, projectId }) => {
  const [description, setDescription] = useState('');
  const [tasks, setTasks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const { addNotification } = useNotification();
  const { fetchTasks } = useProjectTasks() || {};

  useEffect(() => {
    if (!isOpen) {
      setDescription('');
      setTasks(null);
      setError('');
      setLoading(false);
      setSubmitLoading(false);
    }
  }, [isOpen, projectId]);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setTasks(null);
    try {
      const { data } = await axios.post('/api/ai/generate-tasks', { description });
      if (data.success) {
        setTasks(data.tasks);
      } else {
        setError('AI failed to generate tasks.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate tasks.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setSubmitLoading(true);
    if (!projectId) {
      addNotification('No project selected.', 'error');
      setSubmitLoading(false);
      return;
    }
    try {
      await axios.post('/api/tasks/bulk', { projectId, tasks });
      addNotification('Tasks added to project!', 'success');
      if (fetchTasks) fetchTasks();
      if (onApprove && typeof onApprove === 'function') {
        onApprove(tasks);
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      addNotification(err.response?.data?.error || 'Failed to add tasks to project.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative">
        <button onClick={onClose} className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        <h2 className="text-xl font-bold mb-4">AI Project Task Generator</h2>
        <textarea
          className="w-full border rounded p-2 mb-4"
          rows={4}
          placeholder="Describe your project goals, requirements, and scope..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          disabled={loading}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          onClick={handleGenerate}
          disabled={loading || !description.trim()}
        >
          {loading && <span className="loader border-t-2 border-b-2 border-white rounded-full w-4 h-4 animate-spin"></span>}
          {loading ? 'Generating...' : 'Generate Tasks'}
        </button>
        {error && <div className="text-red-500 mt-3">{error}</div>}
        {tasks && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Suggested Task Breakdown</h3>
            <div className="max-h-64 overflow-y-auto border rounded p-2 bg-gray-50">
              {renderTasks(tasks)}
            </div>
            <button
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              onClick={handleApprove}
              disabled={submitLoading}
            >
              {submitLoading && <span className="loader border-t-2 border-b-2 border-white rounded-full w-4 h-4 animate-spin"></span>}
              {submitLoading ? 'Adding...' : 'Approve & Add to Project'}
            </button>
          </div>
        )}
      </div>
      <style>{`.loader { border-width: 2px; border-style: solid; border-color: #fff transparent #fff transparent; }`}</style>
    </div>
  );
};

export default AiTaskGenerator;
