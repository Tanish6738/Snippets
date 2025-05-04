import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../Context/UserContext";
import axios from "../../Config/Axios";
import { motion } from "framer-motion";
import {
  FiCode,
  FiUsers,
  FiFolder,
  FiPlus,
  FiZap,
} from "react-icons/fi";

// Add global style for scrollbars
import "./scrollbar.css";

// Import Components
import { TopBar, DashboardTabs, Container, LoadingSpinner } from "./Home/HComponents";
// Import Modals
import CreateSnippetModal from "../Modals/SnippetModals/CreateSnippetModal";
import BulkCreateSnippetModal from "../Modals/SnippetModals/BulkCreateSnippetModal";
import ViewSnippetModal from "../Modals/SnippetModals/ViewSnippetModal";
import ExportSnippetModal from "../Modals/SnippetModals/ExportSnippetModal";
import ShareLinkModal from "../Modals/ShareLinkModal";
import ViewGroupDetailsModal from "../Modals/GroupModals/ViewGroupDetailsModal";
import CreateGroupModal from "../Modals/GroupModals/CreateGroupModal";
import ViewDirectoryDetailsModal from "../Modals/DirectoryModals/ViewDirectoryDetailsModal";
import CreateDirectoryModal from "../Modals/DirectoryModals/CreateDirectoryModal";
import EditDirectoryDetails from "../Modals/DirectoryModals/EditDirectoryDetails";
import ExportDirectoryModal from "../Modals/DirectoryModals/ExportDirectoryModal";
import EditSnippetDetailsModal from "../Modals/SnippetModals/EditSnippetDetailsModal";
import {
  DirectoryCard,
  GlassCard,
  SnippetCard,
  GroupCard,
  StatCard,
  IconButton,
  Button,
  QuickActionButton,
} from "./Home/Cards";

const Home = () => {
  const { isAuthenticated, user } = useUser();
  const [recentSnippets, setRecentSnippets] = useState([]);
  const [featuredDirectories, setFeaturedDirectories] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("overview");
  const [recentGroups, setRecentGroups] = useState([]);
  const [joinedGroups, setJoinedGroups] = useState([]);
  const [createdGroups, setCreatedGroups] = useState([]);
  const [userDirectories, setUserDirectories] = useState([]);
  const [directoryModalStates, setDirectoryModalStates] = useState({
    view: false,
    create: false,
    edit: false,
    export: false,
  });
  const [selectedDirectoryId, setSelectedDirectoryId] = useState(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [bulkCreateModalOpen, setBulkCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedSnippetId, setSelectedSnippetId] = useState(null);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState(null);

  const navigate = useNavigate();

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError("");
      const timestamp = Date.now();
      const headers = { "Cache-Control": "no-cache", Pragma: "no-cache" };

      if (!isAuthenticated || !user?._id) {
        setRecentSnippets([]);
        setFeaturedDirectories([]);
        setCreatedGroups([]);
        setJoinedGroups([]);
        setUserDirectories([]);
        return;
      }

      const params = { _t: timestamp, userId: user._id };

      const [
        snippetsRes,
        directoriesRes,
        groupsRes,
        activitiesRes,
        joinedGroupsRes,
        userDirectoriesRes,
      ] = await Promise.all([
        axios.get("/api/snippets/user/snippets", {
          params: { ...params, limit: 5, sort: "-createdAt" },
          headers,
        }),
        axios.get("/api/directories/user/directories", {
          params: { ...params, limit: 4 },
          headers,
        }),
        axios.get("/api/groups", {
          params: { ...params, created: true, limit: 3 },
          headers,
        }),
        axios.get("/api/activities/user", { params, headers }),
        axios.get("/api/groups/joined", { params: { limit: 3 }, headers }),
        axios.get("/api/directories", {
          params: { userId: user._id, limit: 3 },
          headers,
        }),
      ]);

      setRecentSnippets(
        snippetsRes.data.snippets?.filter(
          (snippet) =>
            snippet.createdBy._id === user._id ||
            snippet.sharedWith?.some((share) => share.entity === user._id)
        ) || []
      );

      setFeaturedDirectories(
        directoriesRes.data.directories?.filter(
          (directory) =>
            directory.createdBy === user._id ||
            directory.sharedWith?.some((share) => share.entity === user._id)
        ) || []
      );

      setCreatedGroups(
        groupsRes.data.groups?.filter(
          (group) => group.createdBy === user._id
        ) || []
      );
      setJoinedGroups(joinedGroupsRes.data || []);
      setUserDirectories(
        userDirectoriesRes.data.directories?.filter(
          (directory) =>
            directory.createdBy === user._id ||
            directory.sharedWith?.some((share) => share.entity === user._id)
        ) || []
      );

      if (isAuthenticated) {
        const userStats = {
          totalSnippets: snippetsRes.data.total || 0,
          totalGroups: groupsRes.data.total || 0,
          joinedGroups: joinedGroupsRes.data.length || 0,
          recentActivities: activitiesRes.data.activities || [],
        };
        setUserStats(userStats);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
      console.error("Error fetching home data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, [isAuthenticated]);

  const handleViewSnippet = (snippetId) => {
    setSelectedSnippetId(snippetId);
    setViewModalOpen(true);
  };

  const handleExportSnippet = (snippetId) => {
    setSelectedSnippetId(snippetId);
    setExportModalOpen(true);
  };

  const handleShareSnippet = (snippetId) => {
    setSelectedSnippetId(snippetId);
    setShareModalOpen(true);
  };

  const handleSnippetCreated = async () => {
    await fetchHomeData();
  };

  const handleBulkSnippetsCreated = () => {
    fetchHomeData();
  };

  const handleGroupCreated = async () => {
    await fetchHomeData();
    setCreateGroupModalOpen(false);
  };

  const handleDirectoryCreated = async () => {
    await fetchHomeData();
    setDirectoryModalStates((prev) => ({ ...prev, create: false }));
  };

  const handleDirectoryUpdated = async () => {
    await fetchHomeData();
    setDirectoryModalStates((prev) => ({ ...prev, edit: false }));
    setSelectedDirectoryId(null);
  };

  const handleEditSnippet = (snippetId) => {
    setViewModalOpen(false);
    const snippet = recentSnippets.find((s) => s._id === snippetId);
    if (snippet) {
      setSelectedSnippet(snippet);
      setEditModalOpen(true);
    } else {
      console.error("Snippet not found:", snippetId);
    }
  };

  const handleSnippetUpdated = async () => {
    await fetchHomeData();
    setEditModalOpen(false);
    setSelectedSnippet(null);
  };

  const handleViewDirectory = (directory) => {
    setLoading(true);
    try {
      navigate("/directories", {
        state: {
          selectedDirectory: directory,
          directoryDetails: {
            id: directory._id,
            name: directory.name,
            path: directory.path,
            metadata: directory.metadata,
            snippets: directory.snippets || [],
            children: directory.children || [],
          },
        },
      });
    } catch (error) {
      setError("Failed to open directory");
      console.error("Directory navigation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewGroup = (group) => {
    if (!group?._id) {
      console.error("No group ID available");
      return;
    }
    try {
      navigate(`/groups/${group._id}`, { state: { groupDetails: group } });
    } catch (error) {
      console.error("Error navigating to group:", error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <TopBar user={user} />
      <main className="pt-2 pb-20 md:pb-0">
        <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === "overview" && (
          <>
            {/* Hero Section */}
            <div className="relative bg-gradient-to-b from-slate-900/50 to-slate-950/50 z-[25] overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-gradient-to-br from-slate-600/10 to-slate-700/10 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-gradient-to-tr from-slate-500/10 to-slate-600/10 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000" />
              </div>

              <Container className="relative z-10 py-12 md:py-20">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-3xl mx-auto text-center"
                >
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="inline-block mb-6 px-6 py-2 rounded-full bg-gradient-to-r from-slate-700/10 to-slate-800/10 border border-slate-700/20 relative group"
                  >
                    <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-slate-500/0 to-slate-600/0 group-hover:from-slate-500/20 group-hover:to-slate-600/20 transition-all duration-300"></div>
                    <span className="text-sm text-slate-400 relative z-10">
                      Welcome to Your Workspace
                    </span>
                  </motion.div>

                  <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-100 bg-clip-text text-transparent">
                    {isAuthenticated
                      ? `Welcome back, ${user?.username || 'User'}`
                      : "Your Code Universe"}
                  </h1>

                  <p className="text-lg text-slate-300/80 font-light max-w-2xl mx-auto mb-12">
                    Organize, share, and discover code snippets in a modern,
                    intuitive workspace designed for developers.
                  </p>

                  <div className="flex flex-wrap justify-center gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCreateModalOpen(true)}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 text-white font-medium hover:from-slate-600 hover:to-slate-700 transition-all duration-200 shadow-lg shadow-slate-900/25 relative group"
                    >
                      <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-slate-500/0 to-slate-600/0 group-hover:from-slate-500/20 group-hover:to-slate-600/20 transition-all duration-300"></div>
                      <FiPlus className="inline-block mr-2 relative z-10" /> 
                      <span className="relative z-10">New Snippet</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        setDirectoryModalStates((prev) => ({
                          ...prev,
                          create: true,
                        }))
                      }
                      className="px-6 py-3 rounded-xl bg-slate-800/50 text-slate-300 font-medium hover:bg-slate-800/70 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200 relative group"
                    >
                      <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-slate-500/0 to-slate-600/0 group-hover:from-slate-500/20 group-hover:to-slate-600/20 transition-all duration-300"></div>
                      <FiFolder className="inline-block mr-2 relative z-10" /> 
                      <span className="relative z-10">Create Directory</span>
                    </motion.button>
                  </div>
                </motion.div>
              </Container>
            </div>

            {/* Stats Section */}
            <Container className="-mt-8 md:-mt-16 relative z-[26]">
              {isAuthenticated && userStats && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10 max-w-[1120px] mx-auto"
                >
                  <StatCard
                    title="Total Snippets"
                    value={userStats.totalSnippets}
                    icon={<FiCode />}
                    trend={12}
                    gradient="from-slate-700/20 to-slate-800/20"
                  />
                  <StatCard
                    title="Created Groups"
                    value={userStats.totalGroups}
                    icon={<FiUsers />}
                    trend={8}
                    gradient="from-slate-700/20 to-slate-800/20"
                  />
                  <StatCard
                    title="Joined Groups"
                    value={userStats.joinedGroups}
                    icon={<FiUsers />}
                    trend={5}
                    gradient="from-slate-700/20 to-slate-800/20"
                  />
                  <StatCard
                    title="Recent Activities"
                    value={userStats.recentActivities.length}
                    icon={<FiZap />}
                    trend={15}
                    gradient="from-slate-700/20 to-slate-800/20"
                  />
                </motion.div>
              )}

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1120px] mx-auto">
                <div className="lg:col-span-8">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-slate-900/50 to-slate-950/50 rounded-2xl border border-slate-700/30 shadow-2xl shadow-black/[0.1] overflow-hidden relative group">
                    <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-slate-500/0 to-slate-600/0 group-hover:from-slate-500/10 group-hover:to-slate-600/10 transition-all duration-300"></div>
                    {/* Enhanced Header */}
                    <div className="relative z-10 px-6 pt-6 pb-4 border-b border-slate-700/30 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-slate-500 to-slate-600 opacity-70 blur-sm group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center ring-1 ring-slate-700/50 group-hover:ring-slate-600/50 transition-all duration-300">
                            <FiCode className="text-lg text-slate-400 group-hover:text-slate-300 transition-colors duration-300" />
                          </div>
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white">Recent Snippets</h2>
                          <p className="text-sm text-slate-400 mt-0.5">Your code collection</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setCreateModalOpen(true)}
                          className="flex items-center gap-2 py-2 px-4 rounded-lg bg-gradient-to-r from-slate-700 to-slate-800 text-white text-sm font-medium hover:from-slate-600 hover:to-slate-700 transition-all duration-200 shadow-lg shadow-slate-900/20 relative group"
                        >
                          <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-slate-500/0 to-slate-600/0 group-hover:from-slate-500/20 group-hover:to-slate-600/20 transition-all duration-300"></div>
                          <FiPlus className="text-slate-300 relative z-10" /> 
                          <span className="relative z-10">New</span>
                        </motion.button>
                      </div>
                    </div>
                    
                    {/* Snippets container */}
                    <div className="relative z-10 p-6">
                      {recentSnippets.length > 0 ? (
                        <div className="space-y-5">
                          <div className="flex items-center justify-between pb-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                              <span className="text-sm font-medium text-slate-400">Most Recent</span>
                            </div>
                            <div className="text-xs text-slate-400">
                              {recentSnippets.length} snippets
                            </div>
                          </div>
                          
                          <div className="grid gap-4">
                            {recentSnippets.map((snippet) => (
                              <SnippetCard
                                key={snippet._id}
                                snippet={snippet}
                                onView={() => handleViewSnippet(snippet._id)}
                                onEdit={() => handleEditSnippet(snippet._id)}
                                onShare={() => handleShareSnippet(snippet._id)}
                              />
                            ))}
                          </div>
                          
                          {recentSnippets.length >= 5 && (
                            <div className="pt-2 flex justify-center">
                              <motion.button
                                whileHover={{ scale: 1.03, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                className="group flex items-center gap-2 py-2.5 px-5 rounded-xl bg-slate-800/50 text-slate-300 text-sm font-medium border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 shadow-lg shadow-black/20"
                              >
                                <span>View All Snippets</span>
                                <div className="w-5 h-5 rounded-full bg-slate-700/50 flex items-center justify-center group-hover:bg-slate-700/70 transition-colors duration-300">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                  </svg>
                                </div>
                              </motion.button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-16 text-center">
                          <div className="relative w-24 h-24 mx-auto mb-6">
                            <div className="absolute inset-0 bg-slate-500/10 rounded-full animate-pulse"></div>
                            <div className="absolute inset-2 bg-gradient-to-br from-slate-500/20 to-slate-600/20 rounded-full"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <FiCode className="text-4xl text-slate-400" />
                            </div>
                          </div>
                          <h3 className="text-xl font-medium text-white mb-2">No snippets yet</h3>
                          <p className="text-slate-400 max-w-md mx-auto mb-8">
                            Create your first code snippet to start organizing your personal code library
                          </p>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setCreateModalOpen(true)}
                            className="inline-flex items-center gap-3 py-3.5 px-7 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 text-white font-medium hover:from-slate-600 hover:to-slate-700 transition-all duration-300 shadow-xl shadow-slate-900/30"
                          >
                            <FiPlus className="text-xl" /> 
                            <span>Create First Snippet</span>
                          </motion.button>
                          
                          <div className="mt-10 pt-8 border-t border-slate-800/50">
                            <h4 className="text-sm font-medium text-slate-400 mb-4">How to get started:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
                              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                                <div className="inline-block p-2 rounded-lg bg-slate-500/10 text-slate-400 mb-2">1</div>
                                <p className="text-sm text-slate-300">Create a snippet with your commonly used code</p>
                              </div>
                              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                                <div className="inline-block p-2 rounded-lg bg-slate-600/10 text-slate-500 mb-2">2</div>
                                <p className="text-sm text-slate-300">Organize snippets into directories</p>
                              </div>
                              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                                <div className="inline-block p-2 rounded-lg bg-slate-700/10 text-slate-600 mb-2">3</div>
                                <p className="text-sm text-slate-300">Share with teammates or keep private</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                  {/* Quick Actions Card */}
                  <GlassCard title="Quick Actions" icon={<FiZap />}>
                    <div className="grid grid-cols-1 gap-3">
                      <QuickActionButton
                        icon={<FiPlus />}
                        title="New Snippet"
                        description="Create a code snippet"
                        onClick={() => setCreateModalOpen(true)}
                        gradientFrom="from-slate-700"
                        gradientTo="to-slate-800"
                      />
                      <QuickActionButton
                        icon={<FiFolder />}
                        title="New Directory"
                        description="Organize your snippets"
                        onClick={() => setDirectoryModalStates(prev => ({ ...prev, create: true }))}
                        gradientFrom="from-slate-800"
                        gradientTo="to-slate-900"
                      />
                    </div>
                  </GlassCard>

                  {/* Featured Directories Card */}
                  <GlassCard
                    title="Featured Directories"
                    icon={<FiFolder />}
                    action={
                      <Button
                        onClick={() =>
                          setDirectoryModalStates((prev) => ({
                            ...prev,
                            create: true,
                          }))
                        }
                      >
                        <FiPlus className="mr-1" /> New
                      </Button>
                    }
                  >
                    <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 styled-scrollbar">
                      {featuredDirectories.length > 0 ? (
                        featuredDirectories.map((directory) => (
                          <DirectoryCard
                            key={directory._id}
                            directory={directory}
                            onView={() => handleViewDirectory(directory)}
                          />
                        ))
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-slate-400">
                            No directories yet. Create your first one!
                          </p>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </div>
              </div>
            </Container>
          </>
        )}

        {activeTab === "snippets" && (
          <Container className="py-8">
            <GlassCard title="Recent Snippets" icon={<FiCode />}>
              <div className="space-y-4">
                {recentSnippets.length > 0 ? (
                  recentSnippets.map((snippet) => (
                    <SnippetCard
                      key={snippet._id}
                      snippet={snippet}
                      onView={() => handleViewSnippet(snippet._id)}
                      onEdit={() => handleEditSnippet(snippet._id)}
                      onShare={() => handleShareSnippet(snippet._id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-slate-400/60 mb-4">No snippets found</p>
                    <Button onClick={() => setCreateModalOpen(true)}>
                      <FiPlus className="mr-1" /> Create Snippet
                    </Button>
                  </div>
                )}
              </div>
            </GlassCard>
          </Container>
        )}

        {activeTab === "directories" && (
          <div className="container mx-auto px-4 lg:px-8 relative z-[25] bg-[#030014]/50 py-8">
            <GlassCard title="Featured Directories" icon={<FiFolder />}>
              {featuredDirectories.map((directory) => (
                <DirectoryCard
                  key={directory._id}
                  directory={directory}
                  onView={() => handleViewDirectory(directory)}
                />
              ))}
            </GlassCard>
          </div>
        )}

        {activeTab === "groups" && (
          <div className="container mx-auto px-4 lg:px-8 relative z-[25] bg-[#030014]/50 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <GlassCard
                title="My Groups"
                icon={<FiUsers />}
                action={
                  <Button onClick={() => setCreateGroupModalOpen(true)}>
                    <FiPlus /> New Group
                  </Button>
                }
              >
                {createdGroups.map((group) => (
                  <GroupCard
                    key={group._id}
                    group={group}
                    onView={() => handleViewGroup(group)}
                  />
                ))}
              </GlassCard>
              <GlassCard title="Joined Groups" icon={<FiUsers />}>
                {joinedGroups.map((group) => (
                  <GroupCard
                    key={group._id}
                    group={group}
                    onView={() => handleViewGroup(group)}
                    isJoined
                  />
                ))}
              </GlassCard>
            </motion.div>
          </div>
        )}
      </main>

      <CreateSnippetModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSnippetCreated={handleSnippetCreated}
        defaultValues={{
          visibility: user?.preferences?.defaultSnippetVisibility || "private",
        }}
      />
      <BulkCreateSnippetModal
        isOpen={bulkCreateModalOpen}
        onClose={() => setBulkCreateModalOpen(false)}
        onSnippetsCreated={handleBulkSnippetsCreated}
      />
      <ViewSnippetModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        snippetId={selectedSnippetId}
        onEdit={handleEditSnippet}
      />
      <ExportSnippetModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        itemId={selectedSnippetId}
        itemType="snippet"
      />
      <ShareLinkModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        itemId={selectedSnippetId}
        itemType="snippet"
      />
      {createGroupModalOpen && (
        <CreateGroupModal
          isOpen={createGroupModalOpen}
          onClose={() => setCreateGroupModalOpen(false)}
          onGroupCreated={handleGroupCreated}
          defaultValues={{
            settings: { joinPolicy: "invite", visibility: "private" },
          }}
        />
      )}
      <ViewDirectoryDetailsModal
        isOpen={directoryModalStates.view}
        onClose={() => {
          setDirectoryModalStates((prev) => ({ ...prev, view: false }));
          setSelectedDirectoryId(null);
        }}
        directoryId={selectedDirectoryId}
      />
      <CreateDirectoryModal
        isOpen={directoryModalStates.create}
        onClose={() =>
          setDirectoryModalStates((prev) => ({ ...prev, create: false }))
        }
        onDirectoryCreated={handleDirectoryCreated}
        defaultValues={{ visibility: "private" }}
      />
      <EditDirectoryDetails
        isOpen={directoryModalStates.edit}
        onClose={() => {
          setDirectoryModalStates((prev) => ({ ...prev, edit: false }));
          setSelectedDirectoryId(null);
        }}
        directoryId={selectedDirectoryId}
        onDirectoryUpdated={handleDirectoryUpdated}
      />
      <ExportDirectoryModal
        isOpen={directoryModalStates.export}
        onClose={() => {
          setDirectoryModalStates((prev) => ({ ...prev, export: false }));
          setSelectedDirectoryId(null);
        }}
        directoryId={selectedDirectoryId}
      />
      <EditSnippetDetailsModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        snippet={selectedSnippet}
        onSnippetUpdated={handleSnippetUpdated}
      />
      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default Home;
