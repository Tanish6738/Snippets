import React, { useState, useEffect } from 'react';
import { useProject } from '../../Context/ProjectContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, FiUserPlus, FiSearch, FiTrash2, FiEdit, 
  FiCheck, FiSlash, FiChevronDown, FiShield, 
  FiSend, FiMail, FiAlertCircle
} from 'react-icons/fi';

const MembersPanel = ({ projectId, members = [], onClose }) => {
  const { addMember, removeMember, updateMemberRole, loading } = useProject();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Viewer');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  // Filter members based on search term
  const filteredMembers = members.filter(member => 
    member.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInviteMember = async (e) => {
    e.preventDefault();
    
    // Reset states
    setErrors({});
    setSuccess('');
    
    // Validation
    let validationErrors = {};
    if (!email.trim()) {
      validationErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      validationErrors.email = 'Please enter a valid email';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    try {
      await addMember(projectId, { email, role });
      setEmail('');
      setRole('Viewer');
      setSuccess('Member invited successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error inviting member:', error);
      setErrors({ submit: error.message || 'Failed to invite member' });
    }
  };

  const confirmRemoveMember = (member) => {
    setMemberToRemove(member);
    setIsRemoving(true);
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    
    try {
      await removeMember(projectId, memberToRemove.user._id);
      setSuccess(`${memberToRemove.user.username} was removed from the project`);
      setIsRemoving(false);
      setMemberToRemove(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error removing member:', error);
      setErrors({ submit: error.message || 'Failed to remove member' });
      setIsRemoving(false);
      setMemberToRemove(null);
    }
  };

  const handleChangeRole = async (e) => {
    e.preventDefault();
    
    if (!newRole || !selectedMemberId) {
      return;
    }
    
    try {
      await updateMemberRole(projectId, selectedMemberId, newRole);
      setSelectedMemberId(null);
      setNewRole('');
      setSuccess('Member role updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating role:', error);
      setErrors({ submit: error.message || 'Failed to update role' });
    }
  };

  // Variants for animations
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={backdropVariants}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={modalVariants}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
            <h3 className="text-xl font-semibold text-white">Manage Team Members</h3>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
              aria-label="Close"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
            {/* Add member form */}
            <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-5 mb-6">
              <h4 className="text-lg font-medium text-white mb-4">Add New Member</h4>
              
              <form onSubmit={handleInviteMember} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FiMail className="text-slate-500" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: null });
                      }}
                      className={`bg-slate-900/50 border ${
                        errors.email ? 'border-red-500' : 'border-slate-600/50'
                      } text-white text-sm rounded-lg block w-full pl-10 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/70`}
                      placeholder="user@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                      <FiAlertCircle className="w-3.5 h-3.5" />
                      {errors.email}
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-slate-400 mb-1">
                    Role
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FiShield className="text-slate-500" />
                    </div>
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="bg-slate-900/50 border border-slate-600/50 text-white text-sm rounded-lg block w-full pl-10 p-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Contributor">Contributor</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FiChevronDown className="text-slate-500" />
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    <span className="text-indigo-400 font-medium">Admin:</span> Full access to manage project and members
                    <br />
                    <span className="text-blue-400 font-medium">Contributor:</span> Can create and edit tasks
                    <br />
                    <span className="text-slate-400 font-medium">Viewer:</span> View-only access
                  </p>
                </div>
                
                <div className="mt-6 flex items-center justify-between">
                  {errors.submit && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <FiAlertCircle className="w-4 h-4" />
                      {errors.submit}
                    </p>
                  )}
                  {success && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-green-400 flex items-center gap-1"
                    >
                      <FiCheck className="w-4 h-4" />
                      {success}
                    </motion.p>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className={`ml-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 
                               hover:to-purple-500 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/20
                               flex items-center gap-2 px-5 py-2.5 transition-all ${loading ? 'opacity-70' : ''}`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                          <circle 
                            className="opacity-25" 
                            cx="12" 
                            cy="12" 
                            r="10" 
                            stroke="currentColor" 
                            strokeWidth="4"
                          />
                          <path 
                            className="opacity-75" 
                            fill="currentColor" 
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>Inviting...</span>
                      </>
                    ) : (
                      <>
                        <FiUserPlus className="w-4 h-4" />
                        Invite Member
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
            
            {/* Team members list */}
            <div>
              <div className="flex justify-between items-center mb-5">
                <h4 className="text-lg font-medium text-white">Team Members</h4>
                <div className="relative w-52">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FiSearch className="text-slate-500" />
                  </div>
                  <input
                    type="text"
                    className="bg-slate-900/50 border border-slate-600/50 text-white text-sm rounded-lg block w-full pl-10 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
                    placeholder="Search members"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="rounded-xl overflow-hidden">
                <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-3 bg-slate-700/30 text-slate-300 text-sm font-medium">
                  <div>User</div>
                  <div>Email</div>
                  <div>Role</div>
                </div>
                
                <div className="divide-y divide-slate-700/30 bg-slate-800/30">
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => (
                      <div
                        key={member.user._id}
                        className="grid grid-cols-[auto_1fr_auto] gap-4 items-center px-4 py-3 hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                            {member.user.avatar ? (
                              <img 
                                src={member.user.avatar} 
                                alt={member.user.username}
                                className="h-10 w-10 object-cover" 
                              />
                            ) : (
                              <span className="text-lg font-bold text-white">
                                {member.user.username.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="font-medium text-white">{member.user.username}</span>
                        </div>
                        
                        <div className="text-slate-400 text-sm truncate">
                          {member.user.email}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {selectedMemberId === member.user._id ? (
                            // Edit role mode
                            <form onSubmit={handleChangeRole} className="flex items-center gap-2">
                              <select
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                className="bg-slate-700/50 border border-slate-600/30 text-white text-xs rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
                              >
                                <option value="">Select role</option>
                                <option value="Admin">Admin</option>
                                <option value="Contributor">Contributor</option>
                                <option value="Viewer">Viewer</option>
                              </select>
                              <button
                                type="submit"
                                className={`p-1 text-green-400 hover:text-green-300 bg-green-900/30 hover:bg-green-900/50 
                                          rounded-lg transition-colors ${!newRole ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={!newRole}
                                title="Save"
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMemberId(null);
                                  setNewRole('');
                                }}
                                className="p-1 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            </form>
                          ) : (
                            // Normal view
                            <>
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full ${getRoleBadgeClasses(member.role)}`}
                              >
                                {member.role}
                              </span>
                              <button
                                onClick={() => {
                                  setSelectedMemberId(member.user._id);
                                  setNewRole(member.role);
                                }}
                                className="p-1 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                                title="Edit role"
                              >
                                <FiEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => confirmRemoveMember(member)}
                                className="p-1 text-red-400 hover:text-red-300 bg-red-900/30 hover:bg-red-900/50 rounded-lg transition-colors"
                                title="Remove member"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <p className="text-slate-400">
                        {searchTerm ? 'No members match your search' : 'No members in this project yet'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end p-5 border-t border-slate-700/50">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* Confirmation Modal for Member Removal */}
      <AnimatePresence>
        {isRemoving && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => setIsRemoving(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="text-center mb-5">
                  <div className="mx-auto w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center mb-4">
                    <FiSlash className="text-red-500 w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Remove Team Member</h3>
                  <p className="text-slate-400">
                    Are you sure you want to remove 
                    <span className="text-white font-medium mx-1">
                      {memberToRemove?.user.username}
                    </span> 
                    from this project? This action cannot be undone.
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsRemoving(false)}
                    className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRemoveMember}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

// Helper function for role badge classes
const getRoleBadgeClasses = (role) => {
  switch (role) {
    case 'Admin':
      return 'bg-red-900/30 text-red-400 border border-red-800/30';
    case 'Contributor':
      return 'bg-blue-900/30 text-blue-400 border border-blue-800/30';
    case 'Viewer':
    default:
      return 'bg-slate-700/50 text-slate-400 border border-slate-600/30';
  }
};

export default MembersPanel;