const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');

const BASE_URL = '.';
module.exports = {
  entry: ['./src/main.js'],
  output: {
    filename: '[name:8].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  devServer: {
    historyApiFallback: true, //historyApiFallback设置为true那么所有的路径都执行index.html。
    overlay: true, // 将错误显示在html之上
    contentBase: path.join(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.less$/,
        use: ['style-loader', 'css-loader', 'less-loader'],
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]',
        },
      },
      {
        test: /\.(png|jpg|gif)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
            },
          },
        ],
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        // options: {
        //   loaders: {
        //     scss: ['style-loader', 'css-loader', 'sass-loader'],
        //     sass: ['style-loader', 'css-loader', 'sass-loader'],
        //     less: ['style-loader', 'css-loader', 'less-loader'],
        //   },
        // },
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      templateParameters: {
        BASE_URL: '/',
      },
      inject: true,
      hash: new Date().getTime(),
      url: BASE_URL, //需要这里传参
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true,
      },
      chunksSortMode: 'manual',
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
};
