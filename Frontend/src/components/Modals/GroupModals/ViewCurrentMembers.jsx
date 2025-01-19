import { useState, useEffect } from 'react';
import axios from '../../../Config/Axios';

const ViewCurrentMembers = ({ isOpen, onClose, groupId }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMembers = async () => {
      if (!groupId) return;
      try {
        setLoading(true);
        setError('');
        const { data } = await axios.get(`/api/groups/${groupId}/members`);
        setMembers(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load members');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && groupId) {
      fetchMembers();
    }
  }, [isOpen, groupId]);

  const handleRemoveMember = async (userId) => {
    try {
      await axios.delete(`/api/groups/${groupId}/members/${userId}`);
      setMembers(members.filter(member => member.userId._id !== userId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove member');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Group Members</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {members.map(member => (
              <div 
                key={member.userId._id} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <img
                    src={member.userId.avatar || '/default-avatar.png'}
                    alt={member.userId.username}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div>
                    <p className="font-medium">{member.userId.username}</p>
                    <p className="text-sm text-gray-500">{member.userId.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="px-3 py-1 bg-gray-200 rounded-full text-sm capitalize">
                    {member.role}
                  </span>
                  <button
                    onClick={() => handleRemoveMember(member.userId._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewCurrentMembers;