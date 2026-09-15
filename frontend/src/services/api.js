const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('apex_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = { error: 'Invalid server response' };
  }

  if (!response.ok) {
    // If session expired or 401 returned
    if (response.status === 401 && token) {
      // Trigger session expired event if client
      window.dispatchEvent(new CustomEvent('session-expired', { detail: data.error }));
    }
    const error = new Error(data.error || 'Something went wrong');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};
