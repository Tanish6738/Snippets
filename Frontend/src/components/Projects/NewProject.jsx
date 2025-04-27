import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../../Context/ProjectContext';
import { FiCalendar, FiFlag, FiTag, FiSave, FiArrowLeft } from 'react-icons/fi';
import LoadingSpinner from '../Common/LoadingSpinner';

const NewProject = () => {
  const { createNewProject, loading } = useProject();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'Medium',
    tags: []
  });
  
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      
      // Don't add duplicate tags
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData({
          ...formData,
          tags: [...formData.tags, tagInput.trim()]
        });
      }
      
      setTagInput('');
    }
  };
  
  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await createNewProject(formData);
      // Navigation will happen in the createNewProject function
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center text-gray-600 mb-6 hover:text-gray-800"
        >
          <FiArrowLeft className="mr-2" /> Back to Projects
        </button>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Project</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit}>
            {/* Project Title */}
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Project Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`bg-gray-50 border ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                } text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5`}
                placeholder="Enter project title"
              />
              {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
            </div>
            
            {/* Project Description */}
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                placeholder="Enter project description"
              />
            </div>
            
            {/* Project Deadline */}
            <div className="mb-4">
              <label htmlFor="deadline" className=" text-sm font-medium text-gray-700 mb-1 flex items-center">
                <FiCalendar className="mr-2" /> Deadline
              </label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500  w-full p-2.5"
              />
            </div>
            
            {/* Project Priority */}
            <div className="mb-4">
              <label htmlFor="priority" className=" text-sm font-medium text-gray-700 mb-1 flex items-center">
                <FiFlag className="mr-2" /> Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            
            {/* Project Tags */}
            <div className="mb-6">
              <label htmlFor="tags" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                <FiTag className="mr-2" /> Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1.5 text-gray-500 hover:text-gray-800"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <input
                  type="text"
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                  placeholder="Add tags (press Enter after each tag)"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Press Enter to add a tag</p>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg flex items-center px-5 py-2.5 transition duration-150"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Creating...</span>
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2" /> Create Project
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewProject;