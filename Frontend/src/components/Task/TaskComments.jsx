// Task Comments Component
import { useState } from 'react';
import { addTaskComment as addComment } from '../../services/taskService';

const TaskComments = ({ 
  comments = [], 
  taskId, 
  onCommentAdded, 
  projectMembers = [] 
}) => {
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mentioning, setMentioning] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentions, setMentions] = useState([]);

  const handleCommentChange = (e) => {
    const value = e.target.value;
    setComment(value);
    
    // Check if user is trying to mention someone
    if (value.endsWith('@')) {
      setMentioning(true);
      setMentionQuery('');
    } else if (mentioning) {
      const lastWord = value.split(' ').pop();
      if (lastWord.startsWith('@')) {
        setMentionQuery(lastWord.substring(1));
      } else {
        setMentioning(false);
      }
    }
  };

  const handleMention = (userId, username) => {
    // Replace the current @mention with the username
    const currentWords = comment.split(' ');
    currentWords[currentWords.length - 1] = `@${username}`;
    setComment(currentWords.join(' ') + ' ');
    setMentioning(false);
    setMentions([...mentions, userId]);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!comment.trim()) return;
    
    setIsLoading(true);
    try {
      await addComment(taskId, { text: comment, mentions });
      setComment('');
      setMentions([]);
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter members for mention suggestions
  const filteredMembers = projectMembers
    .filter(m => m.user?.username?.toLowerCase().includes(mentionQuery.toLowerCase()))
    .map(m => m.user);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

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

  return (
    <div className="space-y-4">
      {/* Comments list */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {!comments.length && (
          <div className="text-slate-400 italic text-center py-4">
            No comments yet. Be the first to add one!
          </div>
        )}
        
        {comments.map((c, i) => {
          const username = c.createdBy?.username || 'User';
          const avatarColor = getAvatarColor(username);
          return (
            <div 
              key={c._id || i} 
              className="rounded-xl bg-gradient-to-br from-slate-800/70 to-slate-900/90 border border-slate-700/40 p-3 shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className={`${avatarColor} w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs`}>
                  {c.createdBy?.avatar ? (
                    <img src={c.createdBy.avatar} alt={username} className="rounded-full w-full h-full object-cover" />
                  ) : (
                    getInitials(username)
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-white font-medium">{username}</div>
                    <div className="text-xs text-slate-400">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</div>
                  </div>
                  <div className="text-slate-300 text-sm whitespace-pre-wrap">{c.text}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Comment input form */}
      <form onSubmit={handleSubmitComment} className="relative">
        <div className="mt-2 relative">
          <textarea
            value={comment}
            onChange={handleCommentChange}
            placeholder="Add a comment..."
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-3 px-4 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
            rows={2}
          />
          <button
            type="submit"
            disabled={isLoading || !comment.trim()}
            className={`absolute right-2 bottom-2 rounded-lg px-3 py-1.5 font-medium text-xs ${
              isLoading || !comment.trim() 
                ? 'bg-slate-700/50 text-slate-500' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            } transition-colors`}
          >
            {isLoading ? 'Posting...' : 'Post'}
          </button>
        </div>
        
        {/* Mention suggestions */}
        {mentioning && filteredMembers.length > 0 && (
          <div className="absolute z-10 mt-1 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
            <div className="p-2 text-xs text-slate-400 border-b border-slate-700">
              Mention a team member
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredMembers.map(member => (
                <div 
                  key={member._id} 
                  className="flex items-center gap-2 p-2 hover:bg-slate-700/50 cursor-pointer"
                  onClick={() => handleMention(member._id, member.username)}
                >
                  <div className={`${getAvatarColor(member.username)} w-6 h-6 rounded-full flex items-center justify-center text-white text-xs`}>
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.username} className="rounded-full w-full h-full object-cover" />
                    ) : (
                      getInitials(member.username)
                    )}
                  </div>
                  <div className="text-slate-200">{member.username}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default TaskComments;