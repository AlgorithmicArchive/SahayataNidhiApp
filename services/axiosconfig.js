// axiosConfig.js
import axios from 'axios';
import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Request interceptor: attach token from AsyncStorage
axiosInstance.interceptors.request.use(
  async config => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (err) {
      console.error('Token retrieval error:', err);
    }
    return config;
  },
  error => Promise.reject(error),
);

// Response interceptor: handle 401 globally
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('userType');
      } catch (e) {
        console.error('Error clearing storage on 401:', e);
      }
      // option: you could emit an event or update your auth context here
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
