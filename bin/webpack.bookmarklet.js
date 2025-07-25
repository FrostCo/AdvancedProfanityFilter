/* eslint-disable no-console */
import fs from 'fs-extra';
import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import webpack from 'webpack';
import BuildUtils from './lib/BuildUtils.js';
import { BookmarkletTranslationBuilderPlugin } from './plugins/BookmarkletTranslationBuilderPlugin.js';

const projectRoot = process.cwd();

const BUILD = fs.readJsonSync(BuildUtils.buildFilePath);

console.log(`${BuildUtils.buildDetailsMessage(BUILD)}\n🛠️ Starting build...\n`);

export default {
  entry: {
    bookmarklet: './src/script/entry/bookmarklet.ts',
  },
  output: {
    path: path.resolve(projectRoot, 'dist-bookmarklet'),
    clean: true,
  },
  externals: {
    i18next: 'undefined',
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
              // Ignore TypeScript errors
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
        extractComments: false, // Don't create LICENSE.txt files
        terserOptions: {
          ecma: undefined,
          warnings: false,
          parse: {},
          compress: {},
          mangle: true, // Note `mangle.properties` is `false` by default.
          module: false,
          output: {
            comments: 'some',
          },
          toplevel: false,
          nameCache: null,
          ie8: false,
          keep_classnames: false,
          keep_fnames: false,
          safari10: false,
        },
      }),
    ],
    moduleIds: 'deterministic',
  },
  performance: {
    hints: false,
  },
  plugins: [new BookmarkletTranslationBuilderPlugin(), new webpack.DefinePlugin({ __BUILD__: JSON.stringify(BUILD) })],
  resolve: {
    extensions: ['.js', '.ts'],
    plugins: [new TsconfigPathsPlugin({ configFile: './tsconfig.json' })],
  },
  stats: 'minimal',
  target: 'web',
};
