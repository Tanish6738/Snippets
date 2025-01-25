import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiUpload } from 'react-icons/fi';
import { blogService } from '../../services/blog.service';
import { logger } from '../../utils/logger';
import { toast } from 'react-toastify';

const EditBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    status: 'draft',
    thumbnail: { url: '', alt: '' }
  });

  useEffect(() => {
    const initializeBlog = async () => {
      try {
        setLoading(true);
        // If we have state data, use it
        if (location.state?.blog) {
          logger.info('Received blog data from navigation state:', location.state.blog);
          setFormData(location.state.blog);
          setLoading(false);
          return;
        }

        // Otherwise fetch from API
        logger.info('Fetching blog data from API for ID:', id);
        const { blog } = await blogService.getBlogById(id);
        const formattedData = {
          title: blog.title,
          content: blog.content,
          tags: blog.tags.join(', '),
          status: blog.status,
          thumbnail: blog.thumbnail || { url: '', alt: '' }
        };
        logger.info('Received blog data from API:', formattedData);
        setFormData(formattedData);
      } catch (error) {
        setError(error.message || 'Failed to fetch blog');
        logger.error('Failed to fetch blog:', error);
        toast.error('Failed to load blog');
        navigate('/blog');
      } finally {
        setLoading(false);
      }
    };

    initializeBlog();
  }, [id, navigate, location.state]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.content.trim()) newErrors.content = 'Content is required';
    if (formData.title.length > 200) newErrors.title = 'Title must be less than 200 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setSaving(true);
    try {
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      const blogData = {
        ...formData,
        tags
      };

      const response = await blogService.updateBlog(id, blogData);
      toast.success('Blog updated successfully!');
      navigate(`/blog/posts/${response.blog.slug}`);
    } catch (error) {
      logger.error('Failed to update blog:', error);
      toast.error(error.message || 'Failed to update blog');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageLoading(true);
    try {
      const url = await blogService.uploadImage(file);
      setFormData(prev => ({
        ...prev,
        thumbnail: { url, alt: file.name }
      }));
      toast.success('Image uploaded successfully!');
    } catch (error) {
      logger.error('Failed to upload image:', error);
      toast.error('Failed to upload image');
    } finally {
      setImageLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        {error}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/blog')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-indigo-300 
                   hover:bg-indigo-500/10 transition-all"
        >
          <FiArrowLeft />
          Back to Blog
        </button>
        <h2 className="text-2xl font-bold text-indigo-300">Edit Blog</h2>
      </div>

      <motion.form 
        onSubmit={handleSubmit} 
        className="space-y-6 bg-[#0B1120]/50 backdrop-blur-xl rounded-2xl border border-indigo-500/20 p-6"
      >
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-indigo-300 mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-2 rounded-xl bg-[#0B1120]/50 border border-indigo-500/20 
                     focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-indigo-300 mb-1">
            Content
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={6}
            className="w-full px-4 py-2 rounded-xl bg-[#0B1120]/50 border border-indigo-500/20 
                     focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-indigo-300 mb-1">
            Tags (comma separated)
          </label>
          <input
            type="text"
            id="tags"
            value={formData.tags}
            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            className="w-full px-4 py-2 rounded-xl bg-[#0B1120]/50 border border-indigo-500/20 
                     focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-indigo-300 mb-1">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-4 py-2 rounded-xl bg-[#0B1120]/50 border border-indigo-500/20 
                     focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-indigo-300 mb-1">
            Thumbnail
          </label>
          <div className="flex items-center gap-4">
            {formData.thumbnail?.url && (
              <img
                src={formData.thumbnail.url}
                alt={formData.thumbnail.alt}
                className="w-32 h-32 object-cover rounded-xl"
              />
            )}
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl 
                          border border-indigo-500/20 hover:bg-indigo-500/10">
              <FiUpload />
              Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            {imageLoading && <span className="text-sm text-indigo-300">Uploading...</span>}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/blog')}
            className="px-4 py-2 rounded-xl border border-indigo-500/20 hover:bg-indigo-500/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 
                     transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
};

export default EditBlog;
