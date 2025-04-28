import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProjectTasksProvider, useProjectTasks } from '../../Context/ProjectTasksContext';
import { useProject } from '../../Context/ProjectContext';
import { useAuth } from '../../Context/AuthContext';
import { useNotification } from '../../Context/NotificationContext';
import AiTaskGenerator from './AiTaskGenerator';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCalendar, FiFilter, FiPlusCircle, FiAlertCircle, FiActivity, 
  FiClock, FiZap, FiUsers, FiChevronDown, FiCheckCircle, FiXCircle,
  FiRefreshCw, FiEdit, FiArrowUpRight, FiStar, FiCircle
} from 'react-icons/fi';

// Status icons and colors map
const statusConfig = {
  'To Do': { icon: FiCircle, color: 'bg-slate-400', text: 'text-slate-400' },
  'In Progress': { icon: FiActivity, color: 'bg-blue-400', text: 'text-blue-400' },
  'Blocked': { icon: FiAlertCircle, color: 'bg-red-400', text: 'text-red-400' },
  'Done': { icon: FiCheckCircle, color: 'bg-green-400', text: 'text-green-400' }
};

// Priority colors map
const priorityColors = {
  'High': 'text-red-400 border-red-400/30',
  'Medium': 'text-amber-400 border-amber-400/30',
  'Low': 'text-green-400 border-green-400/30'
};

// Task Card Component
const TaskCard = ({ task, onEdit }) => {
  const StatusIcon = statusConfig[task.status]?.icon || FiCircle;
  const statusColor = statusConfig[task.status]?.color || 'bg-slate-400';
  const statusText = statusConfig[task.status]?.text || 'text-slate-400';
  const priorityStyle = priorityColors[task.priority] || 'text-slate-400 border-slate-400/30';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      className="p-4 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-lg"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-slate-100 text-base">{task.title}</h3>
        <div className="flex items-center gap-2">
          {task.priority && (
            <span className={`text-xs px-2 py-0.5 rounded-full bg-transparent border ${priorityStyle}`}>
              {task.priority}
            </span>
          )}
          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-${statusColor}/10 ${statusText}`}>
            <StatusIcon size={10} />
            {task.status}
          </span>
        </div>
      </div>
      
      <p className="text-sm text-slate-400 mb-3 line-clamp-2">{task.description}</p>
      
      <div className="flex flex-wrap gap-2 mt-auto">
        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <FiCalendar size={10} />
            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        )}
        
        {task.assignees && task.assignees.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <FiUsers size={10} />
            <span>{task.assignees.length} assignee{task.assignees.length > 1 ? 's' : ''}</span>
          </div>
        )}
        
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <FiCheckCircle size={10} />
            <span>{task.subtasks.length} subtask{task.subtasks.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
      
      <div className="flex justify-end mt-3">
        <button 
          onClick={() => onEdit(task)}
          className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <FiEdit size={12} />
          Edit
        </button>
      </div>
    </motion.div>
  );
};

// Filter Component
const TaskFilter = ({ filters, setFilters, statuses, priorities }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-800/40 hover:bg-slate-700/40 
                  text-slate-300 rounded-lg border border-slate-700/50 transition-colors"
      >
        <FiFilter size={14} />
        <span className="text-sm font-medium">Filters</span>
        <FiChevronDown 
          size={14} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full mt-2 z-10 bg-slate-900/90 backdrop-blur-xl 
                      border border-slate-700/50 rounded-xl shadow-xl w-60 p-4"
          >
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-400 mb-2">Status</label>
              <div className="space-y-1">
                {statuses.map(status => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="form-checkbox rounded text-indigo-500 focus:ring-0 focus:ring-offset-0 
                               border-slate-600 bg-slate-800"
                      checked={!filters.status.length || filters.status.includes(status)}
                      onChange={() => {
                        if (filters.status.includes(status)) {
                          setFilters({
                            ...filters,
                            status: filters.status.filter(s => s !== status)
                          });
                        } else {
                          setFilters({
                            ...filters,
                            status: [...filters.status, status]
                          });
                        }
                      }}
                    />
                    <span className="text-sm text-slate-300">{status}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-400 mb-2">Priority</label>
              <div className="space-y-1">
                {priorities.map(priority => (
                  <label key={priority} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="form-checkbox rounded text-indigo-500 focus:ring-0 focus:ring-offset-0 
                               border-slate-600 bg-slate-800"
                      checked={!filters.priority.length || filters.priority.includes(priority)}
                      onChange={() => {
                        if (filters.priority.includes(priority)) {
                          setFilters({
                            ...filters,
                            priority: filters.priority.filter(p => p !== priority)
                          });
                        } else {
                          setFilters({
                            ...filters,
                            priority: [...filters.priority, priority]
                          });
                        }
                      }}
                    />
                    <span className="text-sm text-slate-300">{priority}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setFilters({ status: [], priority: [] });
                  setIsOpen(false);
                }}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Reset filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Task List Component with loading and error states
const TaskList = ({ onEdit }) => {
  const { tasks, loading, error, refreshTasks } = useProjectTasks();
  const [filters, setFilters] = useState({ status: [], priority: [] });
  
  // Extract unique statuses and priorities for filters
  const statuses = [...new Set(tasks?.map(task => task.status).filter(Boolean))];
  const priorities = [...new Set(tasks?.map(task => task.priority).filter(Boolean))];
  
  // Apply filters
  const filteredTasks = tasks?.filter(task => {
    // If no status filters, show all; otherwise check if task status is in filters
    const statusMatch = !filters.status.length || filters.status.includes(task.status);
    // If no priority filters, show all; otherwise check if task priority is in filters
    const priorityMatch = !filters.priority.length || filters.priority.includes(task.priority);
    return statusMatch && priorityMatch;
  });
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <FiRefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
        <p className="text-slate-400 text-sm">Loading tasks...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 text-red-300 flex items-center gap-3">
        <FiAlertCircle className="w-6 h-6 flex-shrink-0" />
        <div>
          <h3 className="font-medium">Error loading tasks</h3>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }
  
  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-8 text-center">
        <FiClock className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-slate-300 mb-1">No tasks yet</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Use the AI Task Generator or create tasks manually to start organizing your project.
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-200">Project Tasks</h2>
          <span className="text-xs bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded-full">
            {filteredTasks.length} tasks
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshTasks}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
            aria-label="Refresh tasks"
          >
            <FiRefreshCw size={16} />
          </button>
          <TaskFilter
            filters={filters}
            setFilters={setFilters}
            statuses={statuses}
            priorities={priorities}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map(task => (
          <TaskCard key={task._id} task={task} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
};

// Dashboard Summary Component
const DashboardSummary = ({ projectId }) => {
  const { projectDashboard } = useProject() || {};
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    highPriorityTasks: 0
  });
  
  useEffect(() => {
    // This would be replaced with actual project stats from API
    if (projectDashboard) {
      setStats({
        totalTasks: projectDashboard.totalTasks || 0,
        completedTasks: projectDashboard.completedTasks || 0,
        overdueTasks: projectDashboard.overdueTasks || 0,
        highPriorityTasks: projectDashboard.highPriorityTasks || 0
      });
    }
  }, [projectDashboard]);
  
  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className={`bg-gradient-to-br ${color} p-4 rounded-xl shadow-lg flex flex-col`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-white/75">{label}</span>
        <div className="rounded-full bg-white/10 p-2">
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatCard
        icon={FiCheckCircle}
        label="Total Tasks"
        value={stats.totalTasks}
        color="from-blue-600 to-indigo-700"
      />
      <StatCard
        icon={FiActivity}
        label="Completed"
        value={stats.completedTasks}
        color="from-green-600 to-emerald-700"
      />
      <StatCard
        icon={FiClock}
        label="Overdue"
        value={stats.overdueTasks}
        color="from-red-600 to-rose-700"
      />
      <StatCard
        icon={FiStar}
        label="High Priority"
        value={stats.highPriorityTasks}
        color="from-amber-500 to-orange-700"
      />
    </div>
  );
};

// Main ProjectDashboard Component
const ProjectDashboardContent = ({ projectId }) => {
  const [showAiModal, setShowAiModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const { currentProject, loading: projectLoading } = useProject() || {};
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    if (projectId && !projectLoading) {
      // Load project data if needed
    }
  }, [projectId, projectLoading]);

  const handleEditTask = (task) => {
    setEditingTask(task);
    // Implement task editing modal or navigate to edit page
    addNotification('Task editing will be implemented soon.', 'info');
  };

  if (projectLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <FiRefreshCw className="w-10 h-10 text-indigo-400 animate-spin mb-3" />
        <p className="text-slate-400">Loading project dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-wrap justify-between items-start mb-6 gap-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 mb-1">
            {currentProject?.name || 'Project Dashboard'}
          </h1>
          <p className="text-slate-400 text-sm">
            {currentProject?.description || 'Manage your project tasks efficiently'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/projects/${projectId}/tasks/new`)}
            className="px-4 py-2 bg-slate-800/70 text-slate-300 hover:bg-slate-700/70 border 
                    border-slate-700/50 rounded-xl transition-all duration-200 text-sm font-medium 
                    flex items-center gap-2"
          >
            <FiPlusCircle className="w-4 h-4" />
            Add Task
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAiModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 
                    hover:to-purple-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 
                    transition-all duration-200 text-sm font-medium flex items-center gap-2"
          >
            <FiZap className="w-4 h-4" />
            AI Task Generator
          </motion.button>
        </div>
      </div>
      
      <DashboardSummary projectId={projectId} />
      
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-5 shadow-xl">
        <TaskList onEdit={handleEditTask} />
      </div>
      
      <AiTaskGenerator
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        projectId={projectId}
      />
    </div>
  );
};

// Main component with context providers
const ProjectDashboard = () => {
  const { projectId } = useParams();
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <FiXCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-200 mb-2">Authentication Required</h2>
        <p className="text-slate-400 mb-6">Please log in to access the project dashboard.</p>
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
            className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl"
          >
            Login <FiArrowUpRight className="inline ml-1" />
          </motion.button>
        </div>
      </div>
    );
  }
  
  return (
    <ProjectTasksProvider projectId={projectId}>
      <ProjectDashboardContent projectId={projectId} />
    </ProjectTasksProvider>
  );
};

export default ProjectDashboard;
