/* eslint-disable no-console */
import fs from 'fs-extra';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import webpack from 'webpack';
import { execSync } from 'child_process';

if (!fs.existsSync('.build.json')) {
  console.warn('.build.json file not found. Running prebuild script...\n');
  execSync('node bin/prebuild.js', { stdio: 'inherit' });
}

const BUILD = fs.readJsonSync('.build.json');
console.log(`Build details:\n${JSON.stringify(BUILD, null, 2)}`);

export default {
  entry: {
    background: './src/script/mainBackground.ts',
    optionPage: './src/script/mainOptionPage.ts',
    popup: './src/script/mainPopup.ts',
    showErrors: '/src/script/showErrors.ts',
    webFilter: './src/script/mainContent.ts',
  },
  mode: 'production',
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              // Ignore typescript errors
              transpileOnly: false,
            },
          },
        ],
      },
    ],
  },
  optimization: {
    minimize: true,
  },
  performance: {
    hints: false,
  },
  plugins: [new webpack.DefinePlugin({ __BUILD__: JSON.stringify(BUILD) })],
  resolve: {
    extensions: ['.js', '.ts'],
    plugins: [new TsconfigPathsPlugin({ configFile: './tsconfig.json' })],
  },
  stats: 'minimal',
  target: 'web',
};
