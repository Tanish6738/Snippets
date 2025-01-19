import { useState } from 'react';
import { useUser } from '../../Context/UserContext';
import axios from '../../Config/Axios';

const Profile = () => {
  const { user, setUser } = useUser();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    email: user?.email || ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.patch('/api/users/profile', formData);
      setUser(data);
      setMessage('Profile updated successfully');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
      setMessage('');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows="4"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Update Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;