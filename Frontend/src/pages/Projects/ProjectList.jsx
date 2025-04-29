import React, { useEffect, useState } from 'react';
import ProjectListItem from '../../components/Project/ProjectListItem';
import { FiFolderPlus, FiFolder, FiAlertCircle, FiSearch } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { fetchProjects } from '../../services/projectService';
import { motion } from 'framer-motion';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchProjects()
      .then(data => setProjects(data.projects || [])) 
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, []);

  // Filter projects based on search query
  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[60vh]">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-indigo-500 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-t-4 border-b-4 border-sky-500 animate-spin"></div>
        </div>
      </div>
      <p className="mt-4 text-slate-400 font-medium animate-pulse">Loading Projects...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-[50vh] px-6">
      <div className="mb-4 p-3 rounded-full bg-red-500/20 w-16 h-16 flex items-center justify-center">
        <FiAlertCircle className="text-red-400 text-3xl animate-pulse" />
      </div>
      <h3 className="text-xl font-semibold text-slate-100 mb-2">Error Loading Projects</h3>
      <div className="text-red-400 text-center py-3 max-w-lg bg-red-500/10 px-6 rounded-xl border border-red-500/30">
        {error.message || error.toString()}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-br from-slate-900 to-slate-950 pt-16 pb-20">
      {/* Background Patterns & Gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(to right, #334155 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Mesh Gradients */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] rounded-full bg-indigo-900/5 blur-[80px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[30%] rounded-full bg-blue-900/5 blur-[60px]" />
      </div>
      
      <div className="max-w-6xl mx-auto px-4 py-10 relative z-10">
        {/* Enterprise Header */}
        <div className="relative mb-10">
          {/* Enterprise Badge */}
          <div className="absolute right-0 top-1 z-10 hidden md:block">
            <div className="px-3 py-1 bg-slate-800/60 border border-indigo-500/30 rounded-full text-xs font-semibold tracking-wider text-indigo-300 shadow-md backdrop-blur-md">
              Enterprise Suite
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-xl"></div>
                <div className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-900/80 to-indigo-950/80 p-4 border border-indigo-700/30 shadow-lg">
                  <FiFolder className="text-indigo-400 text-4xl" />
                </div>
              </div>
              
              <div>
                <div className="text-xs font-semibold tracking-wide text-indigo-400 uppercase mb-1">
                  Project Management
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-1 bg-clip-text bg-gradient-to-r from-white to-slate-300">
                  Your Projects
                </h2>
                <p className="text-slate-400 text-sm">
                  Manage and track your enterprise projects
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
              <div className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects..." 
                  className="w-full sm:w-60 px-4 pl-10 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
                />
                <FiSearch className="absolute left-3.5 top-3 text-slate-400" />
              </div>
              
              <Link 
                to="/projects/new" 
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium hover:from-indigo-500 hover:to-indigo-700 transition-all duration-300 border border-indigo-500/30 shadow-lg shadow-indigo-900/20 hover:shadow-xl hover:shadow-indigo-900/30 transform hover:-translate-y-0.5"
              >
                <FiFolderPlus className="text-lg" /> 
                <span>New Project</span>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Project List */}
        {filteredProjects && filteredProjects.length > 0 ? (
          <motion.div 
            className="grid gap-6"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {filteredProjects.map(project => (
              <motion.div key={project._id} variants={itemVariants}>
                <ProjectListItem project={project} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="py-24 px-8 rounded-2xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border border-slate-700/30 shadow-xl text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-800/80 rounded-full border border-slate-700/50 mb-4">
                <FiFolder className="text-slate-400 text-4xl" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No projects found</h3>
              <p className="text-slate-400 max-w-md mx-auto mb-8">
                {searchQuery ? 
                  `No projects matched your search "${searchQuery}". Try a different search term or create a new project.` : 
                  "You don't have any projects yet. Create your first project to get started with project management."
                }
              </p>
              <Link 
                to="/projects/new" 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium hover:from-indigo-500 hover:to-indigo-700 transition-all duration-300 border border-indigo-500/30 shadow-lg shadow-indigo-900/20 hover:shadow-xl hover:shadow-indigo-900/30 transform hover:-translate-y-0.5"
              >
                <FiFolderPlus className="text-lg" /> 
                <span>Create your first project</span>
              </Link>
            </div>
          </div>
        )}
      </div>
      
      {/* Add global styles for fonts and animations */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  );
};

export default ProjectList;