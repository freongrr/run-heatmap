const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const NormalModuleReplacementPlugin = require('webpack').NormalModuleReplacementPlugin;

module.exports = {
    entry: './src/index.tsx',
    devtool: 'inline-source-map',
    devServer: {
        contentBase: './dist',
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
        }, {
            test: /\.scss$/,
            use: ['style-loader', 'css-loader', 'sass-loader']
        }, {
            test: /\.gpx$/,
            type: 'asset/resource'
        }]
    },
    resolve: {
        alias: {
            '@src': path.resolve(__dirname, 'src'),
        },
        extensions: ['.tsx', '.ts', '.js'],
    },
    plugins: [
        new HtmlWebpackPlugin({template: 'public/index.html'}),
        new NormalModuleReplacementPlugin(/src\/config\/index\.ts/, 'index.custom.ts'),
    ],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true
    }
};
