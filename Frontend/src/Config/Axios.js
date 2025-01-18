import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:3000', // Make sure this matches your backend URL
    timeout: 30000, // Increased timeout for large files
});

// Request interceptor
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 and we haven't tried to refresh the token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Try to refresh the token or re-authenticate
                const refreshResponse = await instance.post('/api/users/refresh-token');
                if (refreshResponse.data.token) {
                    localStorage.setItem('token', refreshResponse.data.token);
                    originalRequest.headers['Authorization'] = `Bearer ${refreshResponse.data.token}`;
                    // Retry the original request
                    return instance(originalRequest);
                }
            } catch (refreshError) {
                // If refresh fails, clear token and redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default instance;