import { useEffect, useState } from 'react';
import axios from '../../../Config/Axios';

const ViewSnippetModal = ({ isOpen, onClose, snippetId }) => {
  const [snippet, setSnippet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSnippet = async () => {
      if (!snippetId) return;
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/snippets/${snippetId}`);
        setSnippet(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch snippet');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchSnippet();
    }
  }, [snippetId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{snippet?.title || 'Loading...'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600">{snippet.description || 'No description provided'}</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Code</h3>
              <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                <code className="font-mono text-sm">{snippet.content}</code>
              </pre>
            </div>

            <div className="flex flex-wrap gap-2">
              {snippet.tags.map(tag => (
                <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p>Language: {snippet.programmingLanguage}</p>
                <p>Visibility: {snippet.visibility}</p>
              </div>
              <div>
                <p>Created: {new Date(snippet.createdAt).toLocaleDateString()}</p>
                <p>Last Updated: {new Date(snippet.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p>Views: {snippet.stats?.views || 0}</p>
              <p>Copies: {snippet.stats?.copies || 0}</p>
              <p>Favorites: {snippet.stats?.favorites || 0}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewSnippetModal;