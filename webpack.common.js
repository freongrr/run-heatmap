const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const NormalModuleReplacementPlugin = require('webpack').NormalModuleReplacementPlugin;

module.exports = {
    entry: './src/index.tsx',
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
    plugins: (process.env.ANALYZE_BUNDLE ? [new BundleAnalyzerPlugin()] : []).concat([
        new HtmlWebpackPlugin({template: 'public/index.html'}),
        new NormalModuleReplacementPlugin(/src\/config\/index\.ts/, 'index.custom.ts'),
    ]),
    output: {
        filename: '[name].[contenthash].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true
    }
};
