import axios from "axios";

// Create an Axios instance pointing to your Express backend
const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Interceptor: Runs before every outgoing request
API.interceptors.request.use(
  (config) => {
    // Read the stored user object from browser localStorage
    const savedUser = localStorage.getItem("cospay_user");

    if (savedUser) {
      try {
        const { token } = JSON.parse(savedUser);
        if (token) {
          // Attach Bearer token to headers automatically
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.error("Failed to parse stored user token:", err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;