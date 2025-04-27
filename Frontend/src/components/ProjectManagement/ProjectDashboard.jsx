import React, { useState } from 'react';
import { ProjectTasksProvider, useProjectTasks } from '../../Context/ProjectTasksContext';
import AiTaskGenerator from './AiTaskGenerator';
import { GlassCard } from '../User/Home/Cards';

const TaskList = () => {
  const { tasks, loading, error } = useProjectTasks();
  if (loading) return <div className="text-slate-400 py-8 text-center">Loading tasks...</div>;
  if (error) return <div className="text-red-400 py-8 text-center">{error}</div>;
  if (!tasks || tasks.length === 0) return <div className="text-slate-500 py-8 text-center">No tasks found for this project.</div>;
  const renderTasks = (tasks, level = 0) => (
    <ul className={level === 0 ? 'space-y-3' : 'ml-6 space-y-2'}>
      {tasks.map((task, idx) => (
        <li key={task._id || idx}>
          <GlassCard>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">{task.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-400`}>{task.status || 'To Do'}</span>
              </div>
              <div className="text-xs text-slate-400">{task.description}</div>
              {task.dueDate && <div className="text-xs text-slate-500">Due: {task.dueDate}</div>}
              {task.priority && <div className="text-xs text-slate-500">Priority: {task.priority}</div>}
            </div>
            {task.subtasks && task.subtasks.length > 0 && renderTasks(task.subtasks, level + 1)}
          </GlassCard>
        </li>
      ))}
    </ul>
  );
  return renderTasks(tasks);
};

const ProjectDashboard = ({ projectId }) => {
  const [showAiModal, setShowAiModal] = useState(false);
  return (
    <ProjectTasksProvider projectId={projectId}>
      <div className="max-w-3xl mx-auto py-8 px-2">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-200">Project Dashboard</h1>
          <button
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl px-5 py-2.5 shadow-lg shadow-indigo-500/20 transition-all duration-150"
            onClick={() => setShowAiModal(true)}
          >
            + AI Task Generator
          </button>
        </div>
        <GlassCard>
          <TaskList />
        </GlassCard>
        <AiTaskGenerator
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          projectId={projectId}
        />
      </div>
    </ProjectTasksProvider>
  );
};

export default ProjectDashboard;
