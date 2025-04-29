import React from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight, FiEdit2, FiBarChart2, FiLayers, FiCheckCircle } from 'react-icons/fi';

const statusColors = {
  Planning: 'bg-blue-500/10 text-blue-400',
  'In Progress': 'bg-yellow-500/10 text-yellow-400',
  'On Hold': 'bg-orange-500/10 text-orange-400',
  Completed: 'bg-green-500/10 text-green-400',
  Cancelled: 'bg-red-500/10 text-red-400',
};

const ProjectListItem = ({ project }) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-800/80 border border-slate-700/40 shadow-lg hover:shadow-2xl hover:border-indigo-600/40 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-slate-800/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative p-7 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700/50 group-hover:border-indigo-600/60 transition-colors">
              <FiLayers className="text-indigo-300 group-hover:text-indigo-200" size={22} />
            </div>
            <div>
              <Link to={`/projects/${project._id}`} className="font-bold text-lg text-indigo-200 group-hover:text-indigo-100 transition-colors hover:underline">
                {project.title}
              </Link>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold tracking-wide ${statusColors[project.status] || 'bg-slate-700/30 text-slate-400'}`}>{project.status}</span>
                <span className="text-xs text-slate-400">{project.projectType}</span>
              </div>
            </div>
          </div>
          <Link to={`/projects/${project._id}/edit`} className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60 transition-all" title="Edit project">
            <FiEdit2 size={18} />
          </Link>
        </div>
        <div className="text-slate-400 text-sm line-clamp-2 min-h-[2.5em]">{project.description || <span className="italic text-slate-600">No description</span>}</div>
        <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5"><FiBarChart2 size={14} className="text-indigo-400" />{project.progress || 0}%</span>
            <span className="flex items-center gap-1.5"><FiCheckCircle size={14} className="text-green-400" />{project.status}</span>
          </div>
          <Link to={`/projects/${project._id}`} className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors font-semibold">
            View <FiChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProjectListItem;