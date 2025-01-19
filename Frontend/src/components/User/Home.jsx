import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroup } from '../../Context/GroupContext';
import CreateGroup from '../Group/CreateGroup';

const Home = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { groups, fetchGroups } = useGroup();
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Groups</h2>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Create Group
        </button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <div 
            key={group._id} 
            onClick={() => navigate(`/groups/${group._id}`)}
            className="border rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
          >
            <h3 className="font-bold text-lg mb-2">{group.name}</h3>
            <p className="text-gray-600">{group.description}</p>
          </div>  
        ))}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroup 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={(group) => {
            setShowCreateModal(false);
            navigate(`/groups/${group._id}`);
          }}
        />
      )}
    </div>
  );
};

export default Home;