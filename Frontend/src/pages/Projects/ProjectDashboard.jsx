import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectDashboard as fetchProjectDashboard } from '../../services/projectService';
import ProjectDashboardWidgets from '../../components/Project/ProjectDashboardWidgets';
import ProjectHealthInsights from '../../components/Project/ProjectHealthInsights';
import { FiBarChart2, FiActivity, FiAlertCircle } from 'react-icons/fi';

const ProjectDashboard = () => {
  const { projectId } = useParams();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchProjectDashboard(projectId)
      .then(data => {
        setDashboard(data);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return (
    <div className="flex justify-center items-center h-[50vh]">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-indigo-500 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-t-4 border-b-4 border-sky-500 animate-spin"></div>
        </div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex flex-col items-center justify-center h-[50vh] px-6">
      <div className="mb-4 p-3 rounded-full bg-red-500/20 w-16 h-16 flex items-center justify-center">
        <FiAlertCircle className="text-red-400 text-3xl animate-pulse" />
      </div>
      <h3 className="text-xl font-semibold text-slate-100 mb-2">Error Loading Dashboard</h3>
      <div className="text-red-400 text-center py-3 max-w-lg bg-red-500/10 px-6 rounded-xl border border-red-500/30">
        {error.message || error.toString()}
      </div>
    </div>
  );
  
  if (!dashboard) return (
    <div className="flex flex-col items-center justify-center h-[50vh]">
      <div className="mb-4 p-3 rounded-full bg-slate-500/20 w-16 h-16 flex items-center justify-center">
        <FiBarChart2 className="text-slate-400 text-3xl" />
      </div>
      <div className="text-slate-400 text-center py-8 text-lg">No dashboard data found.</div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-br from-slate-900 to-slate-950 pt-16">
      {/* Background Patterns & Gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(to right, #334155 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Mesh Gradients */}
        <div className="absolute top-[-30%] right-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-900/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/5 blur-[100px]" />
      </div>
      
      <div className="max-w-6xl mx-auto px-4 py-12 relative z-10">
        {/* Enterprise Badge Header */}
        <div className="relative mb-10">
          {/* Enterprise Badge */}
          <div className="absolute right-0 top-0 z-10 transform -translate-y-1/2 hidden md:block">
            <div className="px-3 py-1 bg-slate-800/60 border border-indigo-500/30 rounded-full text-xs font-semibold tracking-wider text-indigo-300 shadow-lg shadow-indigo-900/20 backdrop-blur-md">
              Enterprise Analytics
            </div>
          </div>
          
          {/* Main Header */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-xl"></div>
              <div className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-900/80 to-indigo-950/80 p-4 border border-indigo-700/30 shadow-lg">
                <FiBarChart2 className="text-indigo-400 text-4xl" />
              </div>
            </div>
            
            <div>
              <div className="text-xs font-semibold tracking-wide text-indigo-400 uppercase mb-1">
                Project Analytics
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-1">
                Project Dashboard
              </h2>
              <p className="text-slate-400 text-sm">
                ID: {projectId.slice(0,8)}...{projectId.slice(-8)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Dashboard Widgets */}
        <ProjectDashboardWidgets data={dashboard} />
        
        {/* Project Details */}
        <div className="mb-8 p-6 rounded-xl bg-slate-800/40 border border-slate-700/40 backdrop-blur-sm shadow-xl transform transition-all duration-300 hover:shadow-indigo-900/5 hover:-translate-y-0.5">
          <h3 className="font-semibold mb-5 text-white text-xl flex items-center">
            <span className="inline-block h-1.5 w-1.5 bg-indigo-500 rounded-full mr-2 animate-pulse"></span>
            Project Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
            <div className="space-y-3">
              <DetailItem 
                label="Title" 
                value={dashboard.dashboard.project.title} 
              />
              <DetailItem 
                label="Description" 
                value={dashboard.dashboard.project.description} 
                className="text-sm text-slate-400 line-clamp-2"
              />
              <DetailItem 
                label="Status" 
                value={
                  <span className={`px-2.5 py-1 text-xs rounded-full inline-flex items-center
                    ${dashboard.dashboard.project.status === 'Completed' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                      dashboard.dashboard.project.status === 'In Progress' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      dashboard.dashboard.project.status === 'On Hold' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                      'bg-slate-500/20 text-slate-300 border border-slate-500/30'}`}
                  >
                    {dashboard.dashboard.project.status}
                  </span>
                } 
              />
              <DetailItem 
                label="Priority" 
                value={
                  <span className={`px-2.5 py-1 text-xs rounded-full inline-flex items-center
                    ${dashboard.dashboard.project.priority === 'High' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 
                      dashboard.dashboard.project.priority === 'Medium' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                      'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}
                  >
                    {dashboard.dashboard.project.priority}
                  </span>
                } 
              />
            </div>
            
            <div className="space-y-3">
              <DetailItem 
                label="Progress" 
                value={
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-700/50 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-sky-500" 
                        style={{width: `${dashboard.dashboard.project.progress}%`}}
                      />
                    </div>
                    <span>{dashboard.dashboard.project.progress}%</span>
                  </div>
                } 
              />
              <DetailItem 
                label="Deadline" 
                value={dashboard.dashboard.project.deadline ? 
                  new Date(dashboard.dashboard.project.deadline).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 'N/A'} 
              />
              <DetailItem 
                label="Created By" 
                value={dashboard.dashboard.project.createdBy?.username || dashboard.dashboard.project.createdBy?.email} 
              />
              <DetailItem 
                label="Created At" 
                value={new Date(dashboard.dashboard.project.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })} 
              />
            </div>
          </div>
        </div>
        
        {/* AI Health Insights */}
        <div className="mt-12 relative">
          {/* Decorative Elements */}
          <div className="absolute -left-16 -top-8 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl"></div>
          <div className="absolute -right-16 -bottom-8 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl"></div>
          
          <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-sm border border-slate-700/40 shadow-xl">
            <h3 className="font-bold mb-6 flex items-center gap-3 text-white text-xl">
              <div className="p-2 bg-indigo-900/50 rounded-lg border border-indigo-700/30">
                <FiActivity className="text-indigo-400" />
              </div>
              AI Health Insights
            </h3>
            <ProjectHealthInsights insights={dashboard.dashboard.aiHealthInsights} />
          </div>
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

// Helper component for detail items
const DetailItem = ({ label, value, className }) => (
  <div>
    <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{label}</span>
    <div className={className || "mt-1"}>{value}</div>
  </div>
);

export default ProjectDashboard;