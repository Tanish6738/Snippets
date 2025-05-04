// Task Form Component
import React, { useState, useRef, useEffect } from 'react';

const priorities = ['Low', 'Medium', 'High', 'Urgent'];

const TaskForm = ({ initialValues = {}, onSubmit, projectMembers = [] }) => {
  const [title, setTitle] = useState(initialValues.title || '');
  const [description, setDescription] = useState(initialValues.description || '');
  const [priority, setPriority] = useState(initialValues.priority || 'Medium');
  const [dueDate, setDueDate] = useState(initialValues.dueDate ? initialValues.dueDate.slice(0, 10) : '');
  const [tags, setTags] = useState(initialValues.tags ? initialValues.tags.join(', ') : '');
  const [assignedTo, setAssignedTo] = useState(initialValues.assignedTo?.map(u => typeof u === 'string' ? u : u._id) || []);
  // New fields for comments and mentions
  const [comment, setComment] = useState('');
  const [mentions, setMentions] = useState(initialValues.mentions || []);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(0);
  const commentRef = useRef(null);

  // Generate initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Avatar color based on username
  const avatarColors = [
    'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 
    'bg-red-500', 'bg-orange-500', 'bg-amber-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500',
    'bg-teal-500', 'bg-cyan-500', 'bg-blue-500'
  ];

  const getAvatarColor = (name) => {
    if (!name) return avatarColors[0];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % avatarColors.length;
    return avatarColors[index];
  };

  // Filter members for mention dropdown
  const filteredMembers = mentionQuery 
    ? projectMembers.filter(member => {
        const username = (member.user || member)?.username || '';
        return username.toLowerCase().includes(mentionQuery.toLowerCase());
      })
    : projectMembers;

  // Assignment search state
  const [assignSearch, setAssignSearch] = useState('');

  // Filter project members for assignment based on search
  const filteredAssignMembers = assignSearch
    ? projectMembers.filter(member => {
        const username = (member.user?.username) || '';
        return username.toLowerCase().includes(assignSearch.toLowerCase());
      })
    : projectMembers;

  // Handle comment input change and detect '@' for mentions
  const handleCommentChange = (e) => {
    const newComment = e.target.value;
    setComment(newComment);
    
    // Check for @ symbol to trigger mentions
    const lastAtSymbol = newComment.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      const textAfterAt = newComment.substring(lastAtSymbol + 1);
      // Check if there's a space after the last @ or it's at the end
      if (!textAfterAt.includes(' ')) {
        setMentionQuery(textAfterAt);
        setMentionStartIndex(lastAtSymbol);
        setShowMentionDropdown(true);
        return;
      }
    }
    
    setShowMentionDropdown(false);
  };

  // Handle selecting a user from the mention dropdown
  const handleSelectMention = (userId, username) => {
    // Replace the @query with @username
    const before = comment.substring(0, mentionStartIndex);
    const after = comment.substring(mentionStartIndex + mentionQuery.length + 1);
    const newComment = `${before}@${username} ${after}`;
    
    setComment(newComment);
    setShowMentionDropdown(false);
    
    // Add to mentions list if not already included
    if (!mentions.includes(userId)) {
      setMentions([...mentions, userId]);
    }
    
    // Focus back on the comment input
    if (commentRef.current) {
      commentRef.current.focus();
    }
  };

  // Close mention dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (commentRef.current && !commentRef.current.contains(event.target)) {
        setShowMentionDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit && onSubmit({
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      assignedTo,
      // Include the comment and mentions in submission
      comment: comment.trim() !== '' ? comment : undefined,
      mentions
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium">Title</label>
        <input
          className="border rounded px-2 py-1 w-full"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block font-medium">Description</label>
        <textarea
          className="border rounded px-2 py-1 w-full"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label className="block font-medium">Priority</label>
        <select
          className="border rounded px-2 py-1 w-full"
          value={priority}
          onChange={e => setPriority(e.target.value)}
        >
          {priorities.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block font-medium">Due Date</label>
        <input
          type="date"
          className="border rounded px-2 py-1 w-full"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
        />
      </div>
      <div>
        <label className="block font-medium">Tags (comma separated)</label>
        <input
          className="border rounded px-2 py-1 w-full"
          value={tags}
          onChange={e => setTags(e.target.value)}
        />
      </div>
      
      {/* Project Members Assignment */}
      {projectMembers.length > 0 && (
        <div>
          <label className="block font-medium mb-2">Assign To</label>
          {/* Assignment search box */}
          <input
            type="text"
            className="border rounded px-2 py-1 w-full mb-2"
            placeholder="Search members..."
            value={assignSearch}
            onChange={e => setAssignSearch(e.target.value)}
          />
          <div className="max-h-48 overflow-y-auto border rounded p-2">
            {filteredAssignMembers.map(member => {
              const user = member.user;
              const username = user?.username || 'User';
              const avatarColor = getAvatarColor(username);
              const userId = user?._id;
              
              return (
                <label 
                  key={userId} 
                  className="flex items-center gap-3 p-2 rounded hover:bg-slate-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={assignedTo.includes(userId)}
                    onChange={e => {
                      if (e.target.checked) {
                        setAssignedTo([...assignedTo, userId]);
                      } else {
                        setAssignedTo(assignedTo.filter(id => id !== userId));
                      }
                    }}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className={`${avatarColor} w-8 h-8 rounded-full flex items-center justify-center text-white text-xs`}>
                    {user?.avatar ? (
                      <img src={user.avatar} alt={username} className="rounded-full w-full h-full object-cover" />
                    ) : (
                      getInitials(username)
                    )}
                  </div>
                  <div>
                    <div className="text-slate-800 text-sm">{username}</div>
                    {member.role && <div className="text-slate-500 text-xs">{member.role}</div>}
                  </div>
                </label>
              );
            })}
            {filteredAssignMembers.length === 0 && (
              <div className="text-slate-500 italic text-center py-2">No members found</div>
            )}
          </div>
        </div>
      )}
      
      {/* Comment input with mentions */}
      <div className="relative">
        <label className="block font-medium">Comment (Use @ to mention team members)</label>
        <div className="relative">
          <textarea
            ref={commentRef}
            className="border rounded px-2 py-1 w-full"
            value={comment}
            onChange={handleCommentChange}
            placeholder="Add a comment or @mention someone..."
            rows={3}
          />
          
          {/* Mention dropdown */}
          {showMentionDropdown && filteredMembers.length > 0 && (
            <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg">
              {filteredMembers.map(member => {
                const user = member.user || member;
                const username = user?.username || 'User';
                const avatarColor = getAvatarColor(username);
                const userId = user._id;
                
                return (
                  <div
                    key={userId}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectMention(userId, username)}
                  >
                    <div className={`${avatarColor} w-6 h-6 rounded-full flex items-center justify-center text-white text-xs`}>
                      {user?.avatar ? (
                        <img src={user.avatar} alt={username} className="rounded-full w-full h-full object-cover" />
                      ) : (
                        getInitials(username)
                      )}
                    </div>
                    <div className="text-sm">{username}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Display current mentions */}
        {mentions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {mentions.map(userId => {
              const member = projectMembers.find(m => (m.user || m)._id === userId);
              if (!member) return null;
              
              const user = member.user || member;
              const username = user?.username || 'User';
              
              return (
                <span key={userId} className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  @{username}
                  <button
                    type="button"
                    onClick={() => setMentions(mentions.filter(id => id !== userId))}
                    className="ml-1 text-blue-500 hover:text-blue-700"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>
      
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save Task</button>
    </form>
  );
};

export default TaskForm;