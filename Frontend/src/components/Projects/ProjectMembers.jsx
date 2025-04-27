import React, { useState } from 'react';
import { FiUserPlus, FiTrash2, FiMail, FiClock, FiCheck } from 'react-icons/fi';
import { useProject } from '../../Context/ProjectContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import { format } from 'date-fns';

const ProjectMembers = ({ projectId, isAdmin = false }) => {
  const { projectMembers, inviteUser, removeUser, loading } = useProject();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [isInviting, setIsInviting] = useState(false);
  
  // Handle invite submission
  const handleInvite = async (e) => {
    e.preventDefault();
    
    try {
      setIsInviting(true);
      await inviteUser(projectId, email, role);
      setEmail('');
      setRole('Member');
    } catch (error) {
      console.error('Error inviting user:', error);
    } finally {
      setIsInviting(false);
    }
  };
  
  // Handle remove user
  const handleRemove = async (userId) => {
    if (window.confirm('Are you sure you want to remove this user from the project?')) {
      try {
        await removeUser(projectId, userId);
      } catch (error) {
        console.error('Error removing user:', error);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Project Team</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage users who have access to this project
          </p>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => document.getElementById('inviteForm').classList.toggle('hidden')}
            className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <FiUserPlus className="mr-2 -ml-1" /> Invite Team Member
          </button>
        )}
      </div>
      
      {/* Invite Form */}
      {isAdmin && (
        <div id="inviteForm" className="hidden mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <form onSubmit={handleInvite} className="space-y-4 sm:flex sm:items-end sm:space-y-0 sm:space-x-4">
            <div className="flex-grow">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="user@example.com"
                  required
                />
              </div>
            </div>
            
            <div className="sm:w-1/4">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="Admin">Admin</option>
                <option value="Member">Member</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            
            <button
              type="submit"
              disabled={isInviting || !email}
              className="sm:flex-shrink-0 w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInviting ? (
                <>
                  <LoadingSpinner size="sm" /> 
                  <span className="ml-2">Sending...</span>
                </>
              ) : (
                'Send Invitation'
              )}
            </button>
          </form>
        </div>
      )}
      
      {/* Members List */}
      {loading && !projectMembers ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : projectMembers && projectMembers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projectMembers.map((member) => (
                <tr key={member._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {member.user.avatar ? (
                          <img
                            src={member.user.avatar}
                            alt={member.user.username}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-medium text-gray-500">
                            {member.user.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member.user.username}
                        </div>
                        <div className="text-sm text-gray-500">{member.user.email}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClasses(
                        member.role
                      )}`}
                    >
                      {member.role}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.joinedAt ? format(new Date(member.joinedAt), 'MMM d, yyyy') : 'N/A'}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`flex items-center text-sm ${
                        member.status === 'Active' ? 'text-green-600' : 'text-yellow-600'
                      }`}
                    >
                      {member.status === 'Active' ? (
                        <FiCheck className="mr-1.5 flex-shrink-0" />
                      ) : (
                        <FiClock className="mr-1.5 flex-shrink-0" />
                      )}
                      {member.status}
                    </div>
                  </td>
                  
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {member.role !== 'Admin' && (
                        <button
                          onClick={() => handleRemove(member.user._id)}
                          className="text-red-600 hover:text-red-900 flex items-center ml-auto"
                          title="Remove user"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No team members yet.</p>
        </div>
      )}
    </div>
  );
};

// Helper functions for role badges
const getRoleBadgeClasses = (role) => {
  switch (role) {
    case 'Admin':
      return 'bg-purple-100 text-purple-800';
    case 'Member':
      return 'bg-blue-100 text-blue-800';
    case 'Viewer':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default ProjectMembers;