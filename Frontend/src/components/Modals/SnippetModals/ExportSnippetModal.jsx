import { useState } from 'react';
import axios from '../../../Config/Axios';

const ExportSnippetModal = ({ isOpen, onClose, itemId, itemType }) => {
  const [format, setFormat] = useState('txt');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeTags, setIncludeTags] = useState(true);

  const handleExport = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.get(`/api/snippets/${itemId}/export`, {
        params: {
          format,
          includeMetadata,
          includeTags
        },
        responseType: 'blob'
      });

      // Get filename from header or generate one
      const contentDisposition = response.headers['content-disposition'];
      let filename = `snippet.${format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=(.+)/);
        if (filenameMatch.length > 1) filename = filenameMatch[1];
      }

      // Create and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      link.remove();
      onClose();
    } catch (err) {
      console.error('Export error:', err);
      setError(err.response?.data?.error || 'Failed to export snippet');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm"></div>
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative max-w-md w-full bg-[#0B1120]/95 backdrop-blur-xl rounded-2xl shadow-lg border border-indigo-500/30 overflow-hidden transition-all transform duration-300 ease-in-out hover:border-indigo-400/50 hover:shadow-indigo-500/10">
          <div className="px-6 py-4 border-b border-indigo-500/20">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                Export {itemType}
              </h2>
              <button onClick={onClose} className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200 text-2xl font-semibold">×</button>
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-indigo-300 mb-2">Export Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
              >
                <option value="txt">Plain Text (.txt)</option>
                <option value="md">Markdown (.md)</option>
                <option value="json">JSON (.json)</option>
                {itemType === 'directory' && <option value="zip">ZIP Archive (.zip)</option>}
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="includeMetadata"
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                  className="w-4 h-4 rounded border-indigo-500/50 bg-indigo-500/10 text-indigo-500 focus:ring-indigo-500/50"
                />
                <label htmlFor="includeMetadata" className="text-sm text-indigo-300">
                  Include metadata
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="includeTags"
                  checked={includeTags}
                  onChange={(e) => setIncludeTags(e.target.checked)}
                  className="w-4 h-4 rounded border-indigo-500/50 bg-indigo-500/10 text-indigo-500 focus:ring-indigo-500/50"
                />
                <label htmlFor="includeTags" className="text-sm text-indigo-300">
                  Include tags
                </label>
              </div>
            </div>

            <div className="text-sm text-indigo-400/80">
              <p>Note: {itemType === 'directory' ? 'Directory export will include all contained snippets' : 'Snippet export will include selected metadata'}</p>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-indigo-500/20 bg-indigo-500/5">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={loading}
                className="px-6 py-2 rounded-xl text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_25px_rgba(99,102,241,0.35)] disabled:opacity-50"
              >
                {loading ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportSnippetModal;