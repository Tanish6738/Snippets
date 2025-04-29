import React, { useEffect, useState } from 'react';
import ProjectListItem from '../../components/Project/ProjectListItem';
import { FiFolderPlus } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { fetchProjects } from '../../services/projectService';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchProjects()
      .then(data => setProjects(data.projects || [])) // Fix: use only the projects array
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
  );
  if (error) return <div className="text-red-400 text-center py-8">Error loading projects: {error.message || error.toString()}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 pt-16">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Your Projects</h2>
            <p className="text-sm text-slate-400 mt-2">Manage and track your projects</p>
          </div>
          <Link to="/projects/new" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium hover:from-indigo-500 hover:to-indigo-700 transition-all border border-indigo-500/30">
            <FiFolderPlus /> New Project
          </Link>
        </div>
        {projects && projects.length > 0 ? (
          <div className="grid gap-6">
            {projects.map(project => (
              <ProjectListItem key={project._id} project={project} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center text-slate-400">
            <div className="mb-4 text-4xl">📁</div>
            <div className="mb-2 font-medium">No projects found.</div>
            <Link to="/projects/new" className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium hover:from-indigo-500 hover:to-indigo-700 transition-all border border-indigo-500/30">Create your first project</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;