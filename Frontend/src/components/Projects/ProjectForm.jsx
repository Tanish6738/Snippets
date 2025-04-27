import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../../Context/ProjectContext';
import { FiSave, FiCalendar, FiX, FiPlus } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { GlassCard } from '../User/Home/Cards';
import LoadingSpinner from '../Common/LoadingSpinner';

const ProjectForm = ({ project, mode = 'create' }) => {
  const navigate = useNavigate();
  const { createNewProject, updateProject, loading } = useProject();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: null,
    priority: 'Medium',
    tags: [],
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && project) {
      setFormData({
        title: project.title || '',
        description: project.description || '',
        deadline: project.deadline ? new Date(project.deadline) : null,
        priority: project.priority || 'Medium',
        tags: project.tags || [],
      });
    }
  }, [project, mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, deadline: date });
    if (errors.deadline) {
      setErrors({ ...errors, deadline: null });
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required';
    }
    return newErrors;
  };

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
        await createNewProject(formData);
      } else {
        await updateProject(project._id, formData);
        navigate(`/projects/${project._id}`);
      }
    } catch (error) {
      console.error('Error saving project:', error);
      setErrors({ submit: error.message || 'Failed to save project' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-2">
      <GlassCard>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-200">
              {mode === 'create' ? 'Create New Project' : 'Edit Project'}
            </h2>
          </div>

          {errors.submit && (
            <div className="bg-red-900/30 border-l-4 border-red-500 p-4 mb-6 rounded-xl">
              <div className="flex">
                <p className="text-sm text-red-300">{errors.submit}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <label htmlFor="title" className="block text-sm font-medium text-slate-300">
                Project Title <span className="text-red-400">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`bg-slate-800/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg block w-full p-2.5 focus:outline-none focus:border-indigo-500 shadow-sm ${errors.title && submitted ? 'border-red-400' : ''}`}
                  placeholder="Enter project title"
                />
                {errors.title && submitted && (
                  <p className="mt-2 text-sm text-red-400">{errors.title}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="description" className="block text-sm font-medium text-slate-300">
                Description
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="bg-slate-800/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg block w-full p-2.5 focus:outline-none focus:border-indigo-500 shadow-sm"
                  placeholder="Project description"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="priority" className="block text-sm font-medium text-slate-300">
                Priority
              </label>
              <div className="mt-1">
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="bg-slate-800/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg block w-full p-2.5 focus:outline-none focus:border-indigo-500 shadow-sm"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="deadline" className="block text-sm font-medium text-slate-300">
                Deadline
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="text-slate-500" />
                </div>
                <DatePicker
                  selected={formData.deadline}
                  onChange={handleDateChange}
                  className="bg-slate-800/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg block w-full pl-10 p-2.5 focus:outline-none focus:border-indigo-500 shadow-sm"
                  placeholderText="Select deadline"
                  dateFormat="MMM d, yyyy"
                />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="tags" className="block text-sm font-medium text-slate-300">
                Tags
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <div className="relative flex flex-grow items-stretch focus-within:z-10">
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
                    className="bg-slate-800/50 border border-slate-700/50 text-slate-200 text-sm rounded-l-lg block w-full p-2.5 focus:outline-none focus:border-indigo-500"
                    placeholder="Add tags and press Enter"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-slate-700/50 text-sm font-medium rounded-r-lg text-slate-200 bg-slate-800/50 hover:bg-slate-700/50"
                >
                  <FiPlus className="h-5 w-5 text-slate-400" />
                  <span>Add</span>
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-slate-700/50 text-slate-200"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-slate-200 focus:outline-none"
                      >
                        <span className="sr-only">Remove {tag}</span>
                        <FiX className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-5">
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="bg-slate-800/50 py-2 px-4 border border-slate-700/50 rounded-lg shadow-sm text-sm font-medium text-slate-300 hover:bg-slate-700/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Saving...</span>
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2 h-4 w-4" />
                    {mode === 'create' ? 'Create Project' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export default ProjectForm;