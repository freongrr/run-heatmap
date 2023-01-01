const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const WorkboxPlugin = require('workbox-webpack-plugin');

module.exports = merge(common, {
    mode: 'production',
    devtool: 'source-map',
    plugins: [
        new WorkboxPlugin.GenerateSW({
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
            swDest: 'run-heatmap-sw.js',
            cacheId: 'run-heatmap-assets',
            runtimeCaching: [
                {
                    urlPattern: new RegExp('.*/api.mapbox.com/.*'),
                    handler: 'NetworkOnly'
                },
                {
                    urlPattern: new RegExp('.*/tracks.*'),
                    handler: 'NetworkFirst',
                    options: {
                        cacheName: 'tracks'
                    }
                }]
        })
    ],
    optimization: {
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                },
            },
        },
    },
});
