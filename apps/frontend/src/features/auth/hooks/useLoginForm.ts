'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { useForm } from 'react-hook-form';

import { useLoginMutation } from './useLoginMutation';
import { LoginFormData, loginSchema } from '../schemas/login.schema';

interface ApiError {
  message: string;
  statusCode: number;
}

export function useLoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const loginMutation = useLoginMutation({
    onError: (error) => {
      const axiosError = error as AxiosError<ApiError>;
      const message =
        axiosError.response?.data?.message || '로그인에 실패했습니다.';
      form.setError('root', { message });
    },
  });

  const onSubmit = (data: LoginFormData) => loginMutation.mutate(data);

  return {
    ...form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: loginMutation.isPending,
  };
}
