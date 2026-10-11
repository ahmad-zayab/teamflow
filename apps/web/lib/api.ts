import axios from 'axios';

// Create a singleton Axios instance configured for our NestJS backend
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  withCredentials: true, // Automatically send and receive HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});
