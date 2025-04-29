import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../../services/projectService';
import ProjectForm from '../../components/Project/ProjectForm';

const ProjectCreate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    try {
      const project = await createProject(values);
      navigate(`/projects/${project._id}`);
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 pt-16 flex items-center justify-center">
      <div className="w-full max-w-xl mx-auto px-4 py-10 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-slate-700/30 shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          Create New Project
        </h2>
        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>}
        <ProjectForm initialValues={{}} onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
};

export default ProjectCreate;