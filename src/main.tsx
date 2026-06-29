import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global fetch interceptor to automatically append Authorization token if logged in
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const savedUser = localStorage.getItem("autohaus_current_user");
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      if (user && user.token) {
        init = init || {};
        const headers = new Headers(init.headers || {});
        if (!headers.has("Authorization")) {
          headers.set("Authorization", `Bearer ${user.token}`);
        }
        init.headers = headers;
      }
    } catch (e) {
      // ignore parsing error
    }
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
