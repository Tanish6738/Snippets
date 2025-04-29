// Project Dashboard Widgets Component
import React from 'react';
import { FiCheckCircle, FiLayers, FiList, FiTrendingUp } from 'react-icons/fi';

const widgetList = [
  {
    label: 'Status',
    icon: <FiCheckCircle className="text-blue-400 text-xl" />, key: 'status',
    bg: 'from-blue-900/40 to-blue-800/30',
  },
  {
    label: 'Progress',
    icon: <FiTrendingUp className="text-green-400 text-xl" />, key: 'progress',
    bg: 'from-green-900/40 to-green-800/30',
    suffix: '%',
  },
  {
    label: 'Total Tasks',
    icon: <FiList className="text-indigo-400 text-xl" />, key: 'totalTasks',
    bg: 'from-indigo-900/40 to-indigo-800/30',
  },
];

const ProjectDashboardWidgets = ({ data }) => {
  if (!data) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
      {widgetList.map((w, i) => (
        <div
          key={w.key}
          className={`rounded-2xl p-6 shadow-lg bg-gradient-to-br ${w.bg} border border-slate-700/30 flex items-center gap-4 hover:scale-[1.03] transition-transform duration-200`}
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/30">
            {w.icon}
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium mb-1">{w.label}</div>
            <div className="text-2xl font-bold text-white">
              {data[w.key]}{w.suffix || ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectDashboardWidgets;