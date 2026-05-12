import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get all test results for a user
export const getTestResults = async (userId = 1) => {
  const response = await api.get(`/test-results/${userId}`);
  return response.data;
};

// Get latest scores for each metric
export const getLatestScores = async (userId = 1) => {
  const response = await api.get(`/test-results/latest/${userId}`);
  return response.data;
};

// Save new test result
export const saveTestResult = async (testData) => {
  const response = await api.post('/test-results', testData);
  return response.data;
};

// Check API health
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
