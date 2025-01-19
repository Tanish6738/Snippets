import { createContext, useState, useContext } from 'react';
import axios from '../Config/Axios';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  const login = async (credentials) => {
    try {
      const { data } = await axios.post('/api/users/login', credentials);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await axios.post('/api/users/register', userData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <UserContext.Provider value={{ user, isAuthenticated, login, register, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);