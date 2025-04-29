import React, { useState } from 'react';
import { FiUser, FiUsers } from 'react-icons/fi';

const ProjectMembers = ({ members = [], projectId, onMemberAdded, currentUserId, projectCreatorId }) => {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Contributor');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [newRole, setNewRole] = useState('Contributor');
  const [roleUpdating, setRoleUpdating] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  // Determine if current user is admin
  const isAdmin = members.some(m => m.user?._id === currentUserId && m.role === 'Admin');

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAdding(true);
    setError(null);
    try {
      const { addProjectMember } = await import('../../services/projectService');
      await addProjectMember(projectId, { email, role });
      setEmail('');
      setRole('Contributor');
      setShowForm(false);
      if (onMemberAdded) onMemberAdded();
    } catch (err) {
      setError(err.message || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const handleRoleEdit = (member) => {
    setEditingRoleId(member.user._id);
    setNewRole(member.role);
  };

  const handleRoleUpdate = async (memberId) => {
    setRoleUpdating(true);
    setError(null);
    try {
      const { updateMemberRole } = await import('../../services/projectService');
      await updateMemberRole(projectId, memberId, { role: newRole });
      setEditingRoleId(null);
      if (onMemberAdded) onMemberAdded();
    } catch (err) {
      setError(err.message || 'Failed to update role');
    } finally {
      setRoleUpdating(false);
    }
  };

  const handleRemove = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    setRemovingId(memberId);
    setError(null);
    try {
      const { removeProjectMember } = await import('../../services/projectService');
      await removeProjectMember(projectId, memberId);
      if (onMemberAdded) onMemberAdded();
    } catch (err) {
      setError(err.message || 'Failed to remove member');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div>
      <ul className="space-y-2">
        {members && members.length > 0 ? members.map((m, i) => (
          <li key={m.user?._id || i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/40 border border-slate-700/30">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700/40">
              <FiUser className="text-slate-400" />
            </div>
            <span className="font-medium text-slate-200">{m.user?.username || m.user?.name || 'User'}</span>
            {editingRoleId === m.user?._id ? (
              <>
                <select value={newRole} onChange={e => setNewRole(e.target.value)} className="input input-bordered bg-slate-900/60 border-slate-700/40 text-white mx-2">
                  <option value="Contributor">Contributor</option>
                  <option value="Admin">Admin</option>
                  <option value="Viewer">Viewer</option>
                </select>
                <button type="button" onClick={() => handleRoleUpdate(m.user._id)} disabled={roleUpdating} className="px-2 py-1 rounded bg-green-600 text-white text-xs font-medium mr-1">Save</button>
                <button type="button" onClick={() => setEditingRoleId(null)} className="px-2 py-1 rounded bg-slate-700 text-white text-xs font-medium">Cancel</button>
              </>
            ) : (
              <span className="text-xs text-slate-400 bg-slate-700/40 px-2 py-0.5 rounded-full ml-auto">{m.role}</span>
            )}
            {/* Admin controls: cannot edit/remove creator, cannot edit/remove self */}
            {isAdmin && m.user?._id !== projectCreatorId && m.user?._id !== currentUserId && (
              <>
                {editingRoleId !== m.user?._id && (
                  <button type="button" onClick={() => handleRoleEdit(m)} className="ml-2 px-2 py-1 rounded bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500">Edit Role</button>
                )}
                <button type="button" onClick={() => handleRemove(m.user._id)} disabled={removingId === m.user._id} className="ml-2 px-2 py-1 rounded bg-red-600 text-white text-xs font-medium hover:bg-red-500">{removingId === m.user._id ? 'Removing...' : 'Remove'}</button>
              </>
            )}
          </li>
        )) : (
          <div className="text-slate-400 py-4 text-center flex flex-col items-center">
            <FiUsers className="text-3xl mb-2 text-slate-600" />
            <span>No members yet.</span>
          </div>
        )}
      </ul>
      <div className="mt-4">
        {!showForm && isAdmin && (
          <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all">+ Add Member</button>
        )}
        {showForm && (
          <form onSubmit={handleAddMember} className="mt-2 flex flex-col gap-2 bg-slate-800/40 p-4 rounded-lg border border-slate-700/30">
            <input type="email" required placeholder="Member email" value={email} onChange={e => setEmail(e.target.value)} className="input input-bordered bg-slate-900/60 border-slate-700/40 text-white" />
            <select value={role} onChange={e => setRole(e.target.value)} className="input input-bordered bg-slate-900/60 border-slate-700/40 text-white">
              <option value="Contributor">Contributor</option>
              <option value="Admin">Admin</option>
              <option value="Viewer">Viewer</option>
            </select>
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <div className="flex gap-2">
              <button type="submit" disabled={adding} className="px-4 py-1 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all">{adding ? 'Adding...' : 'Add'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-1 rounded bg-slate-700 text-white font-medium hover:bg-slate-600 transition-all">Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProjectMembers;