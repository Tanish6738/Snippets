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

const Section = ({ title, icon, children, color }) => (
  <div className={`mb-8 rounded-xl shadow-lg bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/40 p-6`}>  
    <div className={`flex items-center gap-2 mb-3 text-lg font-bold ${color || 'text-indigo-300'}`}>
      {icon && <span className="text-2xl">{icon}</span>}
      {title}
    </div>
    <div>{children}</div>
  </div>
);

const List = ({ items, renderItem, emptyText }) => (
  <ul className="list-none pl-0 space-y-2">
    {items && items.length > 0
      ? items.map(renderItem)
      : <li className="text-slate-400 italic">{emptyText}</li>}
  </ul>
);

const ProjectHealthInsights = ({ insights }) => {
  if (!insights) return <div className="text-slate-400">No AI health insights available.</div>;
  if (typeof insights === 'string') return <div className="text-slate-300">{insights}</div>;

  if (typeof insights === 'object' && insights.summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="col-span-1">
          <Section title="Summary" icon={<FiInfo />} color="text-blue-300">
            <div className="text-slate-100 text-base leading-relaxed">{insights.summary}</div>
          </Section>
          <Section title="Recommendations" icon={<FiTrendingUp />} color="text-green-300">
            <List
              items={insights.recommendations}
              emptyText="No recommendations."
              renderItem={(rec, idx) => (
                <li key={idx} className="bg-slate-700/60 rounded px-3 py-2 text-slate-100 shadow-sm border-l-4 border-green-400">
                  {rec}
                </li>
              )}
            />
          </Section>
        </div>
        <div className="col-span-1 flex flex-col gap-8">
          <Section title="At-Risk Tasks" icon={<FiAlertCircle />} color="text-yellow-300">
            <List
              items={insights.atRiskTasks}
              emptyText="No at-risk tasks."
              renderItem={(task, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-yellow-900/30 rounded px-3 py-2 text-yellow-200 border-l-4 border-yellow-400">
                  <span className="font-semibold">{task.title}</span>
                  <span className="text-xs text-yellow-100">{task.reason}</span>
                </li>
              )}
            />
          </Section>
          <Section title="Delayed Tasks" icon={<FiAlertCircle />} color="text-red-300">
            <List
              items={insights.delayedTasks}
              emptyText="No delayed tasks."
              renderItem={(task, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-red-900/30 rounded px-3 py-2 text-red-200 border-l-4 border-red-400">
                  <span className="font-semibold">{task.title}</span>
                  {task.dueDate && <span className="text-xs text-red-100">(Due: {task.dueDate})</span>}
                </li>
              )}
            />
          </Section>
          <Section title="Blocked Tasks" icon={<FiAlertCircle />} color="text-orange-300">
            <List
              items={insights.blockedTasks}
              emptyText="No blocked tasks."
              renderItem={(task, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-orange-900/30 rounded px-3 py-2 text-orange-200 border-l-4 border-orange-400">
                  <span className="font-semibold">{task.title}</span>
                  {task.blockedBy && task.blockedBy.length > 0 && (
                    <span className="text-xs text-orange-100">(Blocked by: {task.blockedBy.join(', ')})</span>
                  )}
                </li>
              )}
            />
          </Section>
        </div>
      </div>
    );
  }

  // Fallback for other object/array formats
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