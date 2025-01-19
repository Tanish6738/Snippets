import { createContext, useState, useContext } from 'react';
import axios from '../Config/Axios';

const GroupContext = createContext();

export const GroupProvider = ({ children }) => {
  const [activeGroup, setActiveGroup] = useState(null);
  const [groups, setGroups] = useState([]);

  const createGroup = async (groupData) => {
    try {
      const { data } = await axios.post('/api/groups', groupData);
      setGroups([...groups, data]);
      setActiveGroup(data);
      return data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  };

  const fetchGroups = async () => {
    try {
      const { data } = await axios.get('/api/groups');
      setGroups(data);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  };

  return (
    <GroupContext.Provider value={{ 
      activeGroup, 
      setActiveGroup, 
      groups, 
      createGroup, 
      fetchGroups 
    }}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = () => useContext(GroupContext);