import { z } from 'zod';

const VALIDATION = {
  patterns: {
    hasLetter: /[a-zA-Z]/,
    hasNumber: /[0-9]/,
    alphanumericOnly: /^[a-zA-Z0-9]+$/,
  },
  username: { min: 4, max: 20 },
  password: { min: 8, max: 20 },
} as const;

export const loginSchema = z.object({
  username: z
    .string()
    .min(4, '아이디는 4자 이상이어야 합니다')
    .max(20, '아이디는 20자 이하여야 합니다')
    .regex(
      VALIDATION.patterns.alphanumericOnly,
      '아이디는 영문과 숫자만 사용 가능합니다',
    )
    .regex(VALIDATION.patterns.hasLetter, '아이디에 영문이 포함되어야 합니다')
    .regex(VALIDATION.patterns.hasNumber, '아이디에 숫자가 포함되어야 합니다'),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다')
    .max(20, '비밀번호는 20자 이하여야 합니다')
    .regex(VALIDATION.patterns.hasLetter, '비밀번호에 영문이 포함되어야 합니다')
    .regex(
      VALIDATION.patterns.hasNumber,
      '비밀번호에 숫자가 포함되어야 합니다',
    ),
});

export type LoginFormData = z.infer<typeof loginSchema>;
