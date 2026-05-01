module.exports = {
  displayName: 'content-pipeline-backend',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      { tsconfig: '<rootDir>/tsconfig.spec.json' },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@toy-monorepo/types$': '<rootDir>/../../../packages/types/src/index.ts',
    '^@toy-monorepo/common$': '<rootDir>/../../../packages/common/src/index.ts',
    '^@content-pipeline/types$': '<rootDir>/../types/index.ts',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/apps/content-pipeline/backend',
};
