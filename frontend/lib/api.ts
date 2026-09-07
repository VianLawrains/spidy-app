import axios from 'axios';

// Default to process.env.NEXT_PUBLIC_API_URL or production Render endpoint
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://spidy-app.onrender.com';

export const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('spidy_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only flag true network disconnections where no HTTP response was received
    if ((error.code === 'ERR_NETWORK' || !error.response) && !error.message?.includes('http')) {
      error.message = `Unable to connect to Spidy backend server at ${API_BASE}. Please verify server availability and network connectivity.`;
    }
    return Promise.reject(error);
  }
);

// Auth API Calls (Local FASTAPI + SQLite + Resend Email OTP)
export async function registerApi(data: {
  email: string;
  password: string;
  confirm_password?: string;
  full_name: string;
  username?: string;
  phone_number?: string;
}) {
  const payload = {
    email: data.email,
    password: data.password,
    confirm_password: data.confirm_password || data.password,
    full_name: data.full_name,
    username: data.username,
    phone_number: data.phone_number
  };
  const response = await api.post('/auth/register', payload);
  return response.data;
}

export async function verifyEmailOtpApi(data: { email: string; otp_code: string }) {
  const response = await api.post('/auth/verify-email', data);
  return response.data;
}

export async function verifyOtpApi(data: any, otpCode?: string) {
  const payload = typeof data === 'object' ? data : { email: data, otp_code: otpCode };
  return verifyEmailOtpApi(payload);
}

export async function resendOtpApi(email: string) {
  const response = await api.post('/auth/resend-otp', { email });
  return response.data;
}

export async function forgotPasswordApi(email: string) {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
}

export async function resetPasswordApi(email: any, otpCode?: string, newPassword?: string, confirmPassword?: string) {
  const payload = typeof email === 'object' ? email : {
    email,
    otp_code: otpCode,
    new_password: newPassword,
    confirm_password: confirmPassword
  };
  const response = await api.post('/auth/reset-password', payload);
  return response.data;
}

export async function loginApi(data: { email: string; password: string }) {
  const response = await api.post('/auth/login', data);
  return response.data;
}

export async function getMeApi() {
  const response = await api.get('/auth/me');
  return response.data;
}

export async function logoutApi() {
  const response = await api.post('/auth/logout');
  return response.data;
}

export async function getProfileApi() {
  const response = await api.get('/profile');
  return response.data;
}

export async function updateProfileApi(data: any) {
  const response = await api.put('/profile', data);
  return response.data;
}

// Conversation & Chat APIs
export async function fetchConversationsApi() {
  const response = await api.get('/chat/conversations');
  return response.data;
}

export async function createConversationApi(title: string) {
  const response = await api.post('/chat/conversations', { title });
  return response.data;
}

export async function deleteConversationApi(chatId: string) {
  const response = await api.delete(`/chat/conversations/${chatId}`);
  return response.data;
}

export async function togglePinConversationApi(chatId: string) {
  const response = await api.put(`/chat/conversations/${chatId}/pin`);
  return response.data;
}

export async function sendMessageApi(message: string, chatId?: string, model?: string) {
  const response = await api.post('/chat/message', {
    message,
    chat_id: chatId,
    model: model || 'gemini-3.6-flash',
  });
  return response.data;
}

export async function generateImageApi(prompt: string, aspect_ratio: string = '1:1') {
  const params = new URLSearchParams();
  params.append('prompt', prompt);
  params.append('aspect_ratio', aspect_ratio);

  const response = await api.post('/images/generate', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
}

export async function uploadDocApi(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/docs/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
}

export async function uploadDocumentApi(file: File) {
  return uploadDocApi(file);
}

export async function fetchNewsFeedApi(category?: string) {
  const response = await api.get('/news/feed', { params: { category } });
  return response.data;
}

export async function processToolApi(toolName: string, payload?: any) {
  const response = await api.post(`/tools/${toolName}`, payload);
  return response.data;
}
