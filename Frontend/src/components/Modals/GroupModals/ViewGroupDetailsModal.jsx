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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{group?.name || 'Loading...'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600">{group.description || 'No description provided'}</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Join Policy</p>
                  <p className="font-medium capitalize">{group.settings.joinPolicy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Visibility</p>
                  <p className="font-medium capitalize">{group.settings.visibility}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Members</h3>
              <div className="space-y-2">
                {group.members?.map(member => (
                  <div key={member._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <img 
                        src={member.avatar || '/default-avatar.png'} 
                        alt={member.username}
                        className="w-8 h-8 rounded-full mr-2"
                      />
                      <span>{member.username}</span>
                    </div>
                    <span className="text-sm text-gray-500 capitalize">{member.role}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p>Created: {new Date(group.createdAt).toLocaleDateString()}</p>
              <p>Last Updated: {new Date(group.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewGroupDetailsModal;