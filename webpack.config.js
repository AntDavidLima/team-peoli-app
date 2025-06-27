const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: './index.html',
      favicon: './public/favicon.ico'
    })
  ]
  resolve: {
    alias: {
      'react-native$': 'react-native-web',
      '@react-native-async-storage/async-storage': path.resolve(
        __dirname,
        'mocks/async-storage.js'
      ),
      './Platform': 'react-native-web/dist/exports/Platform',
    },
    extensions: ['.web.js', '.js', '.json', '.web.jsx', '.jsx'],
    return config;
  }
}