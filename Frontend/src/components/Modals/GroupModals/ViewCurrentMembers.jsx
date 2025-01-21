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
        const { data } = await axios.get(`/api/groups/${groupId}`);
        setMembers(data.members);
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
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"></div>
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative max-w-3xl w-full bg-[#0B1120]/95 backdrop-blur-xl rounded-2xl 
                       shadow-lg border border-indigo-500/30 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-indigo-500/20">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 
                           bg-clip-text text-transparent">
                Group Members
              </h2>
              <button onClick={onClose} className="text-2xl text-indigo-400 
                                                hover:text-indigo-300 transition-colors">×</button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/50 
                          text-red-300">
              {error}
            </div>
          )}

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto scrollbar-thin 
                         scrollbar-track-indigo-500/10 scrollbar-thumb-indigo-500/40">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-pulse text-indigo-400">Loading...</div>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map(member => (
                  <div 
                    key={member.userId._id} 
                    className="group flex items-center justify-between p-4 bg-indigo-500/10 
                             rounded-xl border border-indigo-500/20 hover:bg-indigo-500/20 
                             transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <img
                        src={member.userId.avatar || '/default-avatar.png'}
                        alt={member.userId.username}
                        className="w-10 h-10 rounded-full border border-indigo-500/30"
                      />
                      <div className="ml-3">
                        <p className="font-medium text-indigo-100">{member.userId.username}</p>
                        <p className="text-sm text-indigo-400">{member.userId.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full 
                                     border border-indigo-500/30 text-sm capitalize">
                        {member.role}
                      </span>
                      <button
                        onClick={() => handleRemoveMember(member.userId._id)}
                        className="px-3 py-1 rounded-lg text-red-400 hover:text-red-300 
                                 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
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
      </div>
    </div>
  );
};

export default ViewCurrentMembers;