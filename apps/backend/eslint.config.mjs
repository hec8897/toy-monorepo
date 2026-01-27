import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      // 🔧 NestJS/Backend 전용 규칙

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // console.log만 error, 나머지는 warn (커밋 가능)
      'no-console': ['error', { allow: ['warn', 'error', 'info', 'debug'] }],

      // 코드 품질
      'no-return-await': 'error',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
    rules: {
      // 테스트 파일에서는 일부 규칙 완화
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
];
