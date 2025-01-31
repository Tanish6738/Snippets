import React, { useState, useRef, useEffect } from 'react';
import { 
  FaArrowLeft, 
  FaChevronRight, 
  FaCompress, 
  FaExpand, 
  FaPaperPlane, 
  FaArrowDown 
} from 'react-icons/fa';
import { motion } from 'framer-motion';

const ChatBubble = ({ message, isOwnMessage, previousMessage, showTimestamp }) => {
  const isSameSender = previousMessage && previousMessage.sender === message.sender;
  
  return (
    <div className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} 
                    ${!isSameSender ? 'mt-4' : 'mt-1'}`}>
      {!isSameSender && !isOwnMessage && (
        <div className="w-8 h-8 rounded-full bg-indigo-500/30 
                      flex items-center justify-center text-indigo-300 shrink-0">
          {message.sender.substring(0, 1).toUpperCase()}
        </div>
      )}
      {!isSameSender && isOwnMessage && <div className="w-8" />}
      
      <div className={`max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {!isSameSender && !isOwnMessage && (
          <div className="text-sm text-indigo-400 mb-1 ml-1">
            User {message.sender.substring(0, 8)}
          </div>
        )}
        <div className={`rounded-2xl px-4 py-2 ${
          isOwnMessage 
            ? 'bg-indigo-500 text-white' 
            : 'bg-indigo-500/10 text-indigo-200'
        }`}>
          {message.message}
        </div>
        {showTimestamp && (
          <div className="text-xs text-indigo-400/60 mt-1 mx-1">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const Chat = ({ 
  isOpen, 
  onClose, 
  messages, 
  onSendMessage, 
  isMobile, 
  isFullScreen, 
  onToggleFullScreen, 
  user 
}) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom]);

  const handleScroll = (e) => {
    const { scrollHeight, scrollTop, clientHeight } = e.target;
    setIsAtBottom(Math.abs(scrollHeight - clientHeight - scrollTop) < 10);
  };

  return (
    <motion.div 
      initial={{ x: 384 }}
      animate={{ 
        x: isOpen ? 0 : 384,
        width: isFullScreen ? '100%' : 384
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`
        fixed right-0 top-0 bottom-0 md:bottom-4
        bg-gradient-to-b from-[#0B1120]/95 to-[#0D1428]/95
        border-l border-indigo-500/10
        z-50 flex flex-col
        md:top-20 shadow-2xl shadow-indigo-500/5
        ${!isFullScreen && 'md:rounded-2xl md:mr-4'}
      `}>
      <div className="shrink-0 p-4 border-b border-indigo-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isMobile && (
            <button onClick={onClose} className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg">
              <FaArrowLeft />
            </button>
          )}
          <h3 className="text-lg font-semibold text-indigo-300">Group Chat</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFullScreen}
            className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg"
          >
            {isFullScreen ? <FaCompress /> : <FaExpand />}
          </button>
          {!isMobile && (
            <button onClick={onClose} className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg">
              <FaChevronRight />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4" onScroll={handleScroll}>
        <div className="space-y-1">
          {messages.map((msg, index) => (
            <ChatBubble
              key={index}
              message={msg}
              isOwnMessage={msg.sender === user._id}
              previousMessage={messages[index - 1]}
              showTimestamp={
                index === messages.length - 1 ||
                messages[index + 1]?.sender !== msg.sender ||
                new Date(messages[index + 1]?.timestamp) - new Date(msg.timestamp) > 300000
              }
            />
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {!isAtBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-4 p-2 rounded-full bg-indigo-500 text-white
                   shadow-lg shadow-indigo-500/20 hover:bg-indigo-600"
        >
          <FaArrowDown />
        </button>
      )}

      <div className="shrink-0 p-4 border-t border-indigo-500/20 bg-[#0B1120]/95">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (message.trim()) {
              onSendMessage(message);
              setMessage('');
            }
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-indigo-500/10 border border-indigo-500/20 
                     rounded-lg px-4 py-2.5 text-indigo-300 
                     placeholder-indigo-400/50 focus:outline-none 
                     focus:border-indigo-500/50"
          />
          <button 
            type="submit"
            disabled={!message.trim()}
            className="p-2.5 bg-indigo-500 text-white rounded-lg
                     hover:bg-indigo-600 active:scale-95 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPaperPlane size={16} />
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default Chat;
