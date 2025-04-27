import React, { useState } from 'react';
import { useProject } from '../../Context/ProjectContext';
import { FiX, FiUserPlus, FiSearch, FiTrash2, FiCheck } from 'react-icons/fi';
import LoadingSpinner from '../Common/LoadingSpinner';

const MembersPanel = ({ projectId, members = [], onClose }) => {
  const { addMember, removeMember, updateMemberRole, loading } = useProject();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Viewer');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [errors, setErrors] = useState({});
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Filter members based on search term
  const filteredMembers = members.filter(member => 
    member.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInviteMember = async (e) => {
    e.preventDefault();
    
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
      setErrors({});
      setInviteSuccess(true);
      setTimeout(() => setInviteSuccess(false), 3000);
    } catch (error) {
      console.error('Error inviting member:', error);
      setErrors({ submit: error.message || 'Failed to invite member' });
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this member from the project?')) {
      try {
        await removeMember(projectId, memberId);
      } catch (error) {
        console.error('Error removing member:', error);
      }
    }
  };

  const handleChangeRole = async (e) => {
    e.preventDefault();
    
    try {
      await updateMemberRole(projectId, selectedMemberId, newRole);
      setSelectedMemberId(null);
      setNewRole('');
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="relative bg-white rounded-lg shadow max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-900">Manage Team Members</h3>
          <button
            type="button"
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5"
            onClick={onClose}
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-110px)]">
          {/* Add new member section */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="text-md font-medium text-gray-800 mb-3">Add New Member</h4>
            
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                  className={`bg-white border ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  } text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5`}
                  placeholder="Enter email address"
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                >
                  <option value="Admin">Admin</option>
                  <option value="Contributor">Contributor</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  {errors.submit && <p className="text-sm text-red-500">{errors.submit}</p>}
                  {inviteSuccess && <p className="text-sm text-green-500">Member invited successfully!</p>}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg flex items-center px-5 py-2.5 transition duration-150"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Inviting...</span>
                    </>
                  ) : (
                    <>
                      <FiUserPlus className="mr-2" /> Invite Member
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          
          {/* Current members list */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-medium text-gray-800">Current Team Members</h4>
              <div className="relative w-48">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FiSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full pl-10 p-2"
                  placeholder="Search members"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg divide-y">
              {filteredMembers.map((member) => (
                <div 
                  key={member.user._id} 
                  className="flex justify-between items-center p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <img
                      src={member.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user?.username || 'User')}&background=random`}
                      alt={member.user?.username}
                      className="w-10 h-10 rounded-full mr-4"
                    />
                    <div>
                      <h5 className="text-sm font-medium text-gray-900">{member.user?.username}</h5>
                      <p className="text-sm text-gray-500">{member.user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    {selectedMemberId === member.user._id ? (
                      <form onSubmit={handleChangeRole} className="flex items-center">
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="mr-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-1"
                        >
                          <option value="">Select a role</option>
                          <option value="Admin">Admin</option>
                          <option value="Contributor">Contributor</option>
                          <option value="Viewer">Viewer</option>
                        </select>
                        <button
                          type="submit"
                          className="text-green-600 hover:text-green-900 mr-2"
                          disabled={!newRole}
                        >
                          <FiCheck className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMemberId(null);
                            setNewRole('');
                          }}
                          className="text-gray-400 hover:text-gray-900"
                        >
                          <FiX className="w-5 h-5" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <span className={`px-2 py-1 text-xs rounded-full mr-4 ${
                          member.role === 'Admin' 
                            ? 'bg-red-100 text-red-800' 
                            : member.role === 'Contributor' 
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {member.role}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedMemberId(member.user._id);
                            setNewRole(member.role);
                          }}
                          className="text-gray-600 hover:text-gray-900 mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemoveMember(member.user._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredMembers.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  No members found matching your search
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end p-4 border-t">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MembersPanel;