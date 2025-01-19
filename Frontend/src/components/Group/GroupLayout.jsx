import { useState, useEffect } from 'react';
import { useParams, Routes, Route } from 'react-router-dom';
import { useGroup } from '../../Context/GroupContext';
import axios from '../../Config/Axios';
import Snippet from '../Snippets/Snippet';
import DirectoryComponent from '../Directory/DirectoryComponent';

const GroupLayout = () => {
  const { id } = useParams();
  const { activeGroup, setActiveGroup } = useGroup();
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(250);

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const { data } = await axios.get(`/api/groups/${id}`);
        setActiveGroup(data);
      } catch (error) {
        console.error('Error fetching group:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupDetails();
  }, [id]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div 
        className="bg-gray-800 text-white"
        style={{ width: `${sidebarWidth}px` }}
      >
        <div className="p-4">
          <h2 className="text-xl font-bold">{activeGroup?.name}</h2>
        </div>
        <div className="p-4 space-y-4">
          <button 
            className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded"
            onClick={() => {/* Handle new snippet */}}
          >
            New Snippet
          </button>
          <button 
            className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded"
            onClick={() => {/* Handle new directory */}}
          >
            New Directory
          </button>
        </div>
        <div className="mt-4">
          <div className="px-4 py-2 text-gray-400 uppercase text-sm">
            Snippets
          </div>
          {/* List snippets */}
          <div className="px-4 py-2 text-gray-400 uppercase text-sm">
            Directories
          </div>
          {/* List directories */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="snippets/*" element={<Snippet />} />
          <Route path="directories/*" element={<DirectoryComponent />} />
        </Routes>
      </div>
    </div>
  );
};

export default GroupLayout;