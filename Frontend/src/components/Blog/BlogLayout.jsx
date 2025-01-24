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
          <BlogSidebar onClose={() => setSidebarOpen(false)} />
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
            <div className="hidden md:block w-[280px] sticky top-20">
              <BlogSidebar />
            </div>

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
            <div className="hidden lg:block w-[300px] sticky top-20">
              <BlogRightSidebar />
            </div>
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
const BlogSidebar = ({ onClose }) => {
  return (
    <motion.div
      className="bg-[#0B1120]/50 backdrop-blur-xl rounded-2xl border border-indigo-500/20 
                 shadow-lg shadow-indigo-500/10 h-full"
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-indigo-300">Categories</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-all"
          >
            <FiChevronLeft className={`transform transition-transform duration-300`} />
          </button>
        </div>

        <nav className="space-y-2">
          {CATEGORIES.map((category, index) => (
            <SidebarLink 
              key={index}
              icon={category.icon}
              label={category.label}
              count={category.count}
            />
          ))}
        </nav>

        {/* Popular Tags Section */}
        <div className="mt-8">
          <h3 className="text-md font-semibold text-indigo-300 mb-4">Popular Tags</h3>
          <div className="flex flex-wrap gap-2">
            {['React', 'JavaScript', 'Node.js', 'TypeScript', 'CSS'].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs rounded-full bg-indigo-500/20 text-indigo-300 
                         border border-indigo-500/30 cursor-pointer hover:bg-indigo-500/30 
                         transition-all duration-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
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

  // Update BlogCard to include interactive elements
  const BlogCard = ({ blog }) => {
    const isLiked = blog.likes.includes('currentUser');
    const isBookmarked = blog.bookmarks.includes('currentUser');

    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="bg-[#0B1120]/50 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-indigo-500/20 
                   overflow-hidden shadow-lg shadow-indigo-500/10 transition-all duration-300"
      >
        {blog.thumbnail?.url && (
          <img
            src={blog.thumbnail.url}
            alt={blog.thumbnail.alt || blog.title}
            className="w-full h-48 object-cover"
          />
        )}

        <div className="p-6">
          <Link to={`/blog/posts/${blog.slug}`}>
            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 
                          bg-clip-text text-transparent hover:from-indigo-200 hover:to-white 
                          transition-all mb-2">
              {blog.title}
            </h2>
          </Link>

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

          <p className="text-indigo-200/80 line-clamp-3 mb-4">
            {blog.content.substring(0, 150)}...
          </p>

          <Link
            to={`/blog/posts/${blog.slug}`}
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 
                     transition-colors"
          >
            Read More
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        <div className="flex justify-between items-center p-4 border-t border-indigo-500/20">
          <div className="flex gap-4">
            <button
              onClick={() => handleLike(blog._id)}
              className={`flex items-center gap-2 ${
                isLiked ? 'text-red-400' : 'text-indigo-400'
              } hover:text-red-300`}
            >
              <FiHeart className={isLiked ? 'fill-current' : ''} />
              <span>{blog.likes.length}</span>
            </button>
            
            <button
              onClick={() => setActiveModals({ ...activeModals, comment: blog._id })}
              className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
            >
              <FiMessageCircle />
              <span>{blog.comments.length}</span>
            </button>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handleBookmark(blog._id)}
              className={`${
                isBookmarked ? 'text-yellow-400' : 'text-indigo-400'
              } hover:text-yellow-300`}
            >
              <FiBookmark className={isBookmarked ? 'fill-current' : ''} />
            </button>
            
            <button
              onClick={() => setActiveModals({ ...activeModals, share: blog._id })}
              className="text-indigo-400 hover:text-indigo-300"
            >
              <FiShare2 />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
      >
        {blogs.map(blog => (
          <BlogCard key={blog._id} blog={blog} />
        ))}
      </motion.div>

      {/* Modals */}
      <ShareModal 
        isOpen={!!activeModals.share}
        onClose={() => setActiveModals({ ...activeModals, share: null })}
        blog={blogs.find(b => b._id === activeModals.share)}
      />
    </>
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
const BlogRightSidebar = () => {
  const { isAuthenticated } = useUser();

  return (
    <div className="bg-[#0B1120]/50 backdrop-blur-xl rounded-2xl border border-indigo-500/20 
                   shadow-lg shadow-indigo-500/10 p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search blogs..."
          className="w-full px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 
                   text-sm placeholder:text-indigo-400/60"
        />
        <FiSearch className="absolute right-3 top-3 text-indigo-400/50" />
      </div>

      {/* Write Blog Button */}
      {isAuthenticated && (
        <Link
          to="/blog/create"
          className="flex items-center justify-center gap-2 px-4 py-2 w-full rounded-xl text-white 
                   bg-gradient-to-r from-indigo-500 to-violet-500 text-sm hover:from-indigo-600 
                   hover:to-violet-600 transition-all"
        >
          <FiEdit className="w-4 h-4" />
          Write Blog
        </Link>
      )}

      {/* Recent Posts */}
      <div className="mt-6">
        <h3 className="text-md font-semibold text-indigo-300 mb-4">Recent Posts</h3>
        <div className="space-y-3">
          {STATIC_BLOGS.slice(0, 3).map(blog => (
            <Link
              key={blog._id}
              to={`/blog/posts/${blog.slug}`}
              className="block group"
            >
              <h4 className="text-sm text-indigo-300 group-hover:text-indigo-200 line-clamp-2">
                {blog.title}
              </h4>
              <p className="text-xs text-indigo-400 mt-1">
                {new Date(blog.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogLayout;
