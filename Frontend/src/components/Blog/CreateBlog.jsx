import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft } from 'react-icons/fi';
import axios from '../../Config/Axios';

const CreateBlog = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    status: 'draft',
    thumbnail: { url: '', alt: '' }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      navigate('/blog/posts/new-blog');
    }, 500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
          Back to Blogs
        </button>
        <h2 className="text-2xl font-bold text-indigo-300">Create New Blog</h2>
      </div>

      <motion.form 
        onSubmit={handleSubmit} 
        className="space-y-6 bg-[#0B1120]/50 backdrop-blur-xl rounded-2xl border border-indigo-500/20 p-6"
      >
        {/* Title Input */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <label className="block text-sm font-medium text-indigo-300 mb-2">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter your blog title"
            className="w-full px-4 py-2 rounded-xl bg-[#0B1120]/50 border border-indigo-500/20
                     focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            required
          />
        </motion.div>

        {/* Content Input */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <label className="block text-sm font-medium text-indigo-300 mb-2">Content</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Write your blog content"
            rows="10"
            className="w-full px-4 py-2 rounded-xl bg-[#0B1120]/50 border border-indigo-500/20
                     focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            required
          />
        </motion.div>

        <div>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="Tags (comma-separated)"
            className="w-full px-4 py-2 rounded-xl bg-[#0B1120]/50 border border-indigo-500/20"
          />
        </div>

        <div>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-xl bg-[#0B1120]/50 border border-indigo-500/20"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div>
          <input
            type="url"
            name="thumbnail"
            value={formData.thumbnail.url}
            onChange={e => setFormData(prev => ({
              ...prev,
              thumbnail: { ...prev.thumbnail, url: e.target.value }
            }))}
            placeholder="Thumbnail URL"
            className="w-full px-4 py-2 rounded-xl bg-[#0B1120]/50 border border-indigo-500/20"
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

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
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 
                     transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Blog'}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
};

export default CreateBlog;
