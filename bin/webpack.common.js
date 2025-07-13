/* eslint-disable no-console */
import fs from 'fs-extra';
import path from 'path';
import CopyPlugin from 'copy-webpack-plugin';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import webpack from 'webpack';
import { execSync } from 'child_process';
import TerserPlugin from 'terser-webpack-plugin';
import BuildUtils from './lib/BuildUtils.js';
import { PostbuildPlugin } from './plugins/PostbuildPlugin.js';
import { TranslationBuilderPlugin } from './plugins/TranslationBuilderPlugin.js';
import { PackExtensionPlugin } from './plugins/PackExtensionPlugin.js';

const projectRoot = process.cwd();

if (!fs.existsSync(BuildUtils.buildFilePath)) {
  console.warn(`⚠️ ${BuildUtils.buildFilePath} file not found. Running prebuild script...\n`);
  execSync('node bin/cli/prebuild.js', { stdio: 'inherit' });
}

const BUILD = fs.readJsonSync(BuildUtils.buildFilePath);
console.log(`${BuildUtils.buildDetailsMessage(BUILD)}\n🛠️ Starting build...\n`);

export default {
  entry: {
    background: './src/script/entry/background.ts',
    'option-page': './src/script/entry/option-page.ts',
    popup: './src/script/entry/popup.ts',
    'show-errors': '/src/script/entry/show-errors.ts',
    'web-filter': './src/script/entry/web-filter.ts',
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
    new PostbuildPlugin(),
    new PackExtensionPlugin(),
  ],
  resolve: {
    extensions: ['.js', '.ts'],
    plugins: [new TsconfigPathsPlugin({ configFile: './tsconfig.json' })],
  },
  stats: 'minimal',
  target: 'web',
};
