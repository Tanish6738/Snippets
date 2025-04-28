import React, { useState, useEffect } from 'react';
import { useProject } from '../../Context/ProjectContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, FiZap, FiPlus, FiCheckCircle, FiAlertTriangle, 
  FiFlag, FiCalendar, FiCheckSquare, FiClock, FiCircle,
  FiLoader, FiAlertCircle, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import { format } from 'date-fns';

const AiTaskGenerator = ({ isOpen, onClose, standalone = false }) => {
  const { projects, currentProject, generateTasks, addGeneratedTasksToProject, aiGeneratedTasks, loading } = useProject();
  
  const [projectId, setProjectId] = useState(currentProject?._id || '');
  const [description, setDescription] = useState('');
  const [generatingTasks, setGeneratingTasks] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [taskDetailExpanded, setTaskDetailExpanded] = useState({});
  
  // Synchronize projectId with currentProject
  useEffect(() => {
    if (currentProject?._id && !standalone) {
      setProjectId(currentProject._id);
    }
  }, [currentProject, standalone]);
  
  // Reset state when modal is reopened
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess('');
      setSelectedTasks([]);
      setTaskDetailExpanded({});
    }
  }, [isOpen]);
  
  // Pre-select all tasks when they're generated
  useEffect(() => {
    if (aiGeneratedTasks && aiGeneratedTasks.length > 0) {
      setSelectedTasks(aiGeneratedTasks.map(task => task._id || task.tempId));
      
      // Initialize expanded state
      const expanded = {};
      aiGeneratedTasks.forEach(task => {
        expanded[task._id || task.tempId] = false;
      });
      setTaskDetailExpanded(expanded);
    }
  }, [aiGeneratedTasks]);
  
  const handleGenerateTasks = async () => {
    // Validation
    if (!projectId) {
      setError('Please select a project');
      return;
    }
    
    if (!description.trim()) {
      setError('Please enter a project description');
      return;
    }
    
    setError(null);
    setSuccess('');
    setGeneratingTasks(true);
    
    try {
      await generateTasks(description);
      setSuccess('Tasks generated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to generate tasks. Please try again.');
      console.error('Error generating tasks:', err);
    } finally {
      setGeneratingTasks(false);
    }
  };
  
  const handleAddTasksToProject = async () => {
    if (!selectedTasks.length) {
      setError('Please select at least one task to add');
      return;
    }
    
    setError(null);
    
    try {
      // Filter only selected tasks
      const tasksToAdd = aiGeneratedTasks.filter(
        task => selectedTasks.includes(task._id || task.tempId)
      );
      
      await addGeneratedTasksToProject(projectId, tasksToAdd);
      setSuccess('Tasks added to project successfully!');
      
      // Clear selections after adding
      setTimeout(() => {
        if (onClose && !standalone) onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to add tasks to project');
      console.error('Error adding tasks to project:', err);
    }
  };
  
  const toggleTaskSelection = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };
  
  const toggleTaskDetail = (taskId) => {
    setTaskDetailExpanded(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };
  
  const toggleAllTasks = () => {
    if (!aiGeneratedTasks) return;
    
    if (selectedTasks.length === aiGeneratedTasks.length) {
      // Deselect all
      setSelectedTasks([]);
    } else {
      // Select all
      setSelectedTasks(aiGeneratedTasks.map(task => task._id || task.tempId));
    }
  };
  
  // Variants for animations
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };
  
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };
  
  // Helper to get priority badge class
  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-amber-900/30 text-amber-400 border border-amber-800/30';
      case 'medium':
        return 'bg-blue-900/30 text-blue-400 border border-blue-800/30';
      case 'low':
        return 'bg-green-900/30 text-green-400 border border-green-800/30';
      case 'urgent':
        return 'bg-red-900/30 text-red-400 border border-red-800/30';
      default:
        return 'bg-slate-700/50 text-slate-400 border border-slate-600/30';
    }
  };
  
  const renderContent = () => (
    <div className="space-y-6">
      {/* Project Selection - Only show in standalone mode */}
      {standalone && (
        <div>
          <label htmlFor="project" className="block text-sm font-medium text-slate-400 mb-2">
            Select Project
          </label>
          <div className="relative">
            <select
              id="project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={`bg-slate-800/50 border ${
                error && !projectId ? 'border-red-500/50' : 'border-slate-600/30'
              } text-white text-sm rounded-xl w-full p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
              disabled={generatingTasks || loading}
            >
              <option value="">Select a project</option>
              {projects?.map(project => (
                <option key={project._id} value={project._id}>
                  {project.name || project.title}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <FiChevronDown className="text-slate-500" />
            </div>
          </div>
          {error && !projectId && (
            <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
              <FiAlertCircle className="w-3.5 h-3.5" /> {error}
            </p>
          )}
        </div>
      )}
      
      {/* Description Input */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-400 mb-2">
          Project Description or Task Needs
        </label>
        <textarea
          id="description"
          className={`bg-slate-800/50 border ${
            error && !description.trim() ? 'border-red-500/50' : 'border-slate-600/30'
          } text-white text-sm rounded-xl w-full p-3 h-32 focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
          placeholder="Describe your project or specific task needs in detail. For example: 'Create a user authentication system with login, registration, password reset, and email verification features.'"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={generatingTasks || loading}
        />
        {error && !description.trim() && (
          <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
            <FiAlertCircle className="w-3.5 h-3.5" /> {error}
          </p>
        )}
      </div>
      
      {/* Generate Button */}
      {!aiGeneratedTasks && (
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerateTasks}
            disabled={generatingTasks || loading || !description.trim() || (!projectId && standalone)}
            className={`bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 
                      text-white font-medium py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/20 
                      flex items-center gap-2 ${
                        generatingTasks || loading || !description.trim() || (!projectId && standalone) 
                          ? 'opacity-70 cursor-not-allowed' 
                          : ''
                      }`}
          >
            {generatingTasks ? (
              <>
                <FiLoader className="w-5 h-5 animate-spin" />
                Generating Tasks...
              </>
            ) : (
              <>
                <FiZap className="w-5 h-5" />
                Generate AI Tasks
              </>
            )}
          </motion.button>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-900/30 border border-red-800/30 rounded-xl text-red-400 flex items-start gap-3"
        >
          <FiAlertTriangle className="w-5 h-5 mt-0.5" />
          <div>{error}</div>
        </motion.div>
      )}
      
      {/* Success Message */}
      {success && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-900/30 border border-green-800/30 rounded-xl text-green-400 flex items-start gap-3"
        >
          <FiCheckCircle className="w-5 h-5 mt-0.5" />
          <div>{success}</div>
        </motion.div>
      )}
      
      {/* Generated Tasks */}
      {aiGeneratedTasks && aiGeneratedTasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-white">Generated Tasks</h3>
            <button 
              onClick={toggleAllTasks}
              className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              {selectedTasks.length === aiGeneratedTasks.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          <div className="space-y-3">
            {aiGeneratedTasks.map((task) => {
              const taskId = task._id || task.tempId;
              const isSelected = selectedTasks.includes(taskId);
              const isExpanded = taskDetailExpanded[taskId];
              
              return (
                <motion.div 
                  key={taskId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border ${
                    isSelected ? 'border-indigo-500/50 bg-indigo-900/10' : 'border-slate-700/30 bg-slate-800/30'
                  } rounded-xl overflow-hidden transition-colors`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <button
                          onClick={() => toggleTaskSelection(taskId)}
                          className={`w-5 h-5 rounded-md flex items-center justify-center ${
                            isSelected 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                          } transition-colors`}
                        >
                          {isSelected ? <FiCheckSquare className="w-4 h-4" /> : <FiCircle className="w-3 h-3" />}
                        </button>
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <h4 className={`font-medium ${isSelected ? 'text-indigo-400' : 'text-white'} transition-colors`}>
                            {task.title || task.name}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityClass(task.priority)}`}>
                              {task.priority || 'Medium'}
                            </span>
                            <button
                              onClick={() => toggleTaskDetail(taskId)}
                              className="p-1 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700/70 rounded-md transition-colors"
                            >
                              {isExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                          {task.description || 'No description provided'}
                        </p>
                        
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-3 pt-3 border-t border-slate-700/30 space-y-3"
                            >
                              {/* Task Details */}
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-xs text-slate-500 mb-1">Estimated Effort</p>
                                  <p className="text-sm text-slate-300 flex items-center gap-1">
                                    <FiClock className="w-3.5 h-3.5" />
                                    {task.estimatedTime || task.estimatedHours || '2-4 hours'}
                                  </p>
                                </div>
                                
                                {task.dueDate && (
                                  <div>
                                    <p className="text-xs text-slate-500 mb-1">Suggested Deadline</p>
                                    <p className="text-sm text-slate-300 flex items-center gap-1">
                                      <FiCalendar className="w-3.5 h-3.5" />
                                      {format(new Date(task.dueDate), 'MMM d, yyyy')}
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              {/* Subtasks if available */}
                              {task.subtasks && task.subtasks.length > 0 && (
                                <div>
                                  <p className="text-xs text-slate-500 mb-2">Subtasks</p>
                                  <ul className="space-y-2">
                                    {task.subtasks.map((subtask, index) => (
                                      <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                                        <FiCheckSquare className="w-3.5 h-3.5 mt-0.5 text-indigo-400" />
                                        <span>{subtask.title || subtask.name || subtask}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {/* Dependencies if available */}
                              {task.dependencies && task.dependencies.length > 0 && (
                                <div>
                                  <p className="text-xs text-slate-500 mb-2">Dependencies</p>
                                  <ul className="space-y-2">
                                    {task.dependencies.map((dep, index) => (
                                      <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                                        <FiFlag className="w-3.5 h-3.5 mt-0.5 text-amber-400" />
                                        <span>{dep.title || dep}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {/* Add to Project Button */}
          <div className="flex justify-center pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddTasksToProject}
              disabled={loading || selectedTasks.length === 0}
              className={`bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 
                        text-white font-medium py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/20 
                        flex items-center gap-2 ${loading || selectedTasks.length === 0 ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <FiLoader className="w-5 h-5 animate-spin" />
                  Adding Tasks...
                </>
              ) : (
                <>
                  <FiPlus className="w-5 h-5" />
                  Add {selectedTasks.length} {selectedTasks.length === 1 ? 'Task' : 'Tasks'} to Project
                </>
              )}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
  
  // For standalone mode
  if (standalone) {
    return (
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <FiZap className="w-5 h-5 text-indigo-400" />
          AI Task Generator
        </h2>
        {renderContent()}
      </div>
    );
  }
  
  // For modal mode
  return isOpen ? (
    <AnimatePresence>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={backdropVariants}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={modalVariants}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <FiZap className="text-indigo-400" />
              AI Task Generator
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
              aria-label="Close"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
            {renderContent()}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  ) : null;
};

export default AiTaskGenerator;
