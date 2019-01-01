const path = require('path');

module.exports = {
  entry: {
    eventPage: './src/eventPage.ts',
    webFilter: './src/webFilter.ts',
    optionPage: './src/optionPage.ts',
    popup: './src/popup.ts'
  },
  output: {
    path: path.resolve('dist'),
  },
  mode: 'production',
  optimization: {
    minimize: false
  },
  module: {
    rules: [
      {
        exclude: /(node_modules|bower_components)/,
        test: /\.tsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            "presets": [
              "@babel/typescript",
            ],
            "plugins": [
              "@babel/proposal-class-properties",
              "@babel/proposal-object-rest-spread",
            ]
          }
        }
      }
    ]
  },
  target: 'web',
  resolve: {
    extensions: ['.js', '.ts']
  }
};