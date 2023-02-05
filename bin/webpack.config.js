const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
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
        use: 'ts-loader',
      },
    ]
  },
  optimization: {
    minimize: false
  },
  resolve: {
    extensions: ['.js', '.ts'],
    plugins: [
      new TsconfigPathsPlugin({ configFile: "./tsconfig.json" }),
    ],
  },
  target: 'web',
};
