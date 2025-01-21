import { useState } from 'react';
import axios from '../../../Config/Axios';

const ExportDirectoryModal = ({ isOpen, onClose, directoryId }) => {
  const [format, setFormat] = useState('zip');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [options, setOptions] = useState({
    includeMetadata: true,
    includeSnippets: true,
    includeSubdirectories: true,
    flattenStructure: false
  });

  const handleExport = async () => {
    try {
      setLoading(true);
      setError('');

      // Using the export endpoint from directory.controller.js
      const response = await axios.get(`/api/directories/${directoryId}/export`, {
        params: {
          format,
          includeMetadata: options.includeMetadata,
          includeSnippets: options.includeSnippets,
          includeSubdirectories: options.includeSubdirectories,
          flattenStructure: options.flattenStructure
        },
        responseType: 'blob'
      });

      // Process download using Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      let filename = contentDisposition
        ? contentDisposition.split('filename=')[1]
        : `directory-${directoryId}.${format}`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to export directory');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (key) => {
    setOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"></div>
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative max-w-2xl w-full bg-[#0B1120]/95 backdrop-blur-xl rounded-2xl 
                       shadow-lg border border-indigo-500/30 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-indigo-500/20">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 
                           bg-clip-text text-transparent">
                Export Directory
              </h2>
              <button onClick={onClose} className="text-2xl text-indigo-400 
                                                hover:text-indigo-300 transition-colors">×</button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Export Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 
                           text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 
                           transition-all"
                >
                  <option value="zip">ZIP Archive (.zip)</option>
                  <option value="json">JSON (.json)</option>
                </select>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {[
                  { id: 'includeMetadata', label: 'Include metadata (creation date, author, etc.)' },
                  { id: 'includeSnippets', label: 'Include snippets' },
                  { id: 'includeSubdirectories', label: 'Include subdirectories' },
                  { id: 'flattenStructure', label: 'Flatten directory structure' }
                ].map(({ id, label }) => (
                  <div key={id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={id}
                      checked={options[id]}
                      onChange={() => handleOptionChange(id)}
                      className="w-4 h-4 rounded border-indigo-500/50 text-indigo-500 
                               focus:ring-indigo-500/30 bg-indigo-500/10"
                    />
                    <label htmlFor={id} className="ml-3 text-indigo-300">
                      {label}
                    </label>
                  </div>
                ))}
              </div>

              <div className="text-sm text-indigo-400/80">
                Note: Directory export will include all selected content according to your permissions
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-indigo-500/20 bg-indigo-500/5">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-indigo-300 hover:text-indigo-200 
                         hover:bg-indigo-500/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={loading}
                className="px-6 py-2 rounded-xl text-white bg-gradient-to-r from-indigo-500 
                         to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all 
                         shadow-lg shadow-indigo-500/25 disabled:opacity-50"
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

export default ExportDirectoryModal;