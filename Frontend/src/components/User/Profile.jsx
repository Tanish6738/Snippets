import { useState } from 'react';
import { useUser } from '../../Context/UserContext';
import axios from '../../Config/Axios';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import { Container } from './Home/HComponents';
import { GlassCard } from './Home/Cards';

const Profile = () => {
  const { user, setUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
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
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
      setMessage('');
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      bio: user?.bio || '',
      email: user?.email || ''
    });
    setError('');
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 pt-20">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Profile Header */}
          <div className="relative mb-8">
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-gradient-to-br from-slate-600/10 to-slate-700/10 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
              <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-gradient-to-tr from-slate-500/10 to-slate-600/10 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000" />
            </div>
            
            <div className="relative z-10 text-center">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-block mb-6 px-6 py-2 rounded-full bg-gradient-to-r from-slate-700/10 to-slate-800/10 border border-slate-700/20 relative group"
              >
                <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-slate-500/0 to-slate-600/0 group-hover:from-slate-500/20 group-hover:to-slate-600/20 transition-all duration-300"></div>
                <span className="text-sm text-slate-400 relative z-10">
                  Profile Settings
                </span>
              </motion.div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-100 bg-clip-text text-transparent">
                {user?.username}
              </h1>
              <p className="text-lg text-slate-300/80 font-light">
                Manage your account settings and preferences
              </p>
            </div>
          </div>

          {/* Profile Content */}
          <GlassCard>
            <form onSubmit={handleSubmit} className="space-y-6">
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/50 border border-slate-700/50 text-slate-300 px-4 py-3 rounded-xl"
                >
                  {message}
                </motion.div>
              )}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-6">
                {/* Username Field */}
                <div className="relative group">
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      disabled={!isEditing}
                      className={`block w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/50 border 
                                ${isEditing ? 'border-slate-600/50 focus:border-slate-500/50' : 'border-slate-700/50'} 
                                text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 
                                focus:ring-slate-500/20 transition-all duration-200`}
                    />
                  </div>
                </div>

                {/* Bio Field */}
                <div className="relative group">
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Bio
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <FiEdit2 className="h-5 w-5 text-slate-500" />
                    </div>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      disabled={!isEditing}
                      rows="4"
                      className={`block w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/50 border 
                                ${isEditing ? 'border-slate-600/50 focus:border-slate-500/50' : 'border-slate-700/50'} 
                                text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 
                                focus:ring-slate-500/20 transition-all duration-200`}
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="relative group">
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="block w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/50 border 
                                border-slate-700/50 text-slate-400 placeholder-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4">
                {isEditing ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleCancel}
                      className="px-6 py-2.5 rounded-xl bg-slate-800/50 text-slate-300 font-medium 
                                hover:bg-slate-800/70 border border-slate-700/50 hover:border-slate-600/50 
                                transition-all duration-200 flex items-center gap-2"
                    >
                      <FiX className="w-4 h-4" />
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 
                                text-white font-medium hover:from-slate-600 hover:to-slate-700 
                                transition-all duration-200 shadow-lg shadow-slate-900/25 
                                flex items-center gap-2"
                    >
                      <FiSave className="w-4 h-4" />
                      Save Changes
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 
                              text-white font-medium hover:from-slate-600 hover:to-slate-700 
                              transition-all duration-200 shadow-lg shadow-slate-900/25 
                              flex items-center gap-2"
                  >
                    <FiEdit2 className="w-4 h-4" />
                    Edit Profile
                  </motion.button>
                )}
              </div>
            </form>
          </GlassCard>
        </motion.div>
      </Container>
    </div>
  );
};

export default Profile;