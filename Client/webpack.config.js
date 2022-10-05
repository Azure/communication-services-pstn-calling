// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const HtmlWebPackPlugin = require('html-webpack-plugin');
const path = require('path');

const env = process.env;
env.development = true;

const PORT = env.port || 9000;

const isProd =
  env.development == null ||
  !env.development ||
  env.development == 'false' ||
  (env.production != null && (env.production == true || env.production == 'true'));

module.exports = (env) => ({
  devtool: 'eval-source-map',
  entry: './src/index.tsx',
  output: {
    path: path.join(__dirname, 'dist/build'),
    filename: 'build.js'
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: [/dist/, /node_modules/],
        loader: 'ts-loader',
        options: {
          transpileOnly: true
        }
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader'
          }
        ]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: './public/index.html',
      filename: './index.html'
    })
  ],
  devServer: {
    open: true,
    hot: true,
    port: PORT,
    proxy: [
      {
        path: '/connectionString',
        target: 'https://[::1]:44393',
        secure: false
      },
      {
        path: '/configure',
        target: 'https://[::1]:44393',
        secure: false
      },
      {
        path: '/routing',
        target: 'https://[::1]:44393',
        secure: false
      },
      {
        path: '/phonenumbers',
        target: 'https://[::1]:44393',
        secure: false
      },
      {
        path: '/tokens/provisionUser',
        target: 'https://[::1]:44393',
        secure: false
      }
    ]
  }
});
