import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProject } from '../../hooks/useProject';
import TaskList from '../../components/Task/TaskList';
import ProjectMembers from '../../components/Project/ProjectMembers';
import { FiEdit2, FiBarChart2, FiUsers, FiList, FiChevronLeft } from 'react-icons/fi';
import { useAuth } from '../../Context/UserContext';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const [refresh, setRefresh] = useState(0);
  const handleMemberAdded = () => setRefresh(r => r + 1);
  const { project, loading, error } = useProject(projectId, refresh);
  const { user } = useAuth();

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
  );
  if (error) return <div className="text-red-400 text-center py-8">Error loading project: {error.message || error.toString()}</div>;
  if (!project) return <div className="text-slate-400 text-center py-8">Project not found.</div>;

  // Use rootTasks if available, otherwise fallback to tasks
  const tasks = project.rootTasks || project.tasks || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 pt-16">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/projects" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-sm font-medium">
            <FiChevronLeft /> Back to Projects
          </Link>
          <Link to={`/projects/${projectId}/dashboard`} className="ml-auto px-3 py-1.5 rounded-lg bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-600 transition-all">Dashboard</Link>
        </div>
        <div className="mb-8 p-6 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-slate-700/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {project.title}
              <span className="ml-2 px-2 py-0.5 rounded-full bg-indigo-600/20 text-indigo-300 text-xs font-medium">{project.status}</span>
            </h2>
            <Link to={`/projects/${project._id}/edit`} className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60 transition-all" title="Edit project">
              <FiEdit2 size={18} />
            </Link>
          </div>
          <div className="text-slate-400 mb-2">{project.description || <span className="italic text-slate-600">No description</span>}</div>
          <div className="flex gap-6 text-xs text-slate-400 mt-2">
            <span className="flex items-center gap-1.5"><FiBarChart2 size={14} className="text-slate-500" />Progress: {project.progress || 0}%</span>
            <span className="flex items-center gap-1.5"><FiList size={14} className="text-slate-500" />Type: {project.projectType}</span>
            <span className="flex items-center gap-1.5"><FiList size={14} className="text-slate-500" />Priority: {project.priority}</span>
            {project.deadline && <span className="flex items-center gap-1.5"><FiList size={14} className="text-slate-500" />Deadline: {new Date(project.deadline).toLocaleDateString()}</span>}
          </div>
          <div className="flex gap-6 text-xs text-slate-400 mt-2">
            <span className="flex items-center gap-1.5"><FiList size={14} className="text-slate-500" />Visibility: {project.visibility}</span>
            <span className="flex items-center gap-1.5"><FiList size={14} className="text-slate-500" />Created: {new Date(project.createdAt).toLocaleDateString()}</span>
            <span className="flex items-center gap-1.5"><FiList size={14} className="text-slate-500" />Created By: {project.createdBy?.username || project.createdBy?.email}</span>
          </div>
        </div>
        <div className="mb-8 p-6 rounded-xl bg-slate-800/60 border border-slate-700/30 shadow">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-white"><FiUsers /> Members</h3>
          <ProjectMembers 
            members={project.members} 
            projectId={project._id} 
            onMemberAdded={handleMemberAdded}
            currentUserId={user?._id}
            projectCreatorId={project.createdBy?._id}
          />
        </div>
        <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/30 shadow">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-white"><FiList /> Tasks</h3>
          <TaskList tasks={tasks} />
          <div className="flex gap-4 mt-4">
            <Link to={`/projects/${project._id}/tasks/new`} className="inline-block text-indigo-400 hover:text-indigo-300 font-medium">+ Add Task</Link>
            <Link to={`/projects/${project._id}/edit`} className="inline-block text-slate-400 hover:text-indigo-400 font-medium">Edit Project</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;