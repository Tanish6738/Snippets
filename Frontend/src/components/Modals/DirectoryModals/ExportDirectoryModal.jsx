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

      const response = await axios.get(`/api/directories/${directoryId}/export`, {
        params: {
          format,
          ...options
        },
        responseType: 'blob'
      });

      // Get filename from header or generate one
      const contentDisposition = response.headers['content-disposition'];
      let filename = `directory.${format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=(.+)/);
        if (filenameMatch?.length > 1) filename = filenameMatch[1];
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Export Directory</h2>
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
              Export Format
            </label>
            <select
              className="w-full border rounded p-2"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="zip">ZIP Archive (.zip)</option>
              <option value="json">JSON (.json)</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeMetadata"
                checked={options.includeMetadata}
                onChange={() => handleOptionChange('includeMetadata')}
                className="rounded border-gray-300"
              />
              <label htmlFor="includeMetadata" className="ml-2 text-sm text-gray-700">
                Include metadata (creation date, author, etc.)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeSnippets"
                checked={options.includeSnippets}
                onChange={() => handleOptionChange('includeSnippets')}
                className="rounded border-gray-300"
              />
              <label htmlFor="includeSnippets" className="ml-2 text-sm text-gray-700">
                Include snippets
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeSubdirectories"
                checked={options.includeSubdirectories}
                onChange={() => handleOptionChange('includeSubdirectories')}
                className="rounded border-gray-300"
              />
              <label htmlFor="includeSubdirectories" className="ml-2 text-sm text-gray-700">
                Include subdirectories
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="flattenStructure"
                checked={options.flattenStructure}
                onChange={() => handleOptionChange('flattenStructure')}
                className="rounded border-gray-300"
              />
              <label htmlFor="flattenStructure" className="ml-2 text-sm text-gray-700">
                Flatten directory structure
              </label>
            </div>
          </div>

          <div className="text-sm text-gray-600 mt-4">
            <p>Note: Directory export will include all selected content according to your permissions</p>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportDirectoryModal;