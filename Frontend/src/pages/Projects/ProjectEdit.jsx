import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../../hooks/useProject';
import { updateProject } from '../../services/projectService';
import ProjectForm from '../../components/Project/ProjectForm';

const ProjectEdit = () => {
  const { projectId } = useParams();
  const { project, loading, error } = useProject(projectId);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await updateProject(projectId, values);
      navigate(`/projects/${projectId}`);
    } catch (err) {
      setSubmitError(err.message || 'Failed to update project');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
  );
  if (error) return <div className="text-red-400 text-center py-8">Error loading project: {error.message || error.toString()}</div>;
  if (!project) return <div className="text-slate-400 text-center py-8">Project not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 pt-16 flex items-center justify-center">
      <div className="w-full max-w-xl mx-auto px-4 py-10 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-slate-700/30 shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          Edit Project
        </h2>
        {submitError && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{submitError}</div>}
        <ProjectForm initialValues={project} onSubmit={handleSubmit} loading={submitting} />
      </div>
    </div>
  );
};

export default ProjectEdit;