import fs from 'fs-extra';
import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import webpack from 'webpack';

const projectRoot = process.cwd();

const BUILD = fs.readJsonSync('.build.json');

export default {
  entry: {
    bookmarkletFilter: './src/script/mainBookmarklet.ts',
  },
  output: {
    path: path.resolve(projectRoot, 'dist-bookmarklet'),
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
  plugins: [new webpack.DefinePlugin({ __BUILD__: JSON.stringify(BUILD) })],
  resolve: {
    extensions: ['.js', '.ts'],
    plugins: [new TsconfigPathsPlugin({ configFile: './tsconfig.json' })],
  },
  stats: 'minimal',
  target: 'web',
};
