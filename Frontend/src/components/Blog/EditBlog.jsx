import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../../Config/Axios';
import { FiArrowLeft } from 'react-icons/fi';

const MOCK_BLOG = {
  _id: '1',
  title: 'Understanding React Hooks',
  content: 'React Hooks are a revolutionary feature...',
  tags: ['React', 'JavaScript', 'Web Development'],
  status: 'published',
  thumbnail: {
    url: 'https://example.com/react-hooks.jpg',
    alt: 'React Hooks'
  }
};

const EditBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    status: 'draft',
    thumbnail: { url: '', alt: '' }
  });

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setFormData({
        ...MOCK_BLOG,
        tags: MOCK_BLOG.tags.join(', ')
      });
      setLoading(false);
    }, 500);
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simulate API call
    setTimeout(() => {
      navigate('/blog/posts/understanding-react-hooks');
      setLoading(false);
    }, 500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) return <div className="animate-pulse">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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
        <h2 className="text-2xl font-bold text-indigo-300">Edit Blog</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form fields identical to CreateBlog */}
        // ...existing code from CreateBlog form fields...
      </form>
    </motion.div>
  );
};

export default EditBlog;
