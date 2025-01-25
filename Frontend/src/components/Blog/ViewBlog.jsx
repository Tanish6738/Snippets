import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiUser, FiCalendar, FiEye, FiMessageCircle, 
         FiEdit, FiTrash, FiHeart, FiBookmark, FiShare2 } from 'react-icons/fi';
import { useUser } from '../../Context/UserContext';
import { blogService } from '../../services/blog.service';
import { logger } from '../../utils/logger';
import { toast } from 'react-toastify';

const ViewBlog = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUser();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const { blog } = await blogService.getBlogBySlug(slug);
        setBlog(blog);
        setIsLiked(blog.likes.includes(user?._id));
      } catch (err) {
        logger.error('Failed to fetch blog:', err);
        setError(err.message || 'Failed to load blog');
        toast.error('Failed to load blog');
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug, user?._id]);

  const handleEdit = () => {
    if (!blog?._id) {
      toast.error('Blog ID not found');
      return;
    }
    
    const editData = {
      title: blog.title,
      content: blog.content,
      tags: blog.tags.join(', '),
      status: blog.status,
      thumbnail: blog.thumbnail || { url: '', alt: '' }
    };
    
    logger.info('Passing blog data to edit:', editData);
    
    navigate(`/blog/edit/${blog._id}`, {
      state: { blog: editData }
    });
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    
    try {
      await blogService.deleteBlog(blog._id);
      toast.success('Blog deleted successfully');
      navigate('/blog');
    } catch (err) {
      logger.error('Failed to delete blog:', err);
      toast.error(err.message || 'Failed to delete blog');
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.info('Please log in to like posts');
      return;
    }

    try {
      const response = await blogService.toggleLike(blog._id);
      setIsLiked(response.isLiked);
      setBlog(prev => ({
        ...prev,
        likes: response.likes
      }));
      toast.success(response.message);
    } catch (err) {
      logger.error('Failed to toggle like:', err);
      toast.error('Failed to update like status');
    }
  };

  const handleBookmark = () => {
    if (!isAuthenticated) {
      toast.info('Please log in to bookmark posts');
      return;
    }
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
    // TODO: Implement bookmark API
  };

  const handleShare = () => {
    setShareModalOpen(true);
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
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => navigate('/blog')}
          className="px-4 py-2 bg-indigo-500 rounded-xl hover:bg-indigo-600"
        >
          Back to Blogs
        </button>
      </div>
    );
  }

  if (!blog) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/blog')}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-indigo-300 
                   hover:bg-indigo-500/10 transition-all text-sm"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Blogs
        </button>
      </div>

      {/* Main Content */}
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0B1120]/50 backdrop-blur-xl rounded-2xl border border-indigo-500/20 
                   overflow-hidden shadow-lg shadow-indigo-500/10"
      >
        {/* Thumbnail */}
        {blog.thumbnail?.url && (
          <div className="relative w-full h-48 sm:h-64 md:h-72 lg:h-96">
            <img
              src={blog.thumbnail.url}
              alt={blog.thumbnail.alt || blog.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r 
                         from-white to-indigo-200 bg-clip-text text-transparent">
              {blog.title}
            </h1>
            
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
                className="px-2 py-1 text-xs rounded-full bg-indigo-500/20 text-indigo-300
                         border border-indigo-500/30"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Content */}
          <div className="prose prose-invert prose-indigo max-w-none 
                        prose-p:text-indigo-200/80 prose-headings:text-white
                        prose-a:text-indigo-400 hover:prose-a:text-indigo-300">
            {blog.content}
          </div>
        </div>
      </motion.article>

      {/* Footer Actions */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#0B1120]/90 backdrop-blur-xl 
                      border-t border-indigo-500/20 py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 ${
                  isLiked ? 'text-red-400' : 'text-indigo-400'
                } hover:text-indigo-300`}
              >
                <FiHeart className={isLiked ? 'fill-current' : ''} />
                <span>{blog.likes?.length || 0}</span>
              </button>
              <button className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300">
                <FiMessageCircle />
                <span>{blog.comments?.length || 0}</span>
              </button>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleBookmark}
                className={`${
                  isBookmarked ? 'text-yellow-400' : 'text-indigo-400'
                } hover:text-yellow-300`}
              >
                <FiBookmark className={isBookmarked ? 'fill-current' : ''} />
              </button>
              <button
                onClick={handleShare}
                className="text-indigo-400 hover:text-indigo-300"
              >
                <FiShare2 />
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Share Modal */}
      {shareModalOpen && (
        <ShareModal blog={blog} onClose={() => setShareModalOpen(false)} />
      )}
    </motion.div>
  );
};

export default ViewBlog;
