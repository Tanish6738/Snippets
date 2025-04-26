import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Dialog } from '@headlessui/react';
import { FaTimes, FaSave, FaCode } from 'react-icons/fa';
import axios from '../../../Config/Axios';

const EditSnippetModal = ({ isOpen, onClose, snippet, onSnippetUpdated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [programmingLanguage, setProgrammingLanguage] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load snippet data when the modal opens or snippet changes
  useEffect(() => {
    if (snippet) {
      setTitle(snippet.title || snippet.name || '');
      setContent(snippet.content || '');
      setProgrammingLanguage(snippet.programmingLanguage || '');
      setTags(snippet.tags ? snippet.tags.join(', ') : '');
      setIsPublic(snippet.visibility === 'public');
    }
  }, [snippet]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) {
      setError('Title and content are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      // Process tags string to array
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const response = await axios.patch(`/api/snippets/${snippet._id}`, {
        title,
        content,
        programmingLanguage,
        tags: tagsArray,
        visibility: isPublic ? 'public' : 'private'
      });

      setIsSubmitting(false);
      onSnippetUpdated(response.data);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setError(err.response?.data?.message || 'Failed to update snippet');
      console.error('Error updating snippet:', err);
    }
  };

  if (!isOpen || !snippet) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl rounded-lg bg-slate-900 shadow-lg border border-slate-700">
          <div className="flex justify-between items-center p-6 border-b border-slate-700">
            <Dialog.Title className="text-xl font-semibold text-slate-200 flex items-center gap-2">
              <FaCode className="text-indigo-500" />
              Edit Snippet
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors"
              disabled={isSubmitting}
            >
              <FaTimes size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label 
                htmlFor="title" 
                className="block text-sm font-medium text-slate-300"
              >
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg
                         text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2
                         focus:ring-indigo-500"
                placeholder="Snippet title"
                required
              />
            </div>

            <div className="space-y-2">
              <label 
                htmlFor="content" 
                className="block text-sm font-medium text-slate-300"
              >
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg
                         text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2
                         focus:ring-indigo-500 font-mono"
                placeholder="// Your code here..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label 
                  htmlFor="language" 
                  className="block text-sm font-medium text-slate-300"
                >
                  Programming Language
                </label>
                <input
                  type="text"
                  id="language"
                  value={programmingLanguage}
                  onChange={(e) => setProgrammingLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg
                           text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2
                           focus:ring-indigo-500"
                  placeholder="e.g. JavaScript, Python"
                />
              </div>

              <div className="space-y-2">
                <label 
                  htmlFor="tags" 
                  className="block text-sm font-medium text-slate-300"
                >
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg
                           text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2
                           focus:ring-indigo-500"
                  placeholder="e.g. frontend, utility, algorithm"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="isPublic"
                type="checkbox"
                checked={isPublic}
                onChange={() => setIsPublic(!isPublic)}
                className="w-4 h-4 text-indigo-500 border-slate-700 rounded
                         focus:ring-indigo-500 focus:ring-opacity-25 bg-slate-800"
              />
              <label 
                htmlFor="isPublic" 
                className="ml-2 text-sm font-medium text-slate-300"
              >
                Make this snippet public
              </label>
            </div>

            <div className="flex justify-end pt-4 gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-300 
                         bg-slate-800 border border-slate-700 rounded-lg 
                         hover:bg-slate-700 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white 
                         bg-indigo-600 rounded-lg hover:bg-indigo-700 
                         transition-colors flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">
                      <FaCode size={14} />
                    </span>
                    Updating...
                  </>
                ) : (
                  <>
                    <FaSave size={14} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

EditSnippetModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  snippet: PropTypes.object,
  onSnippetUpdated: PropTypes.func.isRequired
};

export default EditSnippetModal;
