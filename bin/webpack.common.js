import BUILD from '../.build.json' assert { type: 'json' };
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import webpack from 'webpack';

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
  plugins: [
    new webpack.DefinePlugin({ __BUILD__: JSON.stringify(BUILD) }),
  ],
  resolve: {
    extensions: ['.js', '.ts'],
    plugins: [
      new TsconfigPathsPlugin({ configFile: './tsconfig.json' }),
    ],
  },
  target: 'web',
};
