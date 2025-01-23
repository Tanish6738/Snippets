import React, { useState } from 'react';
import { 
  FaUsers, 
  FaComments, 
  FaFolder, 
  FaChevronRight,
  FaChevronLeft,
  FaPlus,
  FaSearch,
  FaCog
} from 'react-icons/fa';

const GroupLayout = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isChatOpen, setChatOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('members'); // members, files

  return (
    <div className="min-h-screen bg-[#070B14] pt-16">
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Sidebar */}
        <div className={`
          bg-[#0B1120]/80 backdrop-blur-xl
          border-r border-indigo-500/20
          transition-all duration-300
          ${isSidebarCollapsed ? 'w-20' : 'w-72'}
        `}>
          {/* Group Header */}
          <div className="p-4 border-b border-indigo-500/20">
            <div className="flex items-center justify-between">
              {!isSidebarCollapsed && (
                <h2 className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                  Group Name
                </h2>
              )}
              <button
                onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                className="p-2 text-indigo-400 hover:text-indigo-300"
              >
                {isSidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
              </button>
            </div>
          </div>

          {/* Sidebar Tabs */}
          <div className="flex border-b border-indigo-500/20">
            <button
              onClick={() => setActiveTab('members')}
              className={`
                flex-1 p-3 text-sm font-medium
                ${activeTab === 'members' 
                  ? 'text-indigo-400 border-b-2 border-indigo-500' 
                  : 'text-indigo-400/60 hover:text-indigo-400'
                }
              `}
            >
              <div className="flex items-center justify-center gap-2">
                <FaUsers />
                {!isSidebarCollapsed && <span>Members</span>}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`
                flex-1 p-3 text-sm font-medium
                ${activeTab === 'files' 
                  ? 'text-indigo-400 border-b-2 border-indigo-500' 
                  : 'text-indigo-400/60 hover:text-indigo-400'
                }
              `}
            >
              <div className="flex items-center justify-center gap-2">
                <FaFolder />
                {!isSidebarCollapsed && <span>Files</span>}
              </div>
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="p-4">
            {/* Search */}
            {!isSidebarCollapsed && (
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full bg-indigo-500/10 border border-indigo-500/20 
                           rounded-lg px-4 py-2 text-indigo-300 
                           placeholder-indigo-400/50 focus:outline-none 
                           focus:border-indigo-500/50"
                />
                <FaSearch className="absolute right-3 top-3 text-indigo-400/50" />
              </div>
            )}

            {/* Content based on active tab */}
            {activeTab === 'members' ? (
              <div className="space-y-2">
                {!isSidebarCollapsed && (
                  <button className="w-full px-4 py-2 bg-indigo-500/20 
                                   hover:bg-indigo-500/30 text-indigo-300 
                                   rounded-lg flex items-center gap-2">
                    <FaPlus className="w-3 h-3" />
                    <span>Invite Member</span>
                  </button>
                )}
                {/* Member list would go here */}
              </div>
            ) : (
              <div className="space-y-2">
                {!isSidebarCollapsed && (
                  <button className="w-full px-4 py-2 bg-indigo-500/20 
                                   hover:bg-indigo-500/30 text-indigo-300 
                                   rounded-lg flex items-center gap-2">
                    <FaPlus className="w-3 h-3" />
                    <span>New Snippet</span>
                  </button>
                )}
                {/* File tree would go here */}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          <div className={`
            flex-1 p-6 
            ${isChatOpen ? 'mr-80' : ''}
          `}>
            <div className="bg-[#0B1120]/80 backdrop-blur-xl h-full 
                          rounded-2xl p-6 border border-indigo-500/20">
              {/* Main content would go here */}
              <div className="text-indigo-300">
                Select a snippet or directory to view
              </div>
            </div>
          </div>

          {/* Chat Panel */}
          <div className={`
            fixed right-0 top-16 bottom-0
            bg-[#0B1120]/80 backdrop-blur-xl
            border-l border-indigo-500/20
            transition-all duration-300
            ${isChatOpen ? 'w-80 translate-x-0' : 'translate-x-full'}
          `}>
            <div className="flex flex-col h-full">
              {/* Chat Header */}
              <div className="p-4 border-b border-indigo-500/20 flex justify-between items-center">
                <h3 className="text-lg font-medium text-indigo-300">Group Chat</h3>
                <button
                  onClick={() => setChatOpen(false)}
                  className="p-2 text-indigo-400 hover:text-indigo-300"
                >
                  <FaChevronRight />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Messages would go here */}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-indigo-500/20">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="w-full bg-indigo-500/10 border border-indigo-500/20 
                           rounded-lg px-4 py-2 text-indigo-300 
                           placeholder-indigo-400/50 focus:outline-none 
                           focus:border-indigo-500/50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Toggle Button (Mobile) */}
      {!isChatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-4 right-4 p-3 rounded-full 
                     bg-indigo-500 text-white shadow-lg"
        >
          <FaComments />
        </button>
      )}
    </div>
  );
};

export default GroupLayout;
