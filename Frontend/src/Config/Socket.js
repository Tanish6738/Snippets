import socket from 'socket.io-client';

const URL = 'http://localhost:3000' || process.env.VITE_API_URL;

let socketInstance = null;

export const initializeSocket = (groupId) => {
    socketInstance = socket(URL, {
        auth: {
            token: localStorage.getItem('token')
        },
        withCredentials: true,
        transports: ['websocket', 'polling'],
        query: {
            groupId
        }
    });

    return socketInstance;
}

export const recieveMessage = (eventName,callback) => {
    if(socketInstance){
        socketInstance.on(eventName,callback);
    }
}

export const sendMessage = (eventName,data) => {
    if(socketInstance){
        socketInstance.emit(eventName,data);
    }
}