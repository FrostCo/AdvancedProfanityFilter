const path = require('path');

module.exports = {
  entry: {
    eventPage: './src/eventPage.ts',
    filter: './src/filter.ts',
    optionPage: './src/optionPage.ts',
    popup: './src/popup.ts'
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  }
};
