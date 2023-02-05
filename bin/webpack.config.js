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
