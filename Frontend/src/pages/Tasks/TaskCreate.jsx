// Task Create Page
import React, { useState, useEffect } from 'react';
import TaskForm from '../../components/Task/TaskForm';
import taskService from '../../services/taskService';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProjectById } from '../../services/projectService';

const TaskCreate = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch project data including members
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const projectData = await fetchProjectById(projectId);
        setProject(projectData);
      } catch (err) {
        setError('Failed to load project data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleCreate = async (data) => {
    try {
      await taskService.createTask(projectId, data);
      navigate(-1); // Go back after creation
    } catch (err) {
      setError(err.message || 'Failed to create task');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 pt-16 p-4">
      <div className="max-w-2xl mx-auto mt-6">
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-slate-700/30 rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold mb-6 pb-2 text-white border-b border-slate-700/50 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Create New Task
            {project && <span className="text-sm text-slate-400 font-normal ml-2">for {project.title}</span>}
          </h2>
          
          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>}
          
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <TaskForm 
              onSubmit={handleCreate} 
              projectMembers={project?.members || []}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCreate;