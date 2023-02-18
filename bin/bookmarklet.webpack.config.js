/* eslint-disable @typescript-eslint/naming-convention */
const TerserPlugin = require('terser-webpack-plugin'); // eslint-disable-line @typescript-eslint/no-var-requires
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  entry: {
    bookmarkletFilter: './src/script/mainBookmarklet.ts',
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
          keep_classnames: undefined,
          keep_fnames: false,
          safari10: false,
        },
      }),
    ],
  },
  resolve: {
    extensions: ['.js', '.ts'],
    plugins: [
      new TsconfigPathsPlugin({ configFile: './tsconfig.json' }),
    ],
  },
  target: 'web',
};
