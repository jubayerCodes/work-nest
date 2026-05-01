import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // sends httpOnly cookies automatically
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
type FailedRequest = { resolve: (v: unknown) => void; reject: (e: unknown) => void };
let failedQueue: FailedRequest[] = [];

function processQueue(error: unknown) {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(null)
  );
  failedQueue = [];
}

// Response interceptor: on 401, attempt token refresh once
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    // Never retry auth endpoints — a 401 from /auth/login means wrong password, not expired token
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');
    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest!))
          .catch((e) => Promise.reject(e));
      }

      originalRequest!._retry = true;
      isRefreshing = true;

      try {
        await api.post('/auth/refresh');
        processQueue(null);
        return api(originalRequest!);
      } catch (refreshError) {
        processQueue(refreshError);
        // Clear auth state and redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
