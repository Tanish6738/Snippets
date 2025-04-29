// AI Project Health Insights Component
import React from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiTrendingUp } from 'react-icons/fi';

const getStatusIcon = (status) => {
  if (!status) return <FiInfo className="text-slate-400" />;
  if (status === 'Healthy') return <FiCheckCircle className="text-green-400" />;
  if (status === 'Warning') return <FiAlertCircle className="text-yellow-400" />;
  if (status === 'Critical') return <FiAlertCircle className="text-red-400" />;
  return <FiInfo className="text-slate-400" />;
};

const ProjectHealthInsights = ({ insights }) => {
  if (!insights) return <div className="text-slate-400">No AI health insights available.</div>;
  if (typeof insights === 'string') return <div className="text-slate-300">{insights}</div>;
  if (Array.isArray(insights)) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((insight, idx) => (
          <div key={idx} className="rounded-xl bg-slate-900/70 border border-slate-700/30 p-5 flex gap-4 items-start shadow">
            <div className="mt-1">{getStatusIcon(insight.status)}</div>
            <div>
              <div className="font-semibold text-white mb-1">{insight.title || 'Insight'}</div>
              <div className="text-slate-300 text-sm">{insight.description || JSON.stringify(insight)}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  // If insights is an object
  return (
    <div className="rounded-xl bg-slate-900/70 border border-slate-700/30 p-5 flex gap-4 items-start shadow">
      <div className="mt-1">{getStatusIcon(insights.status)}</div>
      <div>
        <div className="font-semibold text-white mb-1">{insights.title || 'Insight'}</div>
        <div className="text-slate-300 text-sm">{insights.description || JSON.stringify(insights)}</div>
      </div>
    </div>
  );
};

export default ProjectHealthInsights;