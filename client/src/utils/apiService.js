import axios from 'axios';

const API_URL = '/api'; // This will use the proxy set up in vite.config.js

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to handle offline status
api.interceptors.request.use(
  (config) => {
    if (!navigator.onLine) {
      return Promise.reject(new Error('No internet connection'));
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Chat related API calls
export const sendChatMessage = async (message, language = 'en') => {
  try {
    const response = await api.post('/chat/message', { message, language });
    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

export const getTriageResult = async (symptom, answers = []) => {
  try {
    const response = await api.post('/symptomChecker/triage', { 
      symptom, 
      answers 
    });
    return response.data;
  } catch (error) {
    console.error('Error getting triage result:', error);
    throw error;
  }
};

// Booking related API calls
export const createBooking = async (bookingData) => {
  try {
    const response = await api.post('/booking/create', bookingData);
    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

export const syncBookings = async (bookings) => {
  try {
    const response = await api.post('/booking/sync', { bookings });
    return response.data;
  } catch (error) {
    console.error('Error syncing bookings:', error);
    throw error;
  }
};

// Prescription related API calls
export const getPrescription = async (id) => {
  try {
    const response = await api.get(`/prescription/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error getting prescription:', error);
    throw error;
  }
};

export const redeemPrescription = async (id) => {
  try {
    const response = await api.post(`/prescription/${id}/redeem`);
    return response.data;
  } catch (error) {
    console.error('Error redeeming prescription:', error);
    throw error;
  }
};

// Dashboard related API calls
export const getPatients = async () => {
  try {
    const response = await api.get('/dashboard/patients');
    return response.data;
  } catch (error) {
    console.error('Error getting patients:', error);
    throw error;
  }
};

// Language related API calls
export const getSupportedLanguages = async () => {
  try {
    const response = await api.get('/chat/languages');
    return response.data;
  } catch (error) {
    console.error('Error getting supported languages:', error);
    throw error;
  }
};

export default api;