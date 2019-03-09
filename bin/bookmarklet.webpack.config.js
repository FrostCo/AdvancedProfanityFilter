const path = require('path');

module.exports = {
  entry: {
    bookmarkFilter: './src/script/bookmarkFilter.ts'
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