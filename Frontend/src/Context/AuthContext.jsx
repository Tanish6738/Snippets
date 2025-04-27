import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create context
const AuthContext = createContext();

// API base URL from environment variable or default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Authentication Provider Component
 * 
 * Provides authentication state and methods to the application
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configure axios with token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Load user data on initialization
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/users/me`);
        setCurrentUser(response.data);
      } catch (err) {
        console.error('Error loading user:', err);
        // If token is invalid, clear it
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setToken(null);
        }
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  /**
   * Login user with email and password
   * @param {Object} credentials - User credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise<Object>} - User data
   */
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      const { token: newToken, user } = response.data;
      
      setToken(newToken);
      setCurrentUser(user);
      return user;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register a new user
   * @param {Object} userData - New user data
   * @returns {Promise<Object>} - User data
   */
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      const { token: newToken, user } = response.data;
      
      setToken(newToken);
      setCurrentUser(user);
      return user;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout current user
   */
  const logout = () => {
    setToken(null);
    setCurrentUser(null);
  };

  /**
   * Update user profile
   * @param {Object} updateData - User profile update data
   * @returns {Promise<Object>} - Updated user data
   */
  const updateProfile = async (updateData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.put(`${API_URL}/users/me`, updateData);
      setCurrentUser(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user is authenticated
   * @returns {boolean} - Authentication status
   */
  const isAuthenticated = !!currentUser;

  // Context value
  const value = {
    currentUser,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use the auth context
 * @returns {Object} Auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
