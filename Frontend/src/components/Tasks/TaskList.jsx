import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiMessageCircle, FiFilter, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { format } from 'date-fns';
import TaskCommentModal from './TaskCommentModal';
import { useProject } from '../../Context/ProjectContext';
import { GlassCard } from '../User/Home/Cards';
import LoadingSpinner from '../Common/LoadingSpinner';

const TaskList = ({ projectId, tasks = [], members = [] }) => {
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignedTo: 'all',
  });
  
  const [sortConfig, setSortConfig] = useState({ key: 'priority', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const { loading } = useProject();
  
  // Use useMemo to compute filtered tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (filters.status !== 'all') {
      result = result.filter(task => task.status === filters.status);
    }
    if (filters.priority !== 'all') {
      result = result.filter(task => task.priority === filters.priority);
    }
    if (filters.assignedTo !== 'all') {
      result = result.filter(task =>
        filters.assignedTo === 'unassigned'
          ? !task.assignedTo
          : task.assignedTo?._id === filters.assignedTo
      );
    }
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (!a[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (!b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        let valueA, valueB;
        if (sortConfig.key === 'dueDate') {
          valueA = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
          valueB = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        } else if (sortConfig.key === 'assignedTo') {
          valueA = a.assignedTo?.username?.toLowerCase() || '';
          valueB = b.assignedTo?.username?.toLowerCase() || '';
        } else if (sortConfig.key === 'priority') {
          const priorityWeight = { 'Low': 1, 'Medium': 2, 'High': 3, 'Urgent': 4 };
          valueA = priorityWeight[a.priority] || 0;
          valueB = priorityWeight[b.priority] || 0;
        } else {
          valueA = typeof a[sortConfig.key] === 'string' ? a[sortConfig.key].toLowerCase() : a[sortConfig.key];
          valueB = typeof b[sortConfig.key] === 'string' ? b[sortConfig.key].toLowerCase() : b[sortConfig.key];
        }
        if (valueA < valueB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return result;
  }, [tasks, filters, sortConfig]);

  const handleFilterChange = (filterName, value) => {
    setFilters({ ...filters, [filterName]: value });
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortDirectionIndicator = (columnName) => {
    if (sortConfig.key !== columnName) {
      return null;
    }
    return sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />;
  };

  const handleCommentClick = (task) => {
    setSelectedTask(task);
    setShowCommentModal(true);
  };

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'Low':
        return 'bg-blue-700/30 text-blue-300';
      case 'Medium':
        return 'bg-emerald-700/30 text-emerald-300';
      case 'High':
        return 'bg-orange-700/30 text-orange-300';
      case 'Urgent':
        return 'bg-red-700/30 text-red-300';
      default:
        return 'bg-slate-700/30 text-slate-400';
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Not Started':
        return 'bg-slate-700/30 text-slate-400';
      case 'In Progress':
        return 'bg-blue-700/30 text-blue-300';
      case 'On Hold':
        return 'bg-yellow-700/30 text-yellow-300';
      case 'Completed':
        return 'bg-emerald-700/30 text-emerald-300';
      default:
        return 'bg-slate-700/30 text-slate-400';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <GlassCard>
      <div className="p-4 border-b flex justify-between items-center flex-wrap gap-3">
        <h3 className="text-lg font-medium text-slate-200">Tasks</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-1.5 border border-slate-700/50 rounded-lg text-sm flex items-center text-slate-300 bg-slate-800/50 hover:bg-slate-700/50"
          >
            <FiFilter className="mr-1" /> Filter
          </button>
          <Link
            to={`/projects/${projectId}/tasks/new`}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-lg flex items-center px-3 py-1.5 shadow-lg shadow-indigo-500/20 transition-all duration-150"
          >
            <FiPlus className="mr-1" /> New Task
          </Link>
        </div>
      </div>
      {showFilters && (
        <div className="p-4 border-b bg-slate-800/40 rounded-b-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-slate-300 mb-1">
                Status
              </label>
              <select
                id="statusFilter"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="bg-slate-800/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg block w-full p-2.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label htmlFor="priorityFilter" className="block text-sm font-medium text-slate-300 mb-1">
                Priority
              </label>
              <select
                id="priorityFilter"
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="bg-slate-800/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg block w-full p-2.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label htmlFor="assigneeFilter" className="block text-sm font-medium text-slate-300 mb-1">
                Assignee
              </label>
              <select
                id="assigneeFilter"
                value={filters.assignedTo}
                onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                className="bg-slate-800/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg block w-full p-2.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All</option>
                <option value="unassigned">Unassigned</option>
                {members.map(member => (
                  <option key={member.user._id} value={member.user._id}>
                    {member.user.username}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="bg-slate-800/60 text-xs text-slate-400 uppercase">
            <tr>
              <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort('title')}>
                <div className="flex items-center">
                  Title {getSortDirectionIndicator('title')}
                </div>
              </th>
              <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort('status')}>
                <div className="flex items-center">
                  Status {getSortDirectionIndicator('status')}
                </div>
              </th>
              <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort('priority')}>
                <div className="flex items-center">
                  Priority {getSortDirectionIndicator('priority')}
                </div>
              </th>
              <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort('assignedTo')}>
                <div className="flex items-center">
                  Assigned To {getSortDirectionIndicator('assignedTo')}
                </div>
              </th>
              <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort('dueDate')}>
                <div className="flex items-center">
                  Due Date {getSortDirectionIndicator('dueDate')}
                </div>
              </th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-slate-500">
                  No tasks found. Create one to get started!
                </td>
              </tr>
            ) : (
              filteredTasks.map(task => (
                <tr key={task._id} className="border-b border-slate-800 hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium text-slate-200 max-w-[200px] truncate">
                    {task.title}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityStyles(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {task.assignedTo ? (
                      <div className="flex items-center">
                        <div className="h-6 w-6 rounded-full bg-slate-700/50 text-slate-300 flex items-center justify-center text-xs font-medium mr-2">
                          {task.assignedTo.username[0].toUpperCase()}
                        </div>
                        <span>{task.assignedTo.username}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {task.dueDate ? (
                      format(new Date(task.dueDate), 'MMM d, yyyy')
                    ) : (
                      <span className="text-slate-500">No due date</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCommentClick(task)}
                        className="text-slate-400 hover:text-indigo-400"
                        title="Comments"
                      >
                        <FiMessageCircle size={18} />
                      </button>
                      <Link
                        to={`/projects/${projectId}/tasks/${task._id}/edit`}
                        className="text-slate-400 hover:text-indigo-400"
                        title="Edit"
                      >
                        <FiEdit2 size={18} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showCommentModal && selectedTask && (
        <TaskCommentModal
          task={selectedTask}
          projectId={projectId}
          onClose={() => setShowCommentModal(false)}
        />
      )}
    </GlassCard>
  );
};

export default TaskList;