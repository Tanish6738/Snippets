import { useState, useEffect } from 'react';
import axios from '../../../Config/Axios';

const ViewGroupDetailsModal = ({ isOpen, onClose, groupId }) => {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (!groupId) return;
      try {
        setLoading(true);
        setError('');
        const { data } = await axios.get(`/api/groups/${groupId}`);
        setGroup(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load group details');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && groupId) {
      fetchGroupDetails();
    }
  }, [isOpen, groupId]);

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
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 
                           bg-clip-text text-transparent">
                {group?.name || 'Loading...'}
              </h2>
              <button onClick={onClose} className="text-2xl text-indigo-400 
                                                hover:text-indigo-300 transition-colors">×</button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto scrollbar-thin 
                         scrollbar-track-indigo-500/10 scrollbar-thumb-indigo-500/40">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-pulse text-indigo-400">Loading...</div>
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500/50 text-red-300 
                            px-4 py-3 rounded-xl">
                {error}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Description */}
                <div className="bg-indigo-500/5 rounded-xl p-4 border border-indigo-500/20">
                  <h3 className="text-lg font-medium text-indigo-200 mb-2">Description</h3>
                  <p className="text-indigo-300">{group.description || 'No description provided'}</p>
                </div>

                {/* Settings */}
                <div className="bg-indigo-500/5 rounded-xl p-4 border border-indigo-500/20">
                  <h3 className="text-lg font-medium text-indigo-200 mb-2">Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-indigo-400">Join Policy</p>
                      <p className="font-medium text-indigo-200 capitalize">
                        {group.settings.joinPolicy}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-indigo-400">Visibility</p>
                      <p className="font-medium text-indigo-200 capitalize">
                        {group.settings.visibility}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Members */}
                <div className="bg-indigo-500/5 rounded-xl p-4 border border-indigo-500/20">
                  <h3 className="text-lg font-medium text-indigo-200 mb-2">Members</h3>
                  <div className="space-y-2">
                    {group.members?.map(member => (
                      <div key={member._id} 
                           className="flex items-center justify-between p-3 
                                    bg-indigo-500/10 rounded-xl border 
                                    border-indigo-500/20 hover:bg-indigo-500/20 
                                    transition-colors">
                        <div className="flex items-center">
                          <img 
                            src={member.avatar || '/default-avatar.png'} 
                            alt={member.username}
                            className="w-8 h-8 rounded-full mr-2 border 
                                     border-indigo-500/30"
                          />
                          <span className="text-indigo-200">{member.username}</span>
                        </div>
                        <span className="text-sm text-indigo-400 capitalize px-3 
                                       py-1 bg-indigo-500/20 rounded-full border 
                                       border-indigo-500/30">
                          {member.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div className="text-sm text-indigo-400 space-y-1">
                  <p>Created: {new Date(group.createdAt).toLocaleDateString()}</p>
                  <p>Last Updated: {new Date(group.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewGroupDetailsModal;