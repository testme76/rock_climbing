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

// Stream a training plan from Claude AI via SSE
export const streamTrainingPlan = async (payload, onDelta, onPlan, onError) => {
  const url = `${API_URL}/training-plan`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    onError(`Request failed: ${response.status}`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const event = JSON.parse(line.slice(6));
        if (event.type === 'generating') onDelta(event.delta ?? '');
        else if (event.type === 'plan') onPlan(event);
        else if (event.type === 'error') onError(event.message);
      } catch {
        // ignore malformed SSE lines
      }
    }
  }
};

export default api;
