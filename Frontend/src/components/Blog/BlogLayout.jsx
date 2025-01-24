import React, { useState, useEffect } from 'react';
import { Link, Outlet, useParams, Routes, Route, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiCalendar, FiEye, FiMessageCircle, FiHeart, 
         FiEdit, FiFilter, FiSearch, FiChevronLeft, FiTag, 
         FiTrendingUp, FiClock, FiStar, FiShare2, FiBookmark, FiTwitter, FiLinkedin } from 'react-icons/fi';
import { useUser } from '../../Context/UserContext';
import axios from '../../Config/Axios';
import ViewBlog from './ViewBlog';
import CreateBlog from './CreateBlog';
import EditBlog from './EditBlog';

// Static category data
const CATEGORIES = [
  { icon: <FiTrendingUp />, label: "Trending", count: 5 },
  { icon: <FiClock />, label: "Recent", count: 12 },
  { icon: <FiStar />, label: "Featured", count: 3 },
  { icon: <FiTag />, label: "JavaScript", count: 8 },
  { icon: <FiTag />, label: "React", count: 6 },
  { icon: <FiTag />, label: "Node.js", count: 4 },
];

// Static blog data
const STATIC_BLOGS = [
  {
    _id: '1',
    title: 'Getting Started with React 18',
    slug: 'getting-started-with-react-18',
    content: 'React 18 introduces several exciting features including automatic batching, concurrent rendering...',
    author: { _id: '1', username: 'John Doe' },
    createdAt: '2024-01-15T10:00:00Z',
    metadata: { views: 1234 },
    comments: [
      { _id: '1', text: 'Great article!', author: 'Alice' },
      { _id: '2', text: 'Very helpful', author: 'Bob' }
    ],
    tags: ['React', 'JavaScript', 'Web Development'],
    thumbnail: {
      url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
      alt: 'React Code'
    },
    likes: ['user1', 'user2'],
    bookmarks: ['user3']
  },
  // ... add more static blogs here ...
];

// Main Layout Component
const BlogLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#030712] text-white pt-16"> {/* Added pt-16 for navbar space */}
      <BlogHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="relative">
        {/* Mobile Sidebar with improved animation */}
        <motion.div
          initial={false}
          animate={{
            x: sidebarOpen ? 0 : '-100%',
          }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed inset-y-0 left-0 w-[280px] z-40 md:hidden"
        >
          <BlogSidebar 
            onClose={() => setSidebarOpen(false)}
            isCollapsed={isLeftSidebarCollapsed}
            onToggleCollapse={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
          />
        </motion.div>

        {/* Backdrop */}
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="container mx-auto px-4 py-4 md:py-8">
          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <motion.div 
              className="hidden md:block"
              animate={{ 
                width: isLeftSidebarCollapsed ? '60px' : '280px',
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="sticky top-20">
                <BlogSidebar 
                  isCollapsed={isLeftSidebarCollapsed}
                  onToggleCollapse={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
                />
              </div>
            </motion.div>

            {/* Main Content */}
            <main className="flex-1 min-w-0 overflow-hidden">
              <Routes>
                <Route index element={<BlogList />} />
                <Route path="create" element={<CreateBlog />} />
                <Route path="edit/:id" element={<EditBlog />} />
                <Route path="posts/:slug" element={<ViewBlog />} />
              </Routes>
            </main>

            {/* Right Sidebar */}
            <motion.div 
              className="hidden lg:block"
              animate={{ 
                width: isRightSidebarCollapsed ? '60px' : '300px',
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="sticky top-20">
                <BlogRightSidebar 
                  isCollapsed={isRightSidebarCollapsed}
                  onToggleCollapse={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Header Component with improved mobile design
const BlogHeader = ({ onMenuClick }) => {
  return (
    // <header className="sticky top-16 z-20 bg-[#0B1120]/90 backdrop-blur-xl border-b border-indigo-500/20">
    //   <div className="container mx-auto px-4">
    //     <div className="flex items-center justify-between h-14">
    //       <div className="flex items-center gap-4">
    //         <button
    //           onClick={onMenuClick}
    //           className="md:hidden p-2 rounded-lg text-indigo-300 hover:bg-indigo-500/10"
    //         >
    //           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    //           </svg>
    //         </button>
            
    //       </div>
    //     </div>
    //   </div>
    // </header>
    <>
    </>
  );
};

// Sidebar Components
const BlogSidebar = ({ onClose, isCollapsed, onToggleCollapse }) => {
  return (
    <motion.div
      className="bg-[#0B1120]/50 backdrop-blur-xl rounded-2xl border border-indigo-500/20 
                 shadow-lg shadow-indigo-500/10 h-full relative"
    >
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-4 p-1.5 rounded-full bg-indigo-500 text-white
                   hover:bg-indigo-600 transition-colors z-10"
      >
        <FiChevronLeft className={`transform transition-transform duration-300 
                                 ${isCollapsed ? 'rotate-180' : ''}`} />
      </button>

      <div className={`p-4 ${isCollapsed ? 'hidden' : 'block'}`}>
        {/* Existing sidebar content */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-indigo-300">Categories</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-2 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-all"
            >
              <FiChevronLeft className="w-6 h-6" />
            </button>
          )}
        </div>
        
        <nav className="space-y-2">
          {CATEGORIES.map((category, index) => (
            <SidebarLink 
              key={index}
              icon={category.icon}
              label={!isCollapsed && category.label}
              count={!isCollapsed && category.count}
            />
          ))}
        </nav>
      </div>

      {/* Collapsed View */}
      <div className={`p-4 ${isCollapsed ? 'block' : 'hidden'}`}>
        {CATEGORIES.map((category, index) => (
          <div key={index} className="mb-4 flex justify-center">
            <span className="text-indigo-300 hover:text-indigo-200 cursor-pointer">
              {category.icon}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Update SidebarLink with hover effects
const SidebarLink = ({ icon, label, count }) => (
  <a
    href="#"
    className="flex items-center justify-between px-4 py-2 rounded-xl text-indigo-300 
               hover:text-indigo-200 hover:bg-indigo-500/10 transition-all duration-300 group"
  >
    <div className="flex items-center gap-3">
      <span className="group-hover:scale-110 transition-transform duration-300">
        {icon}
      </span>
      <span>{label}</span>
    </div>
    {count && (
      <span className="px-2 py-1 text-xs rounded-full bg-indigo-500/20 text-indigo-300 
                     group-hover:bg-indigo-500/30 transition-all duration-300">
        {count}
      </span>
    )}
  </a>
);

// Blog List Component
const BlogList = () => {
  const [blogs, setBlogs] = useState(STATIC_BLOGS);
  const [loading, setLoading] = useState(false);
  const [activeModals, setActiveModals] = useState({
    share: null,
    comment: null
  });

  const handleLike = (blogId) => {
    setBlogs(blogs.map(blog => {
      if (blog._id === blogId) {
        const liked = blog.likes.includes('currentUser');
        return {
          ...blog,
          likes: liked 
            ? blog.likes.filter(id => id !== 'currentUser')
            : [...blog.likes, 'currentUser']
        };
      }
      return blog;
    }));
  };

  const handleBookmark = (blogId) => {
    setBlogs(blogs.map(blog => {
      if (blog._id === blogId) {
        const bookmarked = blog.bookmarks.includes('currentUser');
        return {
          ...blog,
          bookmarks: bookmarked
            ? blog.bookmarks.filter(id => id !== 'currentUser')
            : [...blog.bookmarks, 'currentUser']
        };
      }
      return blog;
    }));
  };

  return (
    <>
      {/* Add a container for better content width control */}
      <div className="max-w-[1400px] mx-auto">
        {/* Blog header section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Latest Articles</h1>
          <p className="text-indigo-300">Discover the latest insights and tutorials</p>
        </div>

        {/* Blog grid with responsive columns */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-6"
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(300px, 1fr))`,
            maxWidth: '100%',
          }}
        >
          {blogs.map(blog => (
            <BlogCard key={blog._id} blog={blog} />
          ))}
        </motion.div>
      </div>

      {/* ...existing modals... */}
    </>
  );
};

// Update BlogCard to be more responsive
const BlogCard = ({ blog }) => {
  const isLiked = blog.likes.includes('currentUser');
  const isBookmarked = blog.bookmarks.includes('currentUser');

  return (
    <motion.div
      whileHover={{ scale: 1.02, translateY: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-[#0B1120]/50 backdrop-blur-xl rounded-xl border border-indigo-500/20 
                 overflow-hidden shadow-lg shadow-indigo-500/10 transition-all duration-300
                 hover:shadow-xl hover:shadow-indigo-500/20 hover:border-indigo-500/30
                 flex flex-col h-full"
    >
      {blog.thumbnail?.url && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={blog.thumbnail.url}
            alt={blog.thumbnail.alt || blog.title}
            className="w-full h-full object-cover transition-transform duration-300
                     hover:scale-105"
          />
        </div>
      )}

      <div className="p-5 flex flex-col flex-grow">
        <Link to={`/blog/posts/${blog.slug}`}>
          <h2 className="text-lg font-semibold bg-gradient-to-r from-white to-indigo-200 
                        bg-clip-text text-transparent hover:from-indigo-200 hover:to-white 
                        transition-all mb-3 line-clamp-2">
            {blog.title}
          </h2>
        </Link>

        <div className="flex flex-wrap items-center gap-3 text-xs text-indigo-400 mb-3">
          <span className="flex items-center gap-1">
            <FiUser size={12} />
            {blog.author.username}
          </span>
          <span className="flex items-center gap-1">
            <FiCalendar size={12} />
            {new Date(blog.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {blog.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded-full bg-indigo-500/10 text-indigo-300 
                       border border-indigo-500/20"
            >
              {tag}
            </span>
          ))}
        </div>

        <p className="text-sm text-indigo-200/70 line-clamp-3 mb-4 flex-grow">
          {blog.content.substring(0, 120)}...
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-indigo-500/20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleLike(blog._id)}
              className={`flex items-center gap-1.5 text-sm ${
                isLiked ? 'text-red-400' : 'text-indigo-400'
              } hover:text-red-300`}
            >
              <FiHeart className={isLiked ? 'fill-current' : ''} size={14} />
              <span>{blog.likes.length}</span>
            </button>
            
            <span className="flex items-center gap-1.5 text-sm text-indigo-400">
              <FiMessageCircle size={14} />
              <span>{blog.comments.length}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleBookmark(blog._id)}
              className={`${
                isBookmarked ? 'text-yellow-400' : 'text-indigo-400'
              } hover:text-yellow-300`}
            >
              <FiBookmark className={isBookmarked ? 'fill-current' : ''} size={14} />
            </button>
            
            <button
              className="text-indigo-400 hover:text-indigo-300"
            >
              <FiShare2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Modal Components
const ShareModal = ({ isOpen, onClose, blog }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0B1120] border border-indigo-500/20 rounded-2xl p-6 w-[400px]">
        <h3 className="text-xl font-bold mb-4">Share Blog</h3>
        <div className="flex gap-4 justify-center mb-4">
          <button className="p-3 rounded-full bg-blue-500/20 text-blue-300 hover:bg-blue-500/30">
            <FiTwitter size={20} />
          </button>
          <button className="p-3 rounded-full bg-blue-600/20 text-blue-300 hover:bg-blue-600/30">
            <FiLinkedin size={20} />
          </button>
          <button className="p-3 rounded-full bg-green-500/20 text-green-300 hover:bg-green-500/30">
            <FiShare2 size={20} />
          </button>
        </div>
        <input 
          type="text" 
          value={`https://yourblog.com/posts/${blog.slug}`}
          className="w-full px-4 py-2 bg-[#0B1120]/50 border border-indigo-500/20 rounded-xl mb-4"
          readOnly
        />
        <button 
          onClick={onClose}
          className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Blog Detail Component
const BlogDetail = () => {
  const { slug } = useParams();
  const { isAuthenticated, user } = useUser();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const { data } = await axios.get(`/api/blogs/${slug}`);
        setBlog(data.blog);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-[#0B1120]/50 backdrop-blur-xl rounded-2xl border border-indigo-500/20 
                     overflow-hidden shadow-lg shadow-indigo-500/10">
        {blog.thumbnail?.url && (
          <img
            src={blog.thumbnail.url}
            alt={blog.thumbnail.alt || blog.title}
            className="w-full h-64 object-cover"
          />
        )}

        <div className="p-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-indigo-200 
                        bg-clip-text text-transparent mb-4">
            {blog.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-indigo-400 mb-4">
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
              {blog.metadata.views}
            </span>
            <span className="flex items-center gap-2">
              <FiMessageCircle size={14} />
              {blog.comments.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {blog.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 text-xs rounded-full bg-indigo-500/20 text-indigo-300 
                         border border-indigo-500/30"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="prose prose-indigo prose-sm text-indigo-200/80">
            {blog.content}
          </div>
        </div>
      </div>

      <BlogFooter
        blog={blog}
        onLike={() => console.log('Liked')}
        onComment={() => console.log('Commented')}
        onShare={() => console.log('Shared')}
        onBookmark={() => console.log('Bookmarked')}
      />
    </div>
  );
};

// Blog Footer Component
const BlogFooter = ({ blog, onLike, onComment, onShare, onBookmark }) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-[#0B1120]/90 backdrop-blur-xl border-t border-indigo-500/20 py-4">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <button
              onClick={onLike}
              className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
            >
              <FiHeart />
              <span>{blog.likes.length}</span>
            </button>
            <button
              onClick={onComment}
              className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
            >
              <FiMessageCircle />
              <span>{blog.comments.length}</span>
            </button>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onBookmark}
              className="text-indigo-400 hover:text-indigo-300"
            >
              <FiBookmark />
            </button>
            <button
              onClick={onShare}
              className="text-indigo-400 hover:text-indigo-300"
            >
              <FiShare2 />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Add new BlogRightSidebar component
const BlogRightSidebar = ({ isCollapsed, onToggleCollapse }) => {
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    // TODO: Implement search functionality
  };

  const handleCreate = () => {
    navigate('/blog/create');
  };

  return (
    <motion.div
      className="bg-[#0B1120]/50 backdrop-blur-xl rounded-2xl border border-indigo-500/20 
                 shadow-lg shadow-indigo-500/10 relative h-full"
    >
      <button
        onClick={onToggleCollapse}
        className="absolute -left-3 top-4 p-1.5 rounded-full bg-indigo-500 text-white
                   hover:bg-indigo-600 transition-colors z-10"
      >
        <FiChevronLeft className={`transform transition-transform duration-300 
                                 ${!isCollapsed ? 'rotate-180' : ''}`} />
      </button>

      <div className={`p-4 ${isCollapsed ? 'hidden' : 'block'}`}>
        {/* Search Section */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search blogs..."
              className="w-full px-4 py-2 pl-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 
                     text-sm placeholder:text-indigo-400/60"
            />
            <FiSearch className="absolute left-3 top-2.5 text-indigo-400/50" size={16} />
          </div>
        </div>

        {/* Create Blog Button */}
        {isAuthenticated && (
          <button
            onClick={handleCreate}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl 
                     bg-indigo-500 hover:bg-indigo-600 transition-colors text-white"
          >
            <FiEdit size={16} />
            Create New Blog
          </button>
        )}

        {/* Quick Stats */}
        <div className="mt-6 space-y-4">
          <h3 className="text-sm font-medium text-indigo-300">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <div className="text-2xl font-bold text-indigo-300">12</div>
              <div className="text-xs text-indigo-400">Your Posts</div>
            </div>
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <div className="text-2xl font-bold text-indigo-300">48</div>
              <div className="text-xs text-indigo-400">Total Views</div>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsed View */}
      <div className={`p-4 ${isCollapsed ? 'block' : 'hidden'}`}>
        <div className="flex flex-col items-center space-y-4">
          <button className="p-2 rounded-lg hover:bg-indigo-500/10">
            <FiSearch className="text-indigo-300 hover:text-indigo-200" size={20} />
          </button>
          {isAuthenticated && (
            <button 
              onClick={handleCreate}
              className="p-2 rounded-lg hover:bg-indigo-500/10"
            >
              <FiEdit className="text-indigo-300 hover:text-indigo-200" size={20} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default BlogLayout;
