import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../Context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMenu,
  FiX,
  FiHome,
  FiCode,
  FiActivity,
  FiUser,
  FiLogOut,
  FiSettings,
  FiFolder,
  FiLayers,
  FiStar,
  FiPlus,
  FiTrello,
  FiCheckSquare,
  FiZap,
} from "react-icons/fi";
import AiSnippet from "../Modals/SnippetModals/AiSnippet";

const Navbar = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const dropdownRefs = useRef({});
  const location = useLocation();
  const navigate = useNavigate();

  const isActivePath = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const navCategories = {
    tools: {
      label: "Developer Tools",
      items: [
        { to: "/public", label: "All content", icon: FiLayers },
        { to: "/run-code", label: "Code Runner", icon: FiCode },
        { to: "/scrape", label: "Web Scrapper", icon: FiActivity },
      ],
    },
    media: {
      label: "Media",
      items: [
        { to: "/blog", label: "Blog", icon: FiStar },
        { to: "/blog/create", label: "Create Blog", icon: FiPlus },
        { to: "/create-pdf", label: "Create Pdf", icon: FiFolder },
      ],
    },
    projects: {
      label: "Project Management",
      items: [
        { to: "/projects", label: "All Projects", icon: FiTrello },
        { to: "/projects/new", label: "Create Project", icon: FiPlus },
        { to: "/projects/ai-tasks", label: "AI Task Generator", icon: FiZap },
      ],
    },
  };

  const buttonHoverVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.02 },
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -5 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  const colors = {
    background: "bg-slate-900/75 backdrop-blur-xl",
    border: "border-slate-700/30",
    text: {
      primary: "text-white",
      secondary: "text-slate-400",
      hover: "hover:text-indigo-400",
      muted: "text-slate-500",
    },
    accent: {
      primary: "from-indigo-600 to-purple-600",
      hover: "from-indigo-500 to-purple-500",
      light: "from-indigo-500/10 to-purple-500/10",
      glow: "from-indigo-500/20 to-purple-500/20",
      border: "border-indigo-500/20",
    },
    button: {
      primary: {
        base: "bg-gradient-to-r from-indigo-600 to-purple-600",
        hover: "hover:from-indigo-500 hover:to-purple-500",
        glow: "shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40",
      },
      secondary: {
        base: "bg-slate-800/50",
        hover: "hover:bg-slate-800/70",
        border: "border-slate-700/50 hover:border-slate-600/50",
      },
      hover: "hover:bg-slate-800/50",
    },
    gradient: {
      shimmer: "from-indigo-600/0 via-white/10 to-indigo-600/0",
      overlay: "from-white/20 to-transparent",
    },
  };

  const NavDropdown = ({ category, items, isActive, colors }) => (
    <div
      className="relative group"
      ref={(el) => (dropdownRefs.current[category] = el)}
      onClick={(e) => e.stopPropagation()}
    >
      <motion.button
        variants={buttonHoverVariants}
        initial="initial"
        whileHover="hover"
        className={`px-4 py-2 rounded-xl ${colors.text.secondary} ${colors.text.hover} transition-all duration-200 
                  flex items-center gap-2 text-sm font-medium ${
                    isActive
                      ? `${colors.text.primary} bg-gradient-to-r ${colors.accent.light}`
                      : ""
                  }`}
        onClick={() => setActiveDropdown(isActive ? null : category)}
      >
        {category}
        <motion.svg
          animate={{ rotate: isActive ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </motion.svg>
      </motion.button>

      <AnimatePresence>
        {isActive && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={`absolute top-full left-0 mt-2 py-2 ${colors.background} rounded-xl ${colors.border} 
                      border shadow-lg min-w-[220px] backdrop-blur-xl z-50`}
          >
            {items.map((item) => (
              <motion.div
                key={item.to}
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <Link
                  to={item.to}
                  className={`block px-4 py-2 text-sm ${colors.text.secondary} ${colors.text.hover} transition-all duration-200 
                           flex items-center gap-2 ${
                             isActivePath(item.to)
                               ? `bg-gradient-to-r ${colors.accent.light} ${colors.text.primary}`
                               : ""
                           }`}
                  onClick={() => {
                    setActiveDropdown(null);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSaveAiSnippet = (snippetData) => {
    console.log("Saving AI snippet:", snippetData);
    setIsAiModalOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed top-0 left-0 right-0 z-50 ${colors.background} 
                  ${colors.border} border-b shadow-2xl shadow-black/5 font-['Plus_Jakarta_Sans',sans-serif]`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`md:hidden inline-flex items-center justify-center p-2.5 rounded-xl 
                         ${colors.text.secondary} ${colors.text.hover} ${colors.button.hover} 
                         transition-all duration-300 hover:rotate-90`}
              >
                <span className="sr-only">Open menu</span>
                <FiMenu
                  className={`${isMobileMenuOpen ? "hidden" : "block"} h-6 w-6`}
                />
                <FiX
                  className={`${isMobileMenuOpen ? "block" : "hidden"} h-6 w-6`}
                />
              </button>
              <Link
                to={isAuthenticated ? "/home" : "/"}
                className="flex items-center justify-center space-x-3 group relative"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative z-10"
                >
                  <span
                    className={`text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r 
                                ${colors.accent.primary} bg-clip-text text-transparent
                                transition-all duration-300`}
                  >
                    CodeArc
                  </span>
                  <div
                    className="absolute -inset-x-6 -inset-y-4 z-[-1] bg-gradient-to-r from-indigo-600/20 
                               to-purple-600/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 
                               transition-all duration-300"
                  />
                </motion.div>
                <div className="hidden sm:block">
                  <p
                    className={`text-xs ${colors.text.secondary} font-medium tracking-widest uppercase`}
                  >
                    Code Smarter, Build Faster
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              {isAuthenticated ? (
                <>
                  {/* Home button */}
                  <Link
                    to="/home"
                    className={`px-5 py-2.5 rounded-xl ${colors.text.secondary} ${colors.text.hover}
                              ${colors.button.hover} transition-all duration-300 flex items-center gap-2 
                              text-sm font-medium ${
                                isActivePath("/home")
                                  ? `${colors.text.primary} bg-gradient-to-r ${colors.accent.light}`
                                  : ""
                              }`}
                  >
                    <FiHome className="w-4 h-4" />
                    Home
                  </Link>

                  {/* Nav categories */}
                  {Object.entries(navCategories).map(
                    ([key, { label, items }]) => (
                      <NavDropdown
                        key={key}
                        category={label}
                        items={items}
                        isActive={activeDropdown === label}
                        colors={colors}
                      />
                    )
                  )}

                  {/* AI Snippet Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAiModalOpen(true)}
                    className={`px-6 py-2.5 rounded-xl ${colors.text.primary} ${colors.button.primary.base} 
                              ${colors.button.primary.hover} ${colors.button.primary.glow} transition-all 
                              duration-300 text-sm font-semibold relative group overflow-hidden`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${colors.gradient.shimmer} 
                                  translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000`}
                    />
                    <div
                      className={`absolute inset-0 bg-gradient-to-tr ${colors.gradient.overlay} 
                                  opacity-0 group-hover:opacity-100 transition-all duration-300`}
                    />
                    <span className="relative z-10 flex items-center gap-2">
                      <FiZap className="w-8 h-4" />
                      <div className="flex items-start justify-center">
                        <div> AI</div> <div> Snippet</div>
                      </div>
                    </span>
                  </motion.button>

                  {/* User Profile Dropdown */}
                  <div className="relative ml-3 group">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl ${colors.text.secondary} 
                                ${colors.text.hover} bg-slate-800/50 hover:bg-slate-800/70 transition-all duration-300
                                border border-slate-700/50 hover:border-slate-600/50`}
                    >
                      <FiUser className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {currentUser?.username || currentUser?.name || "User"}
                      </span>
                      <motion.svg
                        animate={{
                          rotate: activeDropdown === "user" ? 180 : 0,
                        }}
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </motion.svg>
                    </motion.button>
                    <div
                      className={`hidden group-hover:block absolute right-0 mt-1 w-48 rounded-xl 
                                   ${colors.background} backdrop-blur-xl ${colors.border} border 
                                   shadow-lg py-1 z-50`}
                    >
                      <Link
                        to="/profile"
                        className={`block px-4 py-2 text-sm ${colors.text.secondary} 
                                                    ${colors.text.hover} transition-colors duration-200 flex items-center gap-2`}
                      >
                        <FiSettings className="w-4 h-4" />
                        Profile
                      </Link>
                      <Link
                        to="/snippets"
                        className={`block px-4 py-2 text-sm ${colors.text.secondary} 
                                                        ${colors.text.hover} transition-colors duration-200 flex items-center gap-2`}
                      >
                        <FiCode className="w-4 h-4" />
                        My Snippets
                      </Link>
                      <Link
                        to="/my-directories"
                        className={`block px-4 py-2 text-sm ${colors.text.secondary} 
                                                        ${colors.text.hover} transition-colors duration-200 flex items-center gap-2`}
                      >
                        <FiFolder className="w-4 h-4" />
                        My Directories
                      </Link>
                      <Link
                        to="/projects"
                        className={`block px-4 py-2 text-sm ${colors.text.secondary} 
                                                          ${colors.text.hover} transition-colors duration-200 flex items-center gap-2`}
                      >
                        <FiTrello className="w-4 h-4" />
                        All Projects
                      </Link>
                      <button
                        onClick={handleLogout}
                        className={`block w-full text-left px-4 py-2 text-sm ${colors.text.secondary} 
                                  ${colors.text.hover} transition-colors duration-200 flex items-center gap-2`}
                      >
                        <FiLogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-4 ml-4">
                  <Link
                    to="/login"
                    className={`${colors.text.secondary} ${colors.text.hover} 
                                              transition-colors duration-300 text-sm font-medium 
                                              hover:translate-x-0.5`}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold ${colors.text.primary} 
                                  ${colors.button.primary.base} ${colors.button.primary.hover} 
                                  ${colors.button.primary.glow} transition-all duration-300 
                                  relative group overflow-hidden`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${colors.gradient.shimmer} 
                                  translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000`}
                    />
                    <div
                      className={`absolute inset-0 bg-gradient-to-tr ${colors.gradient.overlay} 
                                  opacity-0 group-hover:opacity-100 transition-all duration-300`}
                    />
                    <span className="relative z-10">Register</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu with animation */}
        <motion.div
          initial={false}
          animate={{
            height: isMobileMenuOpen ? "90vh" : 0,
            opacity: isMobileMenuOpen ? 1 : 0,
          }}
          transition={{ duration: 0.25 }}
          className={`md:hidden fixed left-0 right-0 top-0 z-50 overflow-hidden ${colors.background} ${colors.border} border-t backdrop-blur-xl`}
        >
          <div className="relative max-w-md w-full mx-auto h-full flex flex-col bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-x border-slate-800/40 shadow-2xl">
            {/* Close button */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800/50">
              <span className="text-lg font-bold text-white">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors duration-200"
                aria-label="Close menu"
              >
                <FiX className="text-2xl" />
              </button>
            </div>
            <div
              className="flex-1 px-4 py-2 space-y-1 overflow-y-auto styled-scrollbar"
              style={{ maxHeight: "calc(90vh - 64px)" }}
            >
              {isAuthenticated ? (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2"
                >
                  <Link
                    to="/home"
                    className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all text-sm font-medium flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FiHome className="w-4 h-4" />
                    Home
                  </Link>
                  {Object.entries(navCategories).map(
                    ([key, { label, items }]) => (
                      <div key={key}>
                        <div className="px-4 py-1 text-xs uppercase text-slate-500 font-medium tracking-wider">
                          {label}
                        </div>
                        <div className="space-y-1 pl-2">
                          {items.map((item) => (
                            <Link
                              key={item.to}
                              to={item.to}
                              className={`px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all text-sm font-medium flex items-center gap-2 ${isActivePath(item.to) ? "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-white" : ""}`}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {item.icon && <item.icon className="w-4 h-4" />}
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                  <button
                    onClick={() => {
                      setIsAiModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all text-sm font-medium flex items-center gap-2"
                  >
                    <FiZap className="w-4 h-4" />
                    AI Snippet
                  </button>
                  <hr className="border-slate-700/30 my-2" />
                  <Link
                    to="/profile"
                    className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all text-sm font-medium flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FiSettings className="w-4 h-4" />
                    Profile
                  </Link>
                  <Link
                    to="/my-snippets"
                    className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all text-sm font-medium flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FiCode className="w-4 h-4" />
                    My Snippets
                  </Link>
                  <Link
                    to="/my-directories"
                    className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all text-sm font-medium flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FiFolder className="w-4 h-4" />
                    My Directories
                  </Link>
                  <Link
                    to="/projects"
                    className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all text-sm font-medium flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FiTrello className="w-4 h-4" />
                    All Projects
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all text-sm font-medium flex items-center gap-2"
                  >
                    <FiLogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-2 p-4"
                >
                  <Link
                    to="/login"
                    className="w-full px-4 py-2 rounded-xl text-center text-slate-300 hover:text-white border border-slate-700/50 transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className={`w-full px-4 py-2 rounded-xl text-center text-white relative group overflow-hidden ${colors.button.primary.base} ${colors.button.primary.hover} ${colors.button.primary.glow} transition-all duration-300`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${colors.gradient.shimmer} translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000`}
                    />
                    <div
                      className={`absolute inset-0 bg-gradient-to-tr ${colors.gradient.overlay} opacity-0 group-hover:opacity-100 transition-all duration-300`}
                    />
                    <span className="relative z-10">Register</span>
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.nav>

      {/* Backdrop for mobile menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* AI Snippet Modal */}
      <AiSnippet
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSaveSnippet={handleSaveAiSnippet}
      />
    </>
  );
};

export default Navbar;
