import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiUser, FiCalendar, FiEye, FiMessageCircle, FiEdit, FiTrash } from 'react-icons/fi';
import { useUser } from '../../Context/UserContext';

const MOCK_BLOG = {
  _id: '1',
  title: 'Understanding React Hooks',
  content: 'React Hooks are a revolutionary feature that enables function components to have state and side effects...',
  author: {
    _id: '1',
    username: 'John Doe'
  },
  createdAt: new Date().toISOString(),
  metadata: { views: 1234 },
  comments: [],
  tags: ['React', 'JavaScript', 'Web Development'],
  thumbnail: {
    url: 'https://example.com/react-hooks.jpg',
    alt: 'React Hooks Illustration'
  }
};

const ViewBlog = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setBlog(MOCK_BLOG);
      setLoading(false);
    }, 500);
  }, [slug]);

  const handleEdit = () => {
    navigate(`/blog/edit/${blog._id}`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    
    try {
      // Simulate delete
      navigate('/blog');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="animate-pulse">Loading...</div>;
  if (!blog) return <div>Blog not found</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <div className="mb-6">
        <button
          onClick={() => navigate('/blog')}
          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-indigo-300 
                   hover:bg-indigo-500/10 transition-all text-sm sm:text-base"
        >
          <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          Back to Blogs
        </button>
      </div>

      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0B1120]/50 backdrop-blur-xl rounded-2xl border border-indigo-500/20 overflow-hidden"
      >
        {blog.thumbnail?.url && (
          <div className="relative w-full h-48 sm:h-64 md:h-72 lg:h-96">
            <img
              src={blog.thumbnail.url}
              alt={blog.thumbnail.alt || blog.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{blog.title}</h1>
            {user?._id === blog.author._id && (
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
                >
                  <FiEdit />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30"
                >
                  <FiTrash />
                </button>
              </div>
            )}
          </div>

          {/* Meta Information */}
          <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-indigo-400 mb-6">
            <span className="flex items-center gap-2">
              <FiUser size={14} />
              {blog.author.username}
            </span>
            <span className="flex items-center gap-2">
              <FiCalendar size={14} />
              {new Date(blog.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-2">
              <FiEye size={14} />
              {blog.metadata.views} views
            </span>
            <span className="flex items-center gap-2">
              <FiMessageCircle size={14} />
              {blog.comments.length} comments
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {blog.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 sm:px-3 text-xs rounded-full bg-indigo-500/20 text-indigo-300
                         hover:bg-indigo-500/30 transition-all cursor-pointer"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Content */}
          <div className="prose prose-invert prose-indigo max-w-none 
                        prose-sm sm:prose-base lg:prose-lg
                        prose-p:text-indigo-200/80
                        prose-headings:text-white
                        prose-a:text-indigo-400 hover:prose-a:text-indigo-300">
            {blog.content}
          </div>
        </div>
      </motion.article>
    </motion.div>
  );
};

export default ViewBlog;
