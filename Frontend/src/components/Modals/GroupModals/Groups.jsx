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
    <div className="container mx-auto p-4">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Groups</h1>
        {isAuthenticated && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Group
          </button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search groups..."
            className="w-full p-2 border rounded"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {isAuthenticated && (
          <select
            className="p-2 border rounded"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="all">All Groups</option>
            <option value="my">My Groups</option>
          </select>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid gap-6">
          {groups.map(group => (
            <div key={group._id} className="border rounded-lg p-4 bg-white shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{group.name}</h3>
                  <p className="text-gray-600 mb-2">{group.description}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedGroup(group);
                      setViewModalOpen(true);
                    }}
                    className="px-3 py-1 text-blue-600 hover:text-blue-800"
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
                        className="px-3 py-1 text-green-600 hover:text-green-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedGroup(group);
                          setAddMemberModalOpen(true);
                        }}
                        className="px-3 py-1 text-purple-600 hover:text-purple-800"
                      >
                        Add Member
                      </button>
                      <button
                        onClick={() => handleDelete(group._id)}
                        className="px-3 py-1 text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <span className="mr-4">Members: {group.members.length}</span>
                <span className="mr-4">Visibility: {group.settings.visibility}</span>
                <span>Join Policy: {group.settings.joinPolicy}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center space-x-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
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
  );
};

export default Groups;