import React, { useMemo, useState } from 'react';
import { useProject } from '../../Context/ProjectContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiClock, FiUsers, FiCheckCircle, FiAlertCircle, 
  FiAlertTriangle, FiActivity, FiCalendar, FiFilter,
  FiStar, FiZap, FiRefreshCw, FiTrello
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';

const ProjectDashboard = ({ projectId }) => {
  const { currentProject, tasks, projectMembers, loading, refreshData } = useProject();
  const [activeTab, setActiveTab] = useState('overview');
  const [taskFilterStatus, setTaskFilterStatus] = useState('all');

  // Calculate project statistics
  const stats = useMemo(() => {
    if (!tasks || !tasks.length) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        blocked: 0,
        overdue: 0,
        completionRate: 0,
        upcomingDueTasks: [],
        recentActivities: [],
      };
    }

    // Flatten all tasks including subtasks
    const flattenTasks = (taskList) => {
      let flattened = [];
      
      taskList.forEach(task => {
        flattened.push(task);
        
        if (task.subtasks && task.subtasks.length > 0) {
          flattened = [...flattened, ...flattenTasks(task.subtasks)];
        }
      });
      
      return flattened;
    };
    
    const allTasks = flattenTasks(tasks);
    const today = new Date();
    
    // Calculate counts
    const total = allTasks.length;
    const completed = allTasks.filter(task => task.status === 'Done' || task.status === 'Completed').length;
    const inProgress = allTasks.filter(task => task.status === 'In Progress').length;
    const blocked = allTasks.filter(task => task.status === 'Blocked').length;
    const overdue = allTasks.filter(task => {
      if (!task.dueDate || task.status === 'Done' || task.status === 'Completed') return false;
      return new Date(task.dueDate) < today;
    }).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Get upcoming tasks due in the next 7 days
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const upcomingDueTasks = allTasks
      .filter(task => {
        if (!task.dueDate || task.status === 'Done' || task.status === 'Completed') return false;
        
        const dueDate = new Date(task.dueDate);
        return dueDate >= today && dueDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);
    
    // Get recent activities
    const recentActivities = (currentProject?.activities || [])
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
    
    return {
      total,
      completed,
      inProgress,
      blocked,
      overdue,
      completionRate,
      upcomingDueTasks,
      recentActivities,
    };
  }, [tasks, currentProject]);

  // Filter tasks by status for the task board
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return taskFilterStatus === 'all' 
      ? tasks
      : tasks.filter(task => task.status === taskFilterStatus);
  }, [tasks, taskFilterStatus]);

  const handleRefresh = () => {
    refreshData();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <FiRefreshCw className="text-indigo-500 w-8 h-8 mb-2 animate-spin" />
          <p className="text-slate-400">Loading project data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Project Header */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {currentProject?.name || 'Project Dashboard'}
            </h1>
            <p className="text-slate-400 max-w-2xl">
              {currentProject?.description || 'No description provided for this project.'}
            </p>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRefresh}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-all"
              title="Refresh dashboard"
            >
              <FiRefreshCw className="w-5 h-5" />
            </motion.button>
            
            <Link
              to={`/projects/${projectId}/tasks/new`}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white rounded-lg transition-all"
            >
              <FiTrello className="w-4 h-4" /> 
              View Tasks
            </Link>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {/* Open AI task generator modal */}}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg shadow-lg shadow-indigo-500/20 transition-all"
            >
              <FiZap className="w-4 h-4" />
              Generate AI Tasks
            </motion.button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-700/50 mb-6">
        <button
          className={`px-4 py-2 border-b-2 font-medium text-sm ${
            activeTab === 'overview'
              ? 'text-indigo-400 border-indigo-400'
              : 'text-slate-400 border-transparent hover:text-slate-300 hover:border-slate-600/50'
          } transition-colors`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 border-b-2 font-medium text-sm ${
            activeTab === 'tasks'
              ? 'text-indigo-400 border-indigo-400'
              : 'text-slate-400 border-transparent hover:text-slate-300 hover:border-slate-600/50'
          } transition-colors`}
          onClick={() => setActiveTab('tasks')}
        >
          Tasks
        </button>
        <button
          className={`px-4 py-2 border-b-2 font-medium text-sm ${
            activeTab === 'team'
              ? 'text-indigo-400 border-indigo-400'
              : 'text-slate-400 border-transparent hover:text-slate-300 hover:border-slate-600/50'
          } transition-colors`}
          onClick={() => setActiveTab('team')}
        >
          Team
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Project Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard
                title="Total Tasks"
                value={stats.total}
                icon={<FiActivity className="w-5 h-5" />}
                color="from-blue-600 to-indigo-700"
              />
              <StatCard
                title="Completed"
                value={stats.completed}
                subtitle={stats.total > 0 ? `${stats.completionRate}%` : '0%'}
                icon={<FiCheckCircle className="w-5 h-5" />}
                color="from-green-600 to-emerald-700"
              />
              <StatCard
                title="In Progress"
                value={stats.inProgress}
                icon={<FiActivity className="w-5 h-5" />}
                color="from-indigo-600 to-violet-700"
              />
              <StatCard
                title="Blocked"
                value={stats.blocked}
                icon={<FiAlertCircle className="w-5 h-5" />}
                color="from-amber-600 to-orange-700"
              />
              <StatCard
                title="Overdue"
                value={stats.overdue}
                icon={<FiClock className="w-5 h-5" />}
                color="from-red-600 to-rose-700"
              />
            </div>

            {/* Progress Bar */}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-white">Project Progress</h3>
                <div className="text-sm font-medium text-white bg-slate-800/50 px-2 py-1 rounded-lg">
                  {stats.completionRate}%
                </div>
              </div>
              <div className="mt-2 relative">
                <div className="h-3 w-full bg-slate-800/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.completionRate}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full ${getProgressColor(stats.completionRate)}`}
                  ></motion.div>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                {stats.completed} of {stats.total} tasks completed
              </div>
            </div>

            {/* Two Column Layout for Dashboard Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Due Tasks */}
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden shadow-lg">
                <div className="p-5 border-b border-slate-700/50">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FiCalendar className="w-5 h-5 text-indigo-400" />
                    Upcoming Deadlines
                  </h3>
                </div>
                <div className="p-4">
                  {stats.upcomingDueTasks.length > 0 ? (
                    <ul className="space-y-3">
                      {stats.upcomingDueTasks.map(task => (
                        <li key={task._id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                          <div className="flex items-center justify-between">
                            <Link
                              to={`/projects/${projectId}/tasks/${task._id}`}
                              className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                              {task.title}
                            </Link>
                            <span 
                              className={`text-xs px-2 py-0.5 rounded-full ${getDueDateClass(task.dueDate)}`}
                            >
                              {formatDueDate(task.dueDate)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                            {task.description || 'No description'}
                          </p>
                          <div className="flex justify-between items-center mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityClass(task.priority)}`}>
                              {task.priority || 'Medium'}
                            </span>
                            {task.assignedTo && task.assignedTo.length > 0 && (
                              <div className="flex -space-x-2">
                                {task.assignedTo.slice(0, 3).map(user => (
                                  <div 
                                    key={user._id} 
                                    className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center overflow-hidden"
                                    title={user.username}
                                  >
                                    {user.avatar ? (
                                      <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-xs font-semibold text-slate-300">{user.username.charAt(0)}</span>
                                    )}
                                  </div>
                                ))}
                                {task.assignedTo.length > 3 && (
                                  <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center">
                                    <span className="text-xs font-semibold text-slate-300">+{task.assignedTo.length - 3}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-6 text-slate-400">
                      <FiCalendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No upcoming deadlines in the next 7 days</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden shadow-lg">
                <div className="p-5 border-b border-slate-700/50">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FiActivity className="w-5 h-5 text-indigo-400" />
                    Recent Activity
                  </h3>
                </div>
                <div className="p-4">
                  {stats.recentActivities.length > 0 ? (
                    <ul className="space-y-3">
                      {stats.recentActivities.map(activity => (
                        <li key={activity._id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 mr-3">
                              <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                                {activity.user?.avatar ? (
                                  <img
                                    src={activity.user.avatar}
                                    alt={activity.user.username}
                                    className="h-8 w-8 object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-medium text-slate-300">
                                    {activity.user?.username?.charAt(0).toUpperCase() || 'U'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-slate-300">
                                <span className="font-medium text-indigo-400">{activity.user?.username || 'Unknown User'}</span>{' '}
                                {activity.action}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-6 text-slate-400">
                      <FiActivity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <motion.div
            key="tasks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Task Board</h2>
              <div className="flex items-center space-x-2">
                <TaskStatusFilter 
                  activeStatus={taskFilterStatus} 
                  onChange={setTaskFilterStatus} 
                />
              </div>
            </div>

            {filteredTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTasks.map(task => (
                  <TaskCard key={task._id} task={task} projectId={projectId} />
                ))}
              </div>
            ) : (
              <div className="text-center p-10 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <FiTrello className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                <h3 className="text-lg font-medium text-white mb-2">No tasks found</h3>
                <p className="text-slate-400 max-w-md mx-auto mb-6">
                  {taskFilterStatus === 'all' 
                    ? 'This project doesn\'t have any tasks yet. Start by creating a new task or using the AI Task Generator.'
                    : `There are no tasks with "${taskFilterStatus}" status.`}
                </p>
                <div className="flex justify-center space-x-4">
                  <Link
                    to={`/projects/${projectId}/tasks/new`}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Create Task
                  </Link>
                  {taskFilterStatus !== 'all' && (
                    <button
                      onClick={() => setTaskFilterStatus('all')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                    >
                      Show All Tasks
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <motion.div
            key="team"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Team Members</h2>
              <button
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
              >
                <FiUsers className="w-4 h-4" /> Manage Team
              </button>
            </div>

            {projectMembers && projectMembers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectMembers.map(member => (
                  <MemberCard key={member._id || member.user._id} member={member} />
                ))}
              </div>
            ) : (
              <div className="text-center p-10 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <FiUsers className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                <h3 className="text-lg font-medium text-white mb-2">No team members</h3>
                <p className="text-slate-400 mb-6">
                  This project doesn't have any team members yet. Invite people to collaborate.
                </p>
                <button
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                  Invite Members
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Component for displaying a stat card
const StatCard = ({ title, value, subtitle, icon, color }) => (
  <div className={`bg-gradient-to-br ${color} rounded-xl p-4 shadow-lg`}>
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <p className="text-xs font-medium text-white/75 mb-1">{title}</p>
        <div className="flex items-end">
          <h4 className="text-2xl font-bold text-white mr-1">{value}</h4>
          {subtitle && <p className="text-xs text-white/75">{subtitle}</p>}
        </div>
      </div>
      <div className="bg-white/10 rounded-lg p-2.5">
        {icon}
      </div>
    </div>
  </div>
);

// Task card component
const TaskCard = ({ task, projectId }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-slate-800/50 border border-slate-700/30 rounded-xl overflow-hidden shadow-lg"
    >
      <div 
        className={`h-1.5 ${getStatusColor(task.status)}`}
      ></div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <Link
            to={`/projects/${projectId}/tasks/${task._id}`}
            className="text-lg font-medium text-white hover:text-indigo-400 transition-colors"
          >
            {task.title}
          </Link>
          <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityClass(task.priority)}`}>
            {task.priority || 'Medium'}
          </span>
        </div>
        
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">
          {task.description || 'No description provided.'}
        </p>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-slate-700/50 ${getStatusTextColor(task.status)}`}>
              <StatusIcon status={task.status} />
              {task.status || 'To Do'}
            </span>
            
            {task.dueDate && (
              <span className="text-xs text-slate-500 ml-2 flex items-center">
                <FiCalendar className="w-3 h-3 mr-1" />
                {format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}
          </div>
          
          {task.assignedTo && task.assignedTo.length > 0 && (
            <div className="flex -space-x-2">
              {task.assignedTo.slice(0, 3).map(user => (
                <div 
                  key={user._id} 
                  className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center overflow-hidden"
                  title={user.username}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold text-slate-300">{user.username.charAt(0)}</span>
                  )}
                </div>
              ))}
              {task.assignedTo.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center">
                  <span className="text-xs font-semibold text-slate-300">+{task.assignedTo.length - 3}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Member card component
const MemberCard = ({ member }) => {
  // Ensure we're handling both direct user objects and member objects with user property
  const user = member.user || member;
  const role = member.role || 'Member';
  
  return (
    <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-5 shadow-lg">
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden mr-4">
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg font-semibold text-slate-300">{user.username.charAt(0)}</span>
          )}
        </div>
        <div>
          <h4 className="text-white font-medium">{user.username}</h4>
          <p className="text-xs text-slate-400">{user.email}</p>
          <div className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${getRoleClass(role)}`}>
            {role}
          </div>
        </div>
      </div>
    </div>
  );
};

// Task status filter component
const TaskStatusFilter = ({ activeStatus, onChange }) => {
  const statuses = [
    { value: 'all', label: 'All' },
    { value: 'To Do', label: 'To Do' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Blocked', label: 'Blocked' },
    { value: 'Done', label: 'Done' }
  ];
  
  return (
    <div className="flex items-center bg-slate-800/50 rounded-lg p-1">
      {statuses.map(status => (
        <button
          key={status.value}
          className={`px-3 py-1 text-xs rounded-md ${
            activeStatus === status.value
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
          onClick={() => onChange(status.value)}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
};

// Helper function for status icon
const StatusIcon = ({ status }) => {
  switch(status) {
    case 'In Progress':
      return <FiActivity className="w-3 h-3" />;
    case 'Done':
    case 'Completed':
      return <FiCheckCircle className="w-3 h-3" />;
    case 'Blocked':
      return <FiAlertCircle className="w-3 h-3" />;
    default:
      return <FiClock className="w-3 h-3" />;
  }
};

// Helper function for due date formatting and classes
const formatDueDate = (dueDate) => {
  const date = new Date(dueDate);
  const today = new Date();
  const daysDiff = differenceInDays(date, today);
  
  if (daysDiff < 0) {
    return `Overdue by ${Math.abs(daysDiff)} days`;
  } else if (daysDiff === 0) {
    return 'Due today';
  } else if (daysDiff === 1) {
    return 'Due tomorrow';
  } else if (daysDiff <= 7) {
    return `Due in ${daysDiff} days`;
  } else {
    return format(date, 'MMM d');
  }
};

const getDueDateClass = (dueDate) => {
  const date = new Date(dueDate);
  const today = new Date();
  const daysDiff = differenceInDays(date, today);
  
  if (daysDiff < 0) {
    return 'bg-red-900/30 text-red-400';
  } else if (daysDiff === 0) {
    return 'bg-orange-900/30 text-orange-400';
  } else if (daysDiff <= 3) {
    return 'bg-amber-900/30 text-amber-400';
  } else {
    return 'bg-slate-700/50 text-slate-400';
  }
};

// Helper function for priority classes
const getPriorityClass = (priority) => {
  switch (priority) {
    case 'Low':
      return 'bg-green-900/30 text-green-400 border border-green-800/30';
    case 'Medium':
      return 'bg-blue-900/30 text-blue-400 border border-blue-800/30';
    case 'High':
      return 'bg-amber-900/30 text-amber-400 border border-amber-800/30';
    case 'Urgent':
      return 'bg-red-900/30 text-red-400 border border-red-800/30';
    default:
      return 'bg-slate-700/50 text-slate-400 border border-slate-600/30';
  }
};

// Helper function for status colors
const getStatusColor = (status) => {
  switch (status) {
    case 'In Progress':
      return 'bg-blue-500';
    case 'Done':
    case 'Completed':
      return 'bg-green-500';
    case 'Blocked':
      return 'bg-red-500';
    default:
      return 'bg-slate-500';
  }
};

const getStatusTextColor = (status) => {
  switch (status) {
    case 'In Progress':
      return 'text-blue-400';
    case 'Done':
    case 'Completed':
      return 'text-green-400';
    case 'Blocked':
      return 'text-red-400';
    default:
      return 'text-slate-400';
  }
};

// Helper function for role classes
const getRoleClass = (role) => {
  switch (role) {
    case 'Admin':
      return 'bg-red-900/30 text-red-400 border border-red-800/30';
    case 'Contributor':
      return 'bg-blue-900/30 text-blue-400 border border-blue-800/30';
    case 'Viewer':
      return 'bg-slate-700/50 text-slate-400 border border-slate-600/30';
    default:
      return 'bg-slate-700/50 text-slate-400 border border-slate-600/30';
  }
};

// Helper function for progress bar color
const getProgressColor = (percentage) => {
  if (percentage < 30) {
    return 'bg-gradient-to-r from-red-500 to-red-600';
  } else if (percentage < 70) {
    return 'bg-gradient-to-r from-amber-500 to-orange-600';
  } else {
    return 'bg-gradient-to-r from-green-500 to-emerald-600';
  }
};

export default ProjectDashboard;