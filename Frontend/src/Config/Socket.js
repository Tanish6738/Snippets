import socket from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

export const recieveMessage = (eventName, callback) => {
    if (socketInstance) {
        console.log('Setting up listener for:', eventName);
        socketInstance.on(eventName, (data) => {
            console.log('Received message:', {
                event: eventName,
                data: data
            });
            callback(data);
        });
    }
}

export const sendMessage = (eventName,data) => {
    if(socketInstance){
        socketInstance.emit(eventName,data);
    }
}