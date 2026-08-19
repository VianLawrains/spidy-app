import axios from 'axios';

// Default to http://127.0.0.1:8000 for local dev or process.env.NEXT_PUBLIC_API_URL for production
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
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
}) {
  const res = await api.post('/auth/register', data);
  return res.data;
}

export async function verifyOtpApi(email: string, otpCode: string) {
  const res = await api.post('/auth/verify-email', { email, otp_code: otpCode });
  return res.data;
}

export async function resendOtpApi(email: string) {
  const res = await api.post('/auth/resend-otp', { email });
  return res.data;
}

export async function loginApi(data: {
  email: string;
  password: string;
}) {
  const res = await api.post('/auth/login', data);
  return res.data;
}

export async function getMeApi() {
  const res = await api.get('/auth/me');
  return res.data;
}

export async function logoutApi() {
  const res = await api.post('/auth/logout');
  return res.data;
}

export async function getProfileApi() {
  const res = await api.get('/auth/profile');
  return res.data;
}

export async function updateProfileApi(data: {
  full_name?: string;
  username?: string;
  avatar_url?: string;
}) {
  const res = await api.patch('/auth/profile', data);
  return res.data;
}

export async function forgotPasswordApi(email: string) {
  const res = await api.post('/auth/resend-otp', { email });
  return res.data;
}

export async function resetPasswordApi(email: string, otpCode: string, newPassword: string, confirmPassword?: string) {
  const res = await api.post('/auth/verify-email', { email, otp_code: otpCode });
  return res.data;
}

export async function sendMessageApi(message: string, chatId?: string, model: string = 'gemini-3.6-flash') {
  const res = await api.post('/chat/message', {
    message,
    chat_id: chatId,
    model,
  });
  return res.data;
}

export async function fetchConversationsApi() {
  const res = await api.get('/chat/conversations');
  return res.data;
}

export async function createConversationApi(title?: string) {
  const res = await api.post('/chat/conversations', { title });
  return res.data;
}

export async function deleteConversationApi(chatId: string) {
  const res = await api.delete(`/chat/conversations/${chatId}`);
  return res.data;
}

export async function togglePinConversationApi(chatId: string) {
  const res = await api.put(`/chat/conversations/${chatId}/pin`);
  return res.data;
}

export async function processToolApi(toolType: string, inputText: string, extraParams: any = {}) {
  const res = await api.post('/tools/process', {
    tool_type: toolType,
    input_text: inputText,
    extra_params: extraParams,
  });
  return res.data;
}

export async function uploadDocumentApi(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/docs/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export const uploadDocApi = uploadDocumentApi;

export async function generateImageApi(prompt: string, aspectRatio: string = '1:1') {
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('aspect_ratio', aspectRatio);
  const res = await api.post('/images/generate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function fetchNewsFeedApi(category: string = 'all') {
  const res = await api.get(`/news/feed?category=${category}`);
  return res.data;
}
