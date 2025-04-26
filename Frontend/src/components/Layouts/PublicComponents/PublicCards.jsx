import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import Highlighter from 'react-highlight-words';
import {
  FiCode,
  FiFolder,
  FiUsers,
  FiStar,
  FiEye,
  FiCopy,
  FiDownload,
  FiShare2
} from 'react-icons/fi';

// Helper function for search highlighting
const getSearchWords = (searchQuery) => {
  return searchQuery
    ? searchQuery.toLowerCase().split(/\s+/).filter(word => word.length > 0)
    : [];
};

// Skeleton loading component
const ItemCardSkeleton = () => (
  <div className="animate-pulse bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
    <div className="h-6 bg-slate-700/50 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-slate-700/50 rounded w-full mb-3"></div>
    <div className="h-4 bg-slate-700/50 rounded w-2/3 mb-4"></div>
    <div className="flex justify-between items-center">
      <div className="h-4 bg-slate-700/50 rounded w-20"></div>
      <div className="h-4 bg-slate-700/50 rounded w-20"></div>
    </div>
  </div>
);

// Snippet Card Component
const SnippetCard = ({ item, searchQuery = '', handleViewSnippet, setShowExportModal, setSelectedSnippetId }) => {
  const [copyStatus, setCopyStatus] = useState('');

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(item.content || '');
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    } catch (err) {
      setCopyStatus('Failed to copy');
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-slate-800/50 rounded-xl border border-slate-700/50 
                hover:border-slate-600/50 transition-all duration-300 overflow-hidden shadow-lg"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-300 truncate">
              <Highlighter
                highlightClassName="bg-slate-700/50 text-slate-200 px-1 rounded"
                searchWords={getSearchWords(searchQuery)}
                textToHighlight={item.title}
                autoEscape={true}
              />
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.author}`}
                alt={item.author}
                className="w-5 h-5 rounded-full border border-slate-600/50"
              />
              <span className="text-xs text-slate-400">{item.author}</span>
            </div>
          </div>
          <span className="px-3 py-1 text-xs rounded-full bg-slate-700/50 text-slate-300 border border-slate-600/50">
            {item.language || 'text'}
          </span>
        </div>

        <p className="text-sm text-slate-400 mb-4 line-clamp-2">
          <Highlighter
            highlightClassName="bg-slate-700/50 text-slate-200 px-1 rounded"
            searchWords={getSearchWords(searchQuery)}
            textToHighlight={item.description}
            autoEscape={true}
          />
        </p>

        <div className="bg-slate-900/50 rounded-lg p-3 mb-4 border border-slate-700/50">
          <pre className="text-xs text-slate-300 overflow-x-auto">
            <code>{item.codePreview || '// Code snippet preview'}</code>
          </pre>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleViewSnippet(item.id)}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
            >
              <FiEye className="text-lg" />
              <span className="text-xs">View</span>
            </button>
            <button
              onClick={() => {
                setShowExportModal(true);
                setSelectedSnippetId(item.id);
              }}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
            >
              <FiDownload className="text-lg" />
              <span className="text-xs">Export</span>
            </button>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
            >
              <FiCopy className="text-lg" />
              <span className="text-xs">{copyStatus || 'Copy'}</span>
            </button>
          </div>
          <div className="flex gap-1">
            {(item.tags || []).slice(0, 2).map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-1 text-xs rounded-full bg-slate-700/50 text-slate-300 border border-slate-600/50"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Directory Card Component
const DirectoryCard = ({ item, searchQuery = '' }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="bg-slate-800/50 rounded-xl border border-slate-700/50 
              hover:border-slate-600/50 transition-all duration-300 relative overflow-hidden"
  >
    <div className="p-6 relative z-10">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-700/50 rounded-lg">
            <FiFolder className="text-slate-300 text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-slate-300">
              <Highlighter
                highlightClassName="bg-slate-700/50 text-slate-200 px-1 rounded"
                searchWords={getSearchWords(searchQuery)}
                textToHighlight={item.title}
                autoEscape={true}
              />
            </h3>
            <span className="text-xs text-slate-400">
              Created by {item.author}
            </span>
          </div>
        </div>
        <span className="px-3 py-1 text-xs rounded-full bg-slate-700/50 text-slate-300">
          {item.visibility || 'Public'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-700/30 rounded-lg p-4 text-center backdrop-blur-sm">
          <div className="text-2xl font-bold text-slate-300">{item.itemCount || 0}</div>
          <div className="text-xs text-slate-400 mt-1">Items</div>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-4 text-center backdrop-blur-sm">
          <div className="text-2xl font-bold text-slate-300">{item.members || 0}</div>
          <div className="text-xs text-slate-400 mt-1">Members</div>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-4 text-center backdrop-blur-sm">
          <div className="text-2xl font-bold text-slate-300">{item.stars || 0}</div>
          <div className="text-xs text-slate-400 mt-1">Stars</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400 line-clamp-2">
          <Highlighter
            highlightClassName="bg-slate-700/50 text-slate-200 px-1 rounded"
            searchWords={getSearchWords(searchQuery)}
            textToHighlight={item.description}
            autoEscape={true}
          />
        </p>
        <button className="p-2 rounded-lg bg-slate-700/50 text-slate-300 
                        hover:bg-slate-700/70 transition-colors">
          <FiShare2 />
        </button>
      </div>
    </div>
  </motion.div>
);

// Group Card Component
const GroupCard = ({ item, searchQuery = '' }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="bg-slate-800/50 rounded-xl border border-slate-700/50 
              hover:border-slate-600/50 transition-all duration-300 relative overflow-hidden"
  >
    <div className="p-6 relative z-10">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-700/50 rounded-lg">
            <FiUsers className="text-slate-300 text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-slate-300">
              <Highlighter
                highlightClassName="bg-slate-700/50 text-slate-200 px-1 rounded"
                searchWords={getSearchWords(searchQuery)}
                textToHighlight={item.title}
                autoEscape={true}
              />
            </h3>
            <span className="text-xs text-slate-400">
              Created by {item.author}
            </span>
          </div>
        </div>
        <span className="px-3 py-1 text-xs rounded-full bg-slate-700/50 text-slate-300">
          {item.visibility || 'Public'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-slate-700/30 rounded-lg p-4 text-center backdrop-blur-sm">
          <div className="text-2xl font-bold text-slate-300">{item.memberCount || 0}</div>
          <div className="text-xs text-slate-400 mt-1">Members</div>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-4 text-center backdrop-blur-sm">
          <div className="text-2xl font-bold text-slate-300">{item.snippetCount || 0}</div>
          <div className="text-xs text-slate-400 mt-1">Snippets</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {/* Avatar stack for visual representation */}
          {[...Array(Math.min(3, item.memberCount || 3))].map((_, i) => (
            <img
              key={i}
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`}
              alt="Member avatar"
              className="w-8 h-8 rounded-full border-2 border-slate-900"
            />
          ))}
          {(item.memberCount || 0) > 3 && (
            <div className="w-8 h-8 rounded-full bg-slate-700/50 border-2 border-slate-900
                          flex items-center justify-center text-xs text-slate-300">
              +{item.memberCount - 3}
            </div>
          )}
        </div>
        <button className="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 
                        hover:bg-slate-700/70 transition-colors flex items-center gap-2">
          <FiUsers className="text-sm" />
          Join Group
        </button>
      </div>
    </div>
  </motion.div>
);

// Generic Item Card Component
const ItemCard = ({ item, searchQuery, handleViewSnippet, setShowExportModal, setSelectedSnippetId }) => {
  switch (item.type) {
    case 'snippet':
      return <SnippetCard 
        item={item} 
        searchQuery={searchQuery}
        handleViewSnippet={handleViewSnippet}
        setShowExportModal={setShowExportModal}
        setSelectedSnippetId={setSelectedSnippetId}
      />;
    case 'directory':
      return <DirectoryCard item={item} searchQuery={searchQuery} />;
    case 'group':
      return <GroupCard item={item} searchQuery={searchQuery} />;
    default:
      return null;
  }
};

// PropTypes
SnippetCard.propTypes = {
  item: PropTypes.object.isRequired,
  searchQuery: PropTypes.string,
  handleViewSnippet: PropTypes.func.isRequired,
  setShowExportModal: PropTypes.func.isRequired,
  setSelectedSnippetId: PropTypes.func.isRequired
};

DirectoryCard.propTypes = {
  item: PropTypes.object.isRequired,
  searchQuery: PropTypes.string
};

GroupCard.propTypes = {
  item: PropTypes.object.isRequired,
  searchQuery: PropTypes.string
};

ItemCard.propTypes = {
  item: PropTypes.object.isRequired,
  searchQuery: PropTypes.string,
  handleViewSnippet: PropTypes.func.isRequired,
  setShowExportModal: PropTypes.func.isRequired,
  setSelectedSnippetId: PropTypes.func.isRequired
};

export {
  ItemCardSkeleton,
  SnippetCard,
  DirectoryCard,
  GroupCard,
  ItemCard,
  getSearchWords
};
