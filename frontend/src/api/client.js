import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Axios client with environment-aware API base URL (falling back to local Vite dev proxy)
const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token and active Branch ID
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    const activeBranchId = localStorage.getItem('selected_branch') || localStorage.getItem('branch_id');
    if (activeBranchId && activeBranchId !== 'undefined' && activeBranchId !== 'null') {
      config.headers['X-Branch-ID'] = activeBranchId;
      if (config.method === 'get') {
        config.params = config.params || {};
        if (!config.params.branch) {
          config.params.branch = activeBranchId;
        }
        if (!config.params.branch_id) {
          config.params.branch_id = activeBranchId;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to automatically refresh expired tokens
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Ignore 401s for login/logout endpoints
    const requestUrl = originalRequest?.url || '';
    if (requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register') || requestUrl.includes('/auth/forgot-password')) {
      return Promise.reject(error);
    }

    console.log("=== CLIENT INTERCEPTOR ERROR ===");
    console.log("status:", error.response?.status);
    console.log("url:", requestUrl);

    // Check if error is 401 (Unauthorized) and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null') {
        try {
          console.log("[CLIENT INTERCEPTOR] Attempting token refresh...");
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          
          const newAccessToken = data.data?.access || data.access;
          if (newAccessToken) {
            console.log("[CLIENT INTERCEPTOR] Token refresh success");
            localStorage.setItem('access_token', newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return client(originalRequest);
          }
        } catch (refreshError) {
          console.error("[CLIENT INTERCEPTOR] Token refresh failed:", refreshError);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        console.warn("[CLIENT INTERCEPTOR] 401 error and no refresh token available");
        // Clear session and redirect only if unauthorized on a protected endpoint
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default client;
