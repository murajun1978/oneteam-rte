const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const PORT = process.env.PORT || 8008;

const entry = [
  `webpack-dev-server/client?http://localhost:${PORT}`,
  'webpack/hot/only-dev-server',
  'react-hot-loader/patch',
  'babel-polyfill',
  './examples/index.js'
];
const plugins = [
  new webpack.HotModuleReplacementPlugin(),
  new HtmlWebpackPlugin()
];

module.exports = {
  plugins,
  entry,
  cache: true,
  output: {
    path: path.resolve(__dirname, 'examples'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.styl$/,
        use: ['style-loader', 'css-loader', 'stylus-loader']
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: `url-loader?${JSON.stringify({ limit: 10000, mimetype: 'application/font-woff' })}`
      },
      {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file-loader'
      }
    ]
  },
  devServer: {
    contentBase: './examples',
    hot: true,
    host: '0.0.0.0',
    port: parseInt(PORT, 10)
  }
};