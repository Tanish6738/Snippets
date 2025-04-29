import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createProject } from '../../services/projectService';
import ProjectForm from '../../components/Project/ProjectForm';
import { FiPlusSquare, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import { motion } from 'framer-motion';

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
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/5 blur-[80px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/5 blur-[80px]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Back Button */}
        <div className="px-4 mb-6">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 transition-all duration-200 text-sm backdrop-blur-sm border border-slate-700/40"
          >
            <FiArrowLeft size={14} />
            <span>Back to Projects</span>
          </Link>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl border border-slate-700/30 mx-4"
        >
          {/* Header with Enterprise Badge */}
          <div className="relative overflow-hidden px-8 pt-10 pb-5 border-b border-slate-700/40">
            {/* Enterprise Badge */}
            <div className="absolute top-3 right-3 z-10">
              <div className="px-2 py-0.5 bg-slate-800/60 border border-indigo-500/30 rounded-full text-xs font-semibold tracking-wider text-indigo-300 shadow-sm backdrop-blur-md">
                Enterprise
              </div>
            </div>

            {/* Decorative corner */}
            <div className="absolute top-0 right-0 w-16 h-16">
              <div className="absolute transform rotate-45 bg-indigo-600/20 w-16 h-16 -top-8 -right-8"></div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-xl blur-md"></div>
                <div className="relative p-2 bg-indigo-900/50 rounded-xl border border-indigo-700/30 shadow-lg shadow-indigo-900/20">
                  <FiPlusSquare className="text-indigo-400 text-xl" />
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-indigo-400 font-semibold mb-1">
                  Project Management
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-0 tracking-tight bg-clip-text bg-gradient-to-r from-white to-slate-300">
                  Create New Project
                </h1>
              </div>
            </div>
          </div>
          
          {/* Form Content with Premium Design */}
          <div className="px-8 py-8">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
                <FiAlertCircle className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <ProjectForm 
              initialValues={{}} 
              onSubmit={handleSubmit} 
              loading={loading} 
            />
          </div>
          
          {/* Bottom decorator */}
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600/40 via-violet-600/40 to-indigo-600/0"></div>
        </motion.div>
        
        {/* Enterprise subtle branding */}
        <div className="text-center mt-6 mb-4 text-slate-500 text-xs font-medium">
          <span className="opacity-75">CodeArc Enterprise Suite v3.2.1</span>
        </div>
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

export default ProjectCreate;