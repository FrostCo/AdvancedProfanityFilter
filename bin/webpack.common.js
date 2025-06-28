/* eslint-disable no-console */
import fs from 'fs-extra';
import path from 'path';
import CopyPlugin from 'copy-webpack-plugin';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import webpack from 'webpack';
import { execSync } from 'child_process';
import TerserPlugin from 'terser-webpack-plugin';
import { TranslationBuilderPlugin } from './plugins/TranslationBuilderPlugin.js';

const projectRoot = process.cwd();

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
  output: {
    path: path.resolve(projectRoot, 'dist'),
    clean: true,
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
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: true,
          mangle: true,
          output: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
    moduleIds: 'deterministic',
  },
  performance: {
    hints: false,
  },
  plugins: [
    new TranslationBuilderPlugin(),
    new webpack.DefinePlugin({ __BUILD__: JSON.stringify(BUILD) }),
    new CopyPlugin({
      patterns: [
        { from: path.resolve(projectRoot, 'src/img'), to: './img' },
        { from: path.resolve(projectRoot, 'src/static'), to: './' },
      ],
    }),
  ],
  resolve: {
    extensions: ['.js', '.ts'],
    plugins: [new TsconfigPathsPlugin({ configFile: './tsconfig.json' })],
  },
  stats: 'minimal',
  target: 'web',
};
