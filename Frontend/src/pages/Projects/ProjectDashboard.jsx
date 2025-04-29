import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProjectDashboard } from '../../services/projectService';
import ProjectDashboardWidgets from '../../components/Project/ProjectDashboardWidgets';
import ProjectHealthInsights from '../../components/Project/ProjectHealthInsights';
import aiTaskService from '../../services/aiTaskService';
import { FiBarChart2, FiActivity } from 'react-icons/fi';

const ProjectDashboard = () => {
  const { projectId } = useParams();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchProjectDashboard(projectId)
      .then(setDashboard)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    setAiLoading(true);
    fetchProjectDashboard(projectId)
      .then(dashboardData => {
        const tasks = dashboardData?.project?.rootTasks || dashboardData?.project?.tasks || [];
        if (!tasks.length) {
          setAiInsights('No tasks found. Add tasks to get AI health insights.');
          setAiLoading(false);
          return;
        }
        return aiTaskService.getProjectHealth(projectId, { tasks })
          .then(res => setAiInsights(res.data?.insights || res.data || res))
          .catch(() => setAiInsights(null))
          .finally(() => setAiLoading(false));
      })
      .catch(() => {
        setAiInsights(null);
        setAiLoading(false);
      });
  }, [projectId]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-indigo-500 border-t-4"></div>
    </div>
  );
  if (error) return <div className="text-red-400 text-center py-8 text-lg font-semibold">Error loading dashboard: {error.message || error.toString()}</div>;
  if (!dashboard) return <div className="text-slate-400 text-center py-8 text-lg">No dashboard data found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 pt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-10 flex items-center gap-4">
          <span className="inline-flex items-center justify-center rounded-lg bg-indigo-900/40 p-3 border border-indigo-700/30 shadow">
            <FiBarChart2 className="text-indigo-400 text-3xl" />
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Project Dashboard</h2>
        </div>
        <ProjectDashboardWidgets data={dashboard} />
        <div className="mb-8 p-6 rounded-xl bg-slate-800/60 border border-slate-700/30 shadow">
          <h3 className="font-semibold mb-3 text-white text-xl">Project Details</h3>
          <div className="text-slate-300">
            <div><span className="font-semibold">Title:</span> {dashboard.dashboard.project.title}</div>
            <div><span className="font-semibold">Description:</span> {dashboard.dashboard.project.description}</div>
            <div><span className="font-semibold">Status:</span> {dashboard.dashboard.project.status}</div>
            <div><span className="font-semibold">Priority:</span> {dashboard.dashboard.project.priority}</div>
            <div><span className="font-semibold">Progress:</span> {dashboard.dashboard.project.progress}%</div>
            <div><span className="font-semibold">Deadline:</span> {dashboard.dashboard.project.deadline ? new Date(dashboard.dashboard.project.deadline).toLocaleDateString() : 'N/A'}</div>
            <div><span className="font-semibold">Created By:</span> {dashboard.dashboard.project.createdBy?.username || dashboard.dashboard.project.createdBy?.email}</div>
            <div><span className="font-semibold">Created At:</span> {new Date(dashboard.dashboard.project.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
        <div className="mt-10 p-8 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/40 shadow-xl">
          <h3 className="font-bold mb-5 flex items-center gap-3 text-white text-xl"><FiActivity className="text-indigo-400" /> AI Health Insights</h3>
          {aiLoading ? <div className="text-slate-400 animate-pulse">Loading AI insights...</div> : <ProjectHealthInsights insights={aiInsights} />}
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;