import axios from 'axios';

const TOKEN_KEY = 'agri_token';

export const tokenStore = {
  get: () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set: (token) => {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* storage unavailable */ }
  },
  clear: () => {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ }
  },
};

const http = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 20000 });

http.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired/revoked token on a protected call signs the user out everywhere in the UI.
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config && error.config.url ? error.config.url : '';
    const isAuthForm = /\/auth\/(login|register)$/.test(url);
    if (error.response && error.response.status === 401 && !isAuthForm && tokenStore.get()) {
      tokenStore.clear();
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  }
);

const call = async (config) => (await http(config)).data; // { success, message, data, meta? }

export const api = {
  get: (url, params) => call({ method: 'get', url, params }),
  post: (url, data) => call({ method: 'post', url, data }),
  put: (url, data) => call({ method: 'put', url, data }),
  patch: (url, data) => call({ method: 'patch', url, data }),
  del: (url) => call({ method: 'delete', url }),
};

export function errorMessage(error) {
  if (error && error.response && error.response.data && error.response.data.message) return error.response.data.message;
  if (error && error.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (error && error.request && !error.response) return 'Cannot reach the server. Check your internet connection and try again.';
  return 'Something went wrong. Please try again.';
}

// Server validation errors arrive as { field: message }.
export function fieldErrors(error) {
  const details = error && error.response && error.response.data && error.response.data.error;
  return details && typeof details === 'object' ? details : {};
}

export const statusOf = (error) => (error && error.response ? error.response.status : 0);

// Builds an error shaped like an API validation error so forms can raise client-side cross-field errors.
export const formError = (message, errors) => ({ response: { status: 422, data: { success: false, message, error: errors } } });
