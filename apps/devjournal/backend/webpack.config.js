const { join } = require('path');

const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  externals: [nodeExternals({ allowlist: ['@google/generative-ai'] })],
  resolve: {
    alias: {
      '@': join(__dirname, 'src'),
    },
  },
  output: {
    path: join(__dirname, '../../../dist/apps/devjournal/backend'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMap: true,
    }),
  ],
};
