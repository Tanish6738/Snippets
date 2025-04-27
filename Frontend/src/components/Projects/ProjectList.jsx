import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '../../Context/ProjectContext';
import { FiPlus, FiSearch, FiFilter, FiClock, FiCalendar, FiFlag } from 'react-icons/fi';
import { GlassCard } from '../User/Home/Cards';
import LoadingSpinner from '../Common/LoadingSpinner';

const ProjectList = () => {
  const { projects, loading } = useProject();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority ? project.priority === filterPriority : true;
    const matchesStatus = filterStatus ? project.status === filterStatus : true;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-400';
      case 'Medium': return 'text-yellow-300';
      case 'Low': return 'text-blue-400';
      case 'Urgent': return 'text-red-600 font-bold';
      default: return 'text-slate-500';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-700/30 text-emerald-300';
      case 'In Progress': return 'bg-blue-700/30 text-blue-300';
      case 'Planning': return 'bg-purple-700/30 text-purple-300';
      case 'On Hold': return 'bg-yellow-700/30 text-yellow-300';
      case 'Cancelled': return 'bg-red-700/30 text-red-300';
      default: return 'bg-slate-700/30 text-slate-400';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-200">Projects</h1>
        <Link
          to="/projects/new"
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl flex items-center px-5 py-2.5 shadow-lg shadow-indigo-500/20 transition-all duration-150"
        >
          <FiPlus className="mr-2" /> New Project
        </Link>
      </div>

      <GlassCard>
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FiSearch className="text-slate-500" />
              </div>
              <input
                type="text"
                className="bg-slate-800/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg block w-full pl-10 p-2.5 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FiFilter className="text-slate-500" />
            <select
              className="bg-slate-800/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
            <select
              className="bg-slate-800/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Planning">Planning</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Project list */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {filteredProjects.map((project) => (
            <Link
              to={`/projects/${project._id}`}
              key={project._id}
              className="group bg-slate-900/60 rounded-2xl border border-slate-700/30 shadow-lg hover:shadow-xl hover:border-indigo-500/40 transition-all duration-200 overflow-hidden relative"
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold text-slate-200 mb-2 truncate group-hover:text-indigo-200 transition-colors">
                  {project.title}
                </h2>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                  {project.description || 'No description'}
                </p>
                <div className="flex items-center text-xs text-slate-500 mb-3 gap-2">
                  <FiClock className="mr-1" />
                  <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  <span className={`text-xs font-medium inline-flex items-center ${getPriorityColor(project.priority)}`}>
                    <FiFlag className="mr-1" /> {project.priority}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    {project.members?.slice(0, 3).map((member, index) => (
                      <img
                        key={index}
                        src={member.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user?.username || 'User')}&background=random`}
                        alt={member.user?.username || 'User'}
                        className="w-8 h-8 rounded-full border-2 border-slate-900"
                      />
                    ))}
                    {project.members?.length > 3 && (
                      <div className="w-8 h-8 rounded-full bg-slate-700/50 border-2 border-slate-900 flex items-center justify-center text-xs text-slate-300">
                        +{project.members.length - 3}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center text-xs gap-1">
                    <FiCalendar className={project.deadline ? 'text-slate-400' : 'text-slate-700'} />
                    <span className={project.deadline ? 'text-slate-400' : 'text-slate-700'}>
                      {formatDate(project.deadline)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-2 bg-slate-800 w-full">
                <div
                  className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500"
                  style={{ width: `${project.progress || 0}%` }}
                />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <GlassCard>
          <div className="p-12 text-center">
            <h3 className="text-xl font-medium text-slate-300 mb-2">No projects found</h3>
            <p className="text-slate-400 mb-6">
              {projects.length > 0
                ? 'Try adjusting your search or filters'
                : 'Create your first project to get started'}
            </p>
            {projects.length === 0 && (
              <Link
                to="/projects/new"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl inline-flex items-center px-5 py-2.5 shadow-lg shadow-indigo-500/20 transition-all duration-150"
              >
                <FiPlus className="mr-2" /> Create Project
              </Link>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default ProjectList;