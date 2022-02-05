module.exports = {
  entry: {
    background: './src/script/background.ts',
    optionPage: './src/script/optionPage.ts',
    popup: './src/script/popup.ts',
    showErrors: '/src/script/showErrors.ts',
    webFilter: './src/script/webFilter.ts',
  },
  mode: 'production',
  module: {
    rules: [
      {
        exclude: /(node_modules|bower_components)/,
        test: /\.tsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/typescript',
            ],
            plugins: [
              '@babel/proposal-class-properties',
              '@babel/proposal-object-rest-spread',
            ]
          }
        }
      }
    ]
  },
  optimization: {
    minimize: false
  },
  resolve: {
    extensions: ['.js', '.ts']
  },
  target: 'web',
};
