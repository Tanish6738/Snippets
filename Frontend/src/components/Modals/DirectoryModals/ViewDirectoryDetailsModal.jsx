import { useState, useEffect } from 'react';
import axios from '../../../Config/Axios';

const ViewDirectoryDetailsModal = ({ isOpen, onClose, directoryId }) => {
  const [directory, setDirectory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDirectoryDetails = async () => {
      if (!directoryId) return;
      try {
        setLoading(true);
        setError('');
        const { data } = await axios.get(`/api/directories/${directoryId}`);
        setDirectory(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load directory details');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && directoryId) {
      fetchDirectoryDetails();
    }
  }, [isOpen, directoryId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{directory?.name || 'Loading...'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Path</h3>
              <p className="text-gray-600 bg-gray-50 p-2 rounded">{directory.path}</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Snippets</p>
                  <p className="font-medium">{directory.metadata.snippetCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Subdirectories</p>
                  <p className="font-medium">{directory.metadata.subDirectoryCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Size</p>
                  <p className="font-medium">{(directory.metadata.size / 1024).toFixed(2)} KB</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Visibility</p>
                  <p className="font-medium capitalize">{directory.visibility}</p>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p>Created: {new Date(directory.createdAt).toLocaleDateString()}</p>
              <p>Last Updated: {new Date(directory.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewDirectoryDetailsModal;