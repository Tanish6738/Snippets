import { useState, useEffect } from 'react';
import axios from '../../Config/Axios';

const ShareLinkModal = ({ isOpen, onClose, itemId, itemType }) => {
  const [shareLink, setShareLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [linkToken, setLinkToken] = useState('');
  const [shareSettings, setShareSettings] = useState({
    visibility: 'private',
    allowComments: true,
    requireLogin: false,
    expiryDuration: '24h'
  });

  useEffect(() => {
    if (isOpen && itemId) {
      generateShareLink();
    }
  }, [isOpen, itemId, shareSettings.expiryDuration]);

  const generateShareLink = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data } = await axios.post(`/api/${itemType}s/${itemId}/share-link`, {
        visibility: shareSettings.visibility,
        allowComments: shareSettings.allowComments,
        requireLogin: shareSettings.requireLogin,
        expiryDuration: shareSettings.expiryDuration
      });
      
      if (data.success && data.snippetId) {
        const baseUrl = window.location.origin;
        const shareUrl = `${baseUrl}/shared/${itemType}/${data.snippetId}`;
        setShareLink(shareUrl);
        setLinkToken(data.token);
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
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm"></div>
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative max-w-2xl w-full bg-[#0B1120]/95 backdrop-blur-xl rounded-2xl shadow-lg border border-indigo-500/30 overflow-hidden">
          <div className="px-6 py-4 border-b border-indigo-500/20">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                Share {itemType}
              </h2>
              <button onClick={onClose} className="text-indigo-400 hover:text-indigo-300 transition-colors">×</button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">Share Settings</label>
                <select
                  className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  value={shareSettings.visibility}
                  onChange={handleVisibilityChange}
                >
                  <option value="private">Private (Only with specific people)</option>
                  <option value="public">Public (Anyone with the link)</option>
                  <option value="restricted">Restricted (Logged in users only)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Link Expiration
                </label>
                <select
                  className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  value={shareSettings.expiryDuration}
                  onChange={(e) => setShareSettings(prev => ({
                    ...prev,
                    expiryDuration: e.target.value
                  }))}
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
                <label className="block text-sm font-medium text-indigo-300 mb-2">Share Link</label>
                <div className="flex">
                  <input
                    type="text"
                    readOnly
                    value={shareLink}
                    className="flex-1 px-4 py-3 rounded-l-xl bg-indigo-500/10 border border-indigo-500/20 text-white"
                  />
                  <button
                    onClick={copyToClipboard}
                    disabled={loading}
                    className={`px-6 py-3 rounded-r-xl ${
                      copied
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30'
                    } transition-all`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-indigo-500/20 bg-indigo-500/5">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 transition-all"
              >
                Close
              </button>
              <button
                onClick={generateShareLink}
                disabled={loading}
                className="px-6 py-2 rounded-xl text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all shadow-lg shadow-indigo-500/25"
              >
                {loading ? 'Generating...' : 'Generate New Link'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareLinkModal;