'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '../schemas/login.schema';

export function useLoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    // TODO: API 연결 시 구현
    console.info('Login submitted:', data.username);
  };

  return {
    ...form,
    onSubmit: form.handleSubmit(onSubmit),
  };
}
