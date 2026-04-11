import axios from 'axios';

import { createClient } from './supabase';

// 브라우저 환경(배포)에서는 Vercel rewrites(/api)를 통해 EC2로 프록시
// 로컬 개발에서는 NEXT_PUBLIC_API_URL 직접 사용
const baseURL =
  typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
    ? '/api'
    : process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});
