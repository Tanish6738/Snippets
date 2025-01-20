import { useState, useEffect } from 'react';
import { useUser } from '../../../Context/UserContext';
import axios from '../../../Config/Axios';
import ViewGroupDetailsModal from './ViewGroupDetailsModal';
import CreateGroupModal from './CreateGroupModal';
import EditGroupDetailsModal from './EditGroupDetailsModal';
import AddMemberModal from './AddMemberModal';
import ViewCurrentMembers from './ViewCurrentMembers';

const Groups = () => {
  const { isAuthenticated, user } = useUser();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'my'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [viewMembersModalOpen, setViewMembersModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        q: searchQuery
      };

      if (viewMode === 'my' && isAuthenticated) {
        params.userId = user._id;
      }

      const { data } = await axios.get('/api/groups', { params });
      setGroups(data.groups || data);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [viewMode, currentPage, searchQuery, isAuthenticated]);

  const handleDelete = async (groupId) => {
    try {
      await axios.delete(`/api/groups/${groupId}`);
      fetchGroups();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete group');
    }
  };

  const handleGroupCreated = () => {
    fetchGroups();
  };

  const handleGroupUpdated = () => {
    fetchGroups();
  };

  const handleMemberAdded = () => {
    fetchGroups();
  };

  return (
    <div className="min-h-screen bg-[#0B1120] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
            Groups
          </h1>
          {isAuthenticated && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-6 py-2 rounded-xl text-white bg-gradient-to-r from-indigo-500 to-violet-500 
                       hover:from-indigo-600 hover:to-violet-600 transition-all shadow-lg shadow-indigo-500/25"
            >
              Create Group
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 
                       text-white placeholder-indigo-400/60 focus:border-indigo-500 focus:ring-1 
                       focus:ring-indigo-500 transition-all"
            />
          </div>
          {isAuthenticated && (
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 
                       text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            >
              <option value="all">All Groups</option>
              <option value="my">My Groups</option>
            </select>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-300">
            {error}
          </div>
        )}

        {/* Groups Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-indigo-400">Loading...</div>
          </div>
        ) : (
          <div className="grid gap-6">
            {groups.map(group => (
              <div key={group._id} 
                   className="bg-[#1A1F35]/40 backdrop-blur-xl rounded-2xl shadow-lg border 
                            border-indigo-500/30 overflow-hidden transition-all transform 
                            hover:border-indigo-400/50 hover:shadow-indigo-500/10">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{group.name}</h3>
                      <p className="text-indigo-300">{group.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setSelectedGroup(group);
                          setViewModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl text-indigo-300 hover:text-indigo-200 
                                 hover:bg-indigo-500/10 transition-all"
                      >
                        View
                      </button>
                      {isAuthenticated && group.members.some(m => m.userId === user._id && m.role === 'admin') && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedGroup(group);
                              setEditModalOpen(true);
                            }}
                            className="px-4 py-2 rounded-xl text-emerald-300 hover:text-emerald-200 
                                     hover:bg-emerald-500/10 transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setSelectedGroup(group);
                              setAddMemberModalOpen(true);
                            }}
                            className="px-4 py-2 rounded-xl text-violet-300 hover:text-violet-200 
                                     hover:bg-violet-500/10 transition-all"
                          >
                            Add Member
                          </button>
                          <button
                            onClick={() => handleDelete(group._id)}
                            className="px-4 py-2 rounded-xl text-red-300 hover:text-red-200 
                                     hover:bg-red-500/10 transition-all"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full 
                                   border border-indigo-500/30 text-sm">
                      Members: {group.members.length}
                    </span>
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full 
                                   border border-indigo-500/30 text-sm capitalize">
                      {group.settings.visibility}
                    </span>
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full 
                                   border border-indigo-500/30 text-sm capitalize">
                      {group.settings.joinPolicy}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded-xl transition-all ${
                  currentPage === i + 1
                    ? 'bg-indigo-500 text-white'
                    : 'bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Modals */}
        {viewModalOpen && (
          <ViewGroupDetailsModal
            isOpen={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedGroup(null);
            }}
            groupId={selectedGroup?._id}
          />
        )}

        {createModalOpen && (
          <CreateGroupModal
            isOpen={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onGroupCreated={handleGroupCreated}
          />
        )}

        {editModalOpen && (
          <EditGroupDetailsModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedGroup(null);
            }}
            group={selectedGroup}
            onGroupUpdated={handleGroupUpdated}
          />
        )}

        {addMemberModalOpen && (
          <AddMemberModal
            isOpen={addMemberModalOpen}
            onClose={() => {
              setAddMemberModalOpen(false);
              setSelectedGroup(null);
            }}
            groupId={selectedGroup?._id}
            onMemberAdded={handleMemberAdded}
          />
        )}

        {viewMembersModalOpen && (
          <ViewCurrentMembers
            isOpen={viewMembersModalOpen}
            onClose={() => {
              setViewMembersModalOpen(false);
              setSelectedGroup(null);
            }}
            groupId={selectedGroup?._id}
          />
        )}
      </div>
    </div>
  );
};

export default Groups;