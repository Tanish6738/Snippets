import { useState, useEffect } from 'react';
import axios from '../../Config/Axios';

const ShareLinkModal = ({ isOpen, onClose, itemId, itemType }) => {
  const [shareLink, setShareLink] = useState('');
  const [expiryDuration, setExpiryDuration] = useState('24h');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [shareSettings, setShareSettings] = useState({
    visibility: 'private',
    allowComments: true,
    requireLogin: false
  });

  useEffect(() => {
    if (isOpen && itemId) {
      generateShareLink();
    }
  }, [isOpen, itemId, expiryDuration]);

  const generateShareLink = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data } = await axios.post(`/api/snippets/${itemId}/share-link`, {
        expiryDuration,
        ...shareSettings
      });
      
      if (data.success) {
        // Construct the share URL using the snippet ID
        const baseUrl = window.location.origin;
        const shareUrl = `${baseUrl}/shared-snippet/${data.snippetId}`;
        setShareLink(shareUrl);
      } else {
        setError('Failed to generate share link');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleVisibilityChange = (e) => {
    setShareSettings(prev => ({
      ...prev,
      visibility: e.target.value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Share {itemType}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Settings
            </label>
            <select
              className="w-full border rounded p-2"
              value={shareSettings.visibility}
              onChange={handleVisibilityChange}
            >
              <option value="private">Private (Only with specific people)</option>
              <option value="public">Public (Anyone with the link)</option>
              <option value="restricted">Restricted (Logged in users only)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link Expiration
            </label>
            <select
              className="w-full border rounded p-2"
              value={expiryDuration}
              onChange={(e) => setExpiryDuration(e.target.value)}
            >
              <option value="1h">1 hour</option>
              <option value="24h">24 hours</option>
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="never">Never</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allowComments"
              checked={shareSettings.allowComments}
              onChange={(e) => setShareSettings(prev => ({
                ...prev,
                allowComments: e.target.checked
              }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="allowComments" className="text-sm text-gray-700">
              Allow comments
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="requireLogin"
              checked={shareSettings.requireLogin}
              onChange={(e) => setShareSettings(prev => ({
                ...prev,
                requireLogin: e.target.checked
              }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="requireLogin" className="text-sm text-gray-700">
              Require login to access
            </label>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Link
            </label>
            <div className="flex">
              <input
                type="text"
                readOnly
                value={shareLink}
                className="flex-1 border rounded-l p-2 bg-gray-50"
              />
              <button
                onClick={copyToClipboard}
                disabled={loading}
                className={`px-4 py-2 rounded-r ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={generateShareLink}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {loading ? 'Generating...' : 'Generate New Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareLinkModal;