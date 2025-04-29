// Task List Component
import React, { useState } from 'react';
import TaskListItem from './TaskListItem';
import { createSubtask } from '../../services/taskService';

// Recursive component to render tasks and their subtasks
const TaskTree = ({
  tasks,
  onEditTask,
  onAddSubtask,
  level = 0,
  projectMembers,
  isAdmin,
  onTaskAssigned,
  onShowSubtaskForm
}) => {
  if (!tasks || !tasks.length) return null;
  return (
    <div
      className={
        level > 0
          ? `pl-2 sm:pl-4 md:pl-8 border-l-2 border-slate-700/40 ml-1 sm:ml-2 md:ml-4` // Responsive indent and border for subtasks
          : ''
      }
    >
      {tasks.map(task => {
        // Calculate subtask progress
        const total = task.subtasks ? task.subtasks.length : 0;
        const completed = total > 0 ? task.subtasks.filter(st => st.status === 'Completed').length : 0;
        // Collapsed state is managed in TaskListItem
        return (
          <div key={task._id || task.id} className="mb-4">
            <TaskListItem
              task={task}
              onEdit={onEditTask}
              onAddSubtask={() => onShowSubtaskForm(task)}
              projectMembers={projectMembers}
              isAdmin={isAdmin}
              onTaskAssigned={onTaskAssigned}
              showSubtaskProgress={total > 0}
              subtaskProgress={{ completed, total }}
            />
            {task.subtasks && task.subtasks.length > 0 && (
              <TaskTree
                tasks={task.subtasks}
                onEditTask={onEditTask}
                onAddSubtask={onShowSubtaskForm}
                level={level + 1}
                projectMembers={projectMembers}
                isAdmin={isAdmin}
                onTaskAssigned={onTaskAssigned}
                onShowSubtaskForm={onShowSubtaskForm}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

const TaskList = ({
  tasks = [],
  onEditTask,
  onAddSubtask,
  projectId,
  projectMembers = [],
  isAdmin = false,
  onTaskAssigned
}) => {
  const [showSubtaskForm, setShowSubtaskForm] = useState(null); // taskId or null
  const [subtaskLoading, setSubtaskLoading] = useState(false);
  const [subtaskError, setSubtaskError] = useState('');
  const [subtaskData, setSubtaskData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    dueDate: ''
  });

  const handleShowSubtaskForm = (task) => {
    setShowSubtaskForm(task);
    setSubtaskError('');
    setSubtaskData({
      title: '',
      description: '',
      priority: 'Medium',
      dueDate: ''
    });
  };

  const handleCloseSubtaskForm = () => {
    setShowSubtaskForm(null);
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!showSubtaskForm) return;
    
    setSubtaskLoading(true);
    setSubtaskError('');
    
    try {
      await createSubtask(showSubtaskForm._id, subtaskData);
      setShowSubtaskForm(null);
      if (onAddSubtask) onAddSubtask();
    } catch (err) {
      setSubtaskError(err.message || 'Failed to add subtask');
    } finally {
      setSubtaskLoading(false);
    }
  };

  const handleSubtaskInputChange = (e) => {
    const { name, value } = e.target;
    setSubtaskData({
      ...subtaskData,
      [name]: value
    });
  };

  // Replace the flat list with the TaskTree
  if (!tasks.length) return <div className="text-slate-400 text-center py-8 italic">No tasks found.</div>;
  return (
    <div className="bg-gradient-to-b from-slate-950 to-slate-900 rounded-2xl p-4 md:p-8 shadow-2xl border border-slate-800/40">
      <TaskTree
        tasks={tasks}
        onEditTask={onEditTask}
        onAddSubtask={handleShowSubtaskForm}
        projectMembers={projectMembers}
        isAdmin={isAdmin}
        onTaskAssigned={onTaskAssigned}
        onShowSubtaskForm={handleShowSubtaskForm}
      />
      {/* Subtask Form Modal */}
      {showSubtaskForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={handleCloseSubtaskForm}>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Add Subtask to "{showSubtaskForm.title}"</h3>
              <button onClick={handleCloseSubtaskForm} className="text-slate-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            {subtaskError && (
              <div className="mb-4 p-2 rounded bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-medium">
                {subtaskError}
              </div>
            )}
            <form onSubmit={handleAddSubtask}>
              <div className="mb-3">
                <label htmlFor="title" className="block mb-1 text-sm font-semibold text-slate-200">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={subtaskData.title}
                  onChange={handleSubtaskInputChange}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-3 text-white placeholder-slate-400 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="description" className="block mb-1 text-sm font-semibold text-slate-200">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={subtaskData.description}
                  onChange={handleSubtaskInputChange}
                  rows="3"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-3 text-white placeholder-slate-400 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                ></textarea>
              </div>
              <div className="mb-3">
                <label htmlFor="priority" className="block mb-1 text-sm font-semibold text-slate-200">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={subtaskData.priority}
                  onChange={handleSubtaskInputChange}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-3 text-white placeholder-slate-400 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="dueDate" className="block mb-1 text-sm font-semibold text-slate-200">Due Date (optional)</label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={subtaskData.dueDate}
                  onChange={handleSubtaskInputChange}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-3 text-white placeholder-slate-400 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={handleCloseSubtaskForm}
                  className="px-3 py-1.5 rounded bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subtaskLoading || !subtaskData.title.trim()}
                  className="px-3 py-1.5 rounded bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm hover:from-indigo-700 hover:to-blue-700 disabled:opacity-70 flex items-center gap-1 font-semibold transition"
                >
                  {subtaskLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Create Subtask'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;