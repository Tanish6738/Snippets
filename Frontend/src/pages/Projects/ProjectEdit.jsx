import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../../hooks/useProject';
import { updateProject } from '../../services/projectService';
import ProjectForm from '../../components/Project/ProjectForm';
import { FiEdit3, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import { motion } from 'framer-motion';

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

  const handleBackClick = () => {
    navigate(`/projects/${projectId}`);
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 flex justify-center items-center pt-16">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-indigo-500 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-t-4 border-b-4 border-sky-500 animate-spin"></div>
        </div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center justify-center pt-16 px-4">
      <div className="mb-4 p-3 rounded-full bg-red-500/20 w-16 h-16 flex items-center justify-center">
        <FiAlertCircle className="text-red-400 text-3xl animate-pulse" />
      </div>
      <h3 className="text-xl font-semibold text-slate-100 mb-2">Error Loading Project</h3>
      <div className="text-red-400 text-center py-3 max-w-lg bg-red-500/10 px-6 rounded-xl border border-red-500/30">
        {error.message || error.toString()}
      </div>
      <button 
        onClick={() => navigate('/projects')}
        className="mt-6 px-5 py-2 rounded-lg bg-slate-800/80 text-slate-300 flex items-center gap-2 border border-slate-700/50 hover:bg-slate-700/80 transition-colors"
      >
        <FiArrowLeft /> Back to Projects
      </button>
    </div>
  );
  
  if (!project) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center justify-center pt-16">
      <div className="mb-4 p-3 rounded-full bg-slate-500/20 w-16 h-16 flex items-center justify-center">
        <FiEdit3 className="text-slate-400 text-3xl" />
      </div>
      <h3 className="text-xl font-semibold text-slate-100 mb-2">Project Not Found</h3>
      <div className="text-slate-400 text-center py-3">
        The project you're looking for doesn't exist or has been deleted.
      </div>
      <button 
        onClick={() => navigate('/projects')}
        className="mt-6 px-5 py-2 rounded-lg bg-slate-800/80 text-slate-300 flex items-center gap-2 border border-slate-700/50 hover:bg-slate-700/80 transition-colors"
      >
        <FiArrowLeft /> Back to Projects
      </button>
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
        <div className="absolute top-[-30%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-900/5 blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/5 blur-[100px]" />
      </div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="px-4 mb-6">
          <button
            onClick={handleBackClick}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 transition-all duration-200 text-sm backdrop-blur-sm border border-slate-700/40"
          >
            <FiArrowLeft size={14} />
            <span>Back to Project</span>
          </button>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl border border-slate-700/30 mx-4"
        >
          {/* Header */}
          <div className="relative overflow-hidden px-8 pt-10 pb-5 border-b border-slate-700/40">
            {/* Decorative corner */}
            <div className="absolute top-0 right-0 w-16 h-16">
              <div className="absolute transform rotate-45 bg-indigo-600/20 w-16 h-16 -top-8 -right-8"></div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-2 bg-indigo-900/50 rounded-xl border border-indigo-700/30 shadow-lg shadow-indigo-900/20">
                <FiEdit3 className="text-indigo-400 text-xl" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-indigo-400 font-semibold mb-1">
                  Project Management
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-0">
                  Edit Project
                </h1>
              </div>
            </div>
          </div>
          
          {/* Form Content */}
          <div className="px-8 py-8">
            {submitError && (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
                <FiAlertCircle className="mt-0.5 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
            
            <ProjectForm 
              initialValues={project} 
              onSubmit={handleSubmit} 
              loading={submitting} 
            />
          </div>
          
          {/* Bottom decorator */}
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600/40 via-violet-600/40 to-indigo-600/0"></div>
        </motion.div>
        
        {/* Enterprise subtle branding */}
        <div className="text-center mt-6 mb-4 text-slate-500 text-xs font-medium">
          Project ID: {projectId.slice(0,8)}...{projectId.slice(-8)}
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

export default ProjectEdit;