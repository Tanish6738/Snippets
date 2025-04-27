import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../../Context/ProjectContext';
import { FiPlus, FiX, FiSave, FiArrowLeft, FiCalendar, FiAlertCircle } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import LoadingSpinner from '../Common/LoadingSpinner';

const TaskForm = ({ projectId, task, mode = 'create', members = [] }) => {
  const navigate = useNavigate();
  const { createTask, updateTask, loading } = useProject();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Not Started',
    priority: 'Medium',
    assignedTo: '',
    dueDate: null,
    tags: [],
  });
  
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  
  // Load task data when editing
  useEffect(() => {
    if (mode === 'edit' && task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'Not Started',
        priority: task.priority || 'Medium',
        assignedTo: task.assignedTo?._id || '',
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        tags: task.tags || [],
      });
    }
  }, [task, mode]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };
  
  // Handle date change
  const handleDateChange = (date) => {
    setFormData({ ...formData, dueDate: date });
    if (errors.dueDate) {
      setErrors({ ...errors, dueDate: null });
    }
  };
  
  // Handle tag addition
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };
  
  // Handle tag removal
  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };
  
  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }
    
    return newErrors;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      if (mode === 'create') {
        await createTask(projectId, formData);
      } else {
        await updateTask(projectId, task._id, formData);
      }
      navigate(`/projects/${projectId}`);
    } catch (error) {
      console.error('Error saving task:', error);
      setErrors({ submit: error.message || 'Failed to save task' });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <form onSubmit={handleSubmit}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Create New Task' : 'Edit Task'}
          </h2>
          <button
            type="button"
            onClick={() => navigate(`/projects/${projectId}`)}
            className="text-gray-600 hover:text-gray-900 flex items-center"
          >
            <FiArrowLeft className="mr-2" /> Back to Project
          </button>
        </div>
        
        {errors.submit && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex items-center">
              <FiAlertCircle className="text-red-500 mr-3" />
              <p className="text-red-700">{errors.submit}</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`bg-white border ${
                errors.title && submitted ? 'border-red-500' : 'border-gray-300'
              } text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5`}
              placeholder="Enter task title"
            />
            {errors.title && submitted && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
          </div>
          
          <div className="lg:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="Enter task description"
            ></textarea>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
              Assignee
            </label>
            <select
              id="assignedTo"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
            >
              <option value="">Unassigned</option>
              {members.map(member => (
                <option key={member.user._id} value={member.user._id}>
                  {member.user.username} ({member.role})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FiCalendar className="text-gray-400" />
              </div>
              <DatePicker
                selected={formData.dueDate}
                onChange={handleDateChange}
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2.5"
                placeholderText="Select a date"
                dateFormat="MMM d, yyyy"
              />
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex items-center">
              <input
                type="text"
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-grow bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2.5"
                placeholder="Add tags and press Enter"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="ml-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg flex items-center px-3 py-2.5"
              >
                <FiPlus />
              </button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1.5 rounded flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1.5 text-gray-500 hover:text-gray-700"
                    >
                      <FiX size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={() => navigate(`/projects/${projectId}`)}
            className="mr-3 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg flex items-center px-5 py-2.5 transition duration-150"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Saving...</span>
              </>
            ) : (
              <>
                <FiSave className="mr-2" /> Save Task
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;