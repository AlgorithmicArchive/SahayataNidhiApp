import { API_URL } from '@env';
import axiosInstance from './axiosconfig';

console.log('API_URL', `${API_URL}/Home/Login`); // http://192.168.0.100:5000

export async function Login(formData) {
  try {
    const response = await fetch(`${API_URL}/Home/Login`, {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

export async function Validate(data) {
  console.log(
    'Request URL:',
    `${axiosInstance.defaults.baseURL}/Home/Verification`,
  );
  try {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      formData.append(key, value);
    }
    const response = await axiosInstance.post('/Home/Verification', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    console.log('API response:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Validation failed - Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      console.error('Validation failed - No response:', error.request);
    } else {
      console.error('Validation error - Setup:', error.message);
    }
    console.error('Full error:', error);
    throw error;
  }
}
