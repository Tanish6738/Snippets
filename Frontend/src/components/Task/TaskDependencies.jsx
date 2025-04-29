// Task Dependencies Component
import React from 'react';
import { Link } from 'react-router-dom';

const TaskDependencies = ({ dependencies = [] }) => {
  if (!dependencies || !dependencies.length) {
    return (
      <div className="text-slate-400 text-center py-4 italic">
        No dependencies have been set for this task.
      </div>
    );
  }

  // Get dependency type label and styling
  const getDependencyTypeInfo = (type) => {
    switch(type) {
      case 'finish-to-start':
        return {
          label: 'Finish to Start',
          color: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
        };
      case 'start-to-start':
        return {
          label: 'Start to Start',
          color: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        };
      case 'finish-to-finish':
        return {
          label: 'Finish to Finish',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        };
      case 'start-to-finish':
        return {
          label: 'Start to Finish',
          color: 'bg-green-500/20 text-green-300 border-green-500/30'
        };
      default:
        return {
          label: type || 'Unknown',
          color: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
        };
    }
  };

  return (
    <div className="space-y-3">
      {dependencies.map((dep, i) => {
        const typeInfo = getDependencyTypeInfo(dep.type);
        return (
          <div 
            key={dep.task?._id || dep.task || i} 
            className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <div className="text-white">
                  {dep.task?.title || 'Task'}
                </div>
              </div>
              {dep.task?._id && (
                <Link to={`/tasks/${dep.task._id}`} className="text-xs text-indigo-400 hover:text-indigo-300 ml-6">
                  View dependency
                </Link>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`px-2 py-0.5 text-xs rounded border ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
              {dep.delay > 0 && (
                <span className="px-2 py-0.5 text-xs rounded bg-slate-700/50 text-slate-300 border border-slate-600/30">
                  +{dep.delay}d delay
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskDependencies;