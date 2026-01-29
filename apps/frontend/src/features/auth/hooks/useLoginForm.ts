'use client';

import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';

import { LoginFormData, loginSchema } from '../schemas/login.schema';

import { useAuth } from '@/shared/hooks/useAuth';

interface ApiError {
  message: string;
  statusCode: number;
}

export function useLoginForm() {
  const { loginMutation } = useAuth();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync(data);
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      const message =
        axiosError.response?.data?.message || '로그인에 실패했습니다.';
      form.setError('root', { message });
    }
  };

  return {
    ...form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: loginMutation.isPending,
  };
}
