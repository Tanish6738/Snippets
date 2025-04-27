import { io } from 'socket.io-client';

let socketInstance = null;

/**
 * Initialize a Socket.IO connection for a group or project.
 * @param {Object} options - { groupId, projectId, token, namespace }
 * @returns {Socket} Socket.IO client instance
 */
export const initializeSocket = ({ groupId, projectId, token, namespace = '' }) => {
  if (socketInstance) {
    socketInstance.disconnect();
  }

  const URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const query = {};
  if (groupId) query.groupId = groupId;
  if (projectId) query.projectId = projectId;

  // Namespace support (e.g., '/groups', '/projects')
  const ns = namespace ? `${URL}${namespace}` : URL;

  socketInstance = io(ns, {
    query,
    auth: { token: token || localStorage.getItem('token') },
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
  });

  socketInstance.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
  socketInstance.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    if (reason === 'io server disconnect') {
      socketInstance.connect();
    }
  });
  socketInstance.on('reconnect', (attemptNumber) => {
    console.log('Socket reconnected after', attemptNumber, 'attempts');
  });
  socketInstance.on('reconnect_error', (error) => {
    console.error('Socket reconnection error:', error);
  });

  return socketInstance;
};

export const sendMessage = (event, data) => {
  if (!socketInstance) return;
  socketInstance.emit(event, data);
};

export const receiveMessage = (event, callback) => {
  if (!socketInstance) return;
  socketInstance.on(event, callback);
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

export const getSocket = () => socketInstance;