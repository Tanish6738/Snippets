// Task Edit Page
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TaskForm from '../../components/Task/TaskForm';
import taskService from '../../services/taskService';
import { fetchProjectById } from '../../services/projectService';

const TaskEdit = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTaskAndProject = async () => {
      try {
        setLoading(true);
        const taskData = await taskService.getTaskById(taskId);
        const taskObj = taskData.task || taskData.data?.task || taskData;
        setTask(taskObj);
        
        // Fetch project using the projectId from the task
        if (taskObj.project) {
          const projectData = await fetchProjectById(taskObj.project);
          setProject(projectData);
        }
      } catch (err) {
        setError(err.message || 'Failed to load task');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskAndProject();
  }, [taskId]);

  const handleUpdate = async (data) => {
    try {
      await taskService.updateTask(taskId, data);
      navigate(-1);
    } catch (err) {
      setError(err.message || 'Failed to update task');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 pt-16 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 pt-16 p-4 flex justify-center">
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl">
          Task not found or you don't have permission to view it.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 pt-16 p-4">
      <div className="max-w-2xl mx-auto mt-6">
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-slate-700/30 rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold mb-6 pb-2 text-white border-b border-slate-700/50 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Edit Task
            {project && <span className="text-sm text-slate-400 font-normal ml-2">in {project.title}</span>}
          </h2>
          
          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>}
          
          <TaskForm 
            initialValues={task} 
            onSubmit={handleUpdate} 
            projectMembers={project?.members || []}
          />
        </div>
      </div>
    </div>
  );
};

export default TaskEdit;